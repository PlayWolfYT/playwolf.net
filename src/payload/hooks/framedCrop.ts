import type {
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from "payload";
import sharp from "sharp";

import {
  FULL_FRAME_RECT,
  normalizeRect,
  padAndExtractForRect,
  rectsAlmostEqual,
  type Rect,
} from "../cropGeometry";
import {
  buildOriginalKey,
  deleteOriginal,
  getOriginal,
  putOriginal,
} from "../originals/store";
import {
  UPLOAD_FRAMES,
  type FramedCollectionSlug,
  type UploadFrame,
} from "../uploadFrames";

type SourceFields = {
  key?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
};

type CropDoc = {
  id?: number | string;
  filename?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  source?: SourceFields | null;
  crop?: Partial<Rect> | null;
};

type MutatingArgs = {
  data?: Record<string, unknown>;
  id?: number | string;
  overwriteExistingFiles?: boolean;
  req: PayloadRequest;
};

type UploadEditsCrop = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type UploadEditsQuery = {
  crop?: UploadEditsCrop;
  widthInPixels?: number;
  heightInPixels?: number;
  focalPoint?: { x?: number; y?: number };
};

/**
 * Non-destructive crop for the four framed upload collections.
 *
 * Payload's stock `cropImage` rewrites the stored file in place, so a second
 * crop compounds on the first and anything outside the previous selection is
 * gone. We keep a pristine sidecar under `originals/` and, on every create or
 * re-crop, re-derive the public file from it: pad the canvas (`extend`) so
 * out-of-bounds selections are legal, extract the rect, encode WebP into
 * `req.file`, and clear `uploadEdits.crop` so Payload never runs its own crop
 * on top. The rect lives on the document as original-percent so the drawer can
 * restore it next time.
 *
 * Runs as `beforeOperation` because that is the last seam before
 * `generateFileData` reads `req.file` / `overwriteExistingFiles`.
 */
export const framedCropBeforeOperation: CollectionBeforeOperationHook = async ({
  args,
  collection,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const slug = collection.slug;
  if (!isFramedSlug(slug)) return args;

  const mutating = args as MutatingArgs;
  const file = req.file;
  const hasNewFile = Boolean(file?.data?.length);
  const uploadEdits = readUploadEdits(req);
  const incomingCrop = cropFromUploadEdits(uploadEdits) ?? cropFromData(mutating.data);

  // Bulk updates have no id; without a new file there is nothing for us to do.
  if (operation === "update" && mutating.id == null && !hasNewFile) {
    return args;
  }

  let originalDoc: CropDoc | null = null;
  if (operation === "update" && mutating.id != null) {
    originalDoc = await loadOriginalDoc(req, slug, mutating.id);
  }

  const previousCrop = cropFromData(originalDoc ?? undefined);
  const cropChanged =
    incomingCrop != null &&
    !rectsAlmostEqual(incomingCrop, previousCrop ?? FULL_FRAME_RECT);

  // Alt-text edits (and other non-file saves) leave uploadEdits.crop unset.
  if (!hasNewFile && !cropChanged) {
    return args;
  }

  const frame = UPLOAD_FRAMES[slug];
  const rect = normalizeRect(incomingCrop ?? previousCrop ?? FULL_FRAME_RECT);

  mutating.data = mutating.data ?? {};

  let sourceBytes: Buffer;
  let sourceMeta: {
    width: number;
    height: number;
    mimeType: string;
    filename?: string | null;
  };

  if (hasNewFile && file?.data) {
    const previousKey = originalDoc?.source?.key;
    if (typeof previousKey === "string" && previousKey.length > 0) {
      await deleteOriginal(previousKey);
    }

    sourceBytes = file.data;
    const meta = await sharp(sourceBytes).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!(width > 0 && height > 0)) {
      throw new Error(`Could not read dimensions for upload in ${slug}`);
    }

    const key = buildOriginalKey(slug, file.name);
    await putOriginal(key, sourceBytes, file.mimetype);

    sourceMeta = {
      width,
      height,
      mimeType:
        file.mimetype ||
        (meta.format ? `image/${meta.format}` : "application/octet-stream"),
      filename: file.name,
    };
    mutating.data.source = {
      key,
      width,
      height,
      mimeType: sourceMeta.mimeType,
    };
  } else {
    const adopted = await resolveSourceBytes({
      collection: slug,
      originalDoc,
      req,
    });
    sourceBytes = adopted.body;
    sourceMeta = adopted.meta;
    mutating.data.source = {
      key: adopted.key,
      width: adopted.meta.width,
      height: adopted.meta.height,
      mimeType: adopted.meta.mimeType,
    };
  }

  const cropped = await cropToWebp({
    frame,
    rect,
    source: sourceBytes,
    sourceSize: { width: sourceMeta.width, height: sourceMeta.height },
  });

  const baseName = stripExtension(
    (hasNewFile ? file?.name : null) ??
      sourceMeta.filename ??
      originalDoc?.filename ??
      "image",
  );

  req.file = {
    name: `${baseName}.webp`,
    data: cropped,
    mimetype: "image/webp",
    size: cropped.length,
  };

  // Bypass Payload's stock cropImage — our buffer is already the final crop.
  if (uploadEdits) {
    delete uploadEdits.crop;
    delete uploadEdits.widthInPixels;
    delete uploadEdits.heightInPixels;
  }

  mutating.data.crop = rect;

  if (operation === "update") {
    mutating.overwriteExistingFiles = true;
  }

  return args;
};

/**
 * Drop the sidecar when the document itself is deleted. Runs after the row is
 * gone so a failed delete cannot orphan the public file while removing the
 * only recoverable original.
 */
export const cleanupFramedOriginalAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const key = (doc as CropDoc | undefined)?.source?.key;
  if (typeof key !== "string" || !key) return doc;

  try {
    await deleteOriginal(key);
  } catch (error) {
    req.payload.logger.warn(
      { err: error, key },
      "Failed to delete framed-crop original sidecar",
    );
  }

  return doc;
};

function isFramedSlug(slug: string): slug is FramedCollectionSlug {
  return Object.prototype.hasOwnProperty.call(UPLOAD_FRAMES, slug);
}

function readUploadEdits(req: PayloadRequest): UploadEditsQuery | undefined {
  const raw = req.query?.uploadEdits;
  if (!raw || typeof raw !== "object") return undefined;
  return raw as UploadEditsQuery;
}

function cropFromUploadEdits(uploadEdits: UploadEditsQuery | undefined): Rect | null {
  const crop = uploadEdits?.crop;
  if (!crop) return null;
  if (
    !Number.isFinite(crop.x) ||
    !Number.isFinite(crop.y) ||
    !Number.isFinite(crop.width) ||
    !Number.isFinite(crop.height)
  ) {
    return null;
  }
  return {
    x: crop.x as number,
    y: crop.y as number,
    width: crop.width as number,
    height: crop.height as number,
  };
}

function cropFromData(data: { crop?: unknown } | null | undefined): Rect | null {
  const crop = data?.crop;
  if (!crop || typeof crop !== "object") return null;
  const rect = crop as Partial<Rect>;
  if (
    !Number.isFinite(rect.x) ||
    !Number.isFinite(rect.y) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height)
  ) {
    return null;
  }
  return {
    x: rect.x as number,
    y: rect.y as number,
    width: rect.width as number,
    height: rect.height as number,
  };
}

async function loadOriginalDoc(
  req: PayloadRequest,
  collection: FramedCollectionSlug,
  id: number | string,
): Promise<CropDoc | null> {
  try {
    return (await req.payload.findByID({
      collection,
      id,
      depth: 0,
      overrideAccess: true,
      req,
      showHiddenFields: true,
    })) as CropDoc;
  } catch {
    return null;
  }
}

/**
 * Bytes of the pristine original for a re-crop. Prefers the sidecar; when a
 * legacy document has no `source.key` yet, copies the current main file into
 * a new sidecar and returns that — the first re-crop of a pre-migration doc
 * is still relative to its already-cropped pixels, but every crop after is
 * non-destructive.
 */
async function resolveSourceBytes({
  collection,
  originalDoc,
  req,
}: {
  collection: FramedCollectionSlug;
  originalDoc: CropDoc | null;
  req: PayloadRequest;
}): Promise<{
  body: Buffer;
  key: string;
  meta: { width: number; height: number; mimeType: string; filename?: string | null };
}> {
  const existingKey = originalDoc?.source?.key;
  if (typeof existingKey === "string" && existingKey.length > 0) {
    const stored = await getOriginal(existingKey);
    if (stored) {
      const width = originalDoc?.source?.width;
      const height = originalDoc?.source?.height;
      if (width && height) {
        return {
          body: stored.body,
          key: existingKey,
          meta: {
            width,
            height,
            mimeType:
              originalDoc?.source?.mimeType ||
              stored.contentType ||
              "application/octet-stream",
            filename: originalDoc?.filename,
          },
        };
      }

      const meta = await sharp(stored.body).metadata();
      if (!(meta.width && meta.height)) {
        throw new Error(
          `Sidecar original for ${collection}/${originalDoc?.id} has no dimensions`,
        );
      }
      return {
        body: stored.body,
        key: existingKey,
        meta: {
          width: meta.width,
          height: meta.height,
          mimeType:
            originalDoc?.source?.mimeType ||
            stored.contentType ||
            (meta.format ? `image/${meta.format}` : "application/octet-stream"),
          filename: originalDoc?.filename,
        },
      };
    }
  }

  const adopted = await adoptMainFileAsOriginal({ collection, originalDoc, req });
  return adopted;
}

async function adoptMainFileAsOriginal({
  collection,
  originalDoc,
  req,
}: {
  collection: FramedCollectionSlug;
  originalDoc: CropDoc | null;
  req: PayloadRequest;
}): Promise<{
  body: Buffer;
  key: string;
  meta: { width: number; height: number; mimeType: string; filename?: string | null };
}> {
  const filename = originalDoc?.filename;
  if (!filename) {
    throw new Error(
      `Cannot re-crop ${collection}/${originalDoc?.id ?? "?"}: no sidecar and no main filename`,
    );
  }

  // New uploads land at `<filename>`; the croppable-collections migration
  // placed remapped rows under `<collection>/<filename>`. Try both.
  const candidates = [`${collection}/${filename}`, filename];
  let body: Buffer | null = null;
  let contentType: string | undefined;

  for (const key of candidates) {
    const stored = await getOriginal(key);
    if (stored) {
      body = stored.body;
      contentType = stored.contentType;
      break;
    }
  }

  if (!body) {
    // Last resort: fetch through the public file URL Payload already serves.
    body = await fetchMainFileViaUrl(originalDoc, req);
  }

  if (!body) {
    throw new Error(
      `Cannot re-crop ${collection}/${originalDoc?.id}: main file ${filename} was not found in storage`,
    );
  }

  const meta = await sharp(body).metadata();
  const width = meta.width ?? originalDoc?.width ?? 0;
  const height = meta.height ?? originalDoc?.height ?? 0;
  if (!(width > 0 && height > 0)) {
    throw new Error(
      `Cannot re-crop ${collection}/${originalDoc?.id}: main file has no dimensions`,
    );
  }

  const mimeType =
    originalDoc?.mimeType ||
    contentType ||
    (meta.format ? `image/${meta.format}` : "application/octet-stream");
  const key = buildOriginalKey(collection, filename);
  await putOriginal(key, body, mimeType);

  return {
    body,
    key,
    meta: { width, height, mimeType, filename },
  };
}

async function fetchMainFileViaUrl(
  originalDoc: CropDoc | null,
  req: PayloadRequest,
): Promise<Buffer | null> {
  const url = originalDoc?.url;
  if (typeof url !== "string" || !url) return null;

  try {
    let fileURL = url;
    if (!url.startsWith("http")) {
      const baseUrl =
        req.headers.get("origin") || `${req.protocol}://${req.headers.get("host")}`;
      fileURL = `${baseUrl}${url}`;
    }

    const res = await fetch(fileURL, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      method: "GET",
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch (error) {
    req.payload.logger.warn(
      { err: error, url },
      "Failed to fetch main file while adopting framed-crop original",
    );
    return null;
  }
}

function sharpBackground(padBackground: UploadFrame["padBackground"]): {
  r: number;
  g: number;
  b: number;
  alpha: number;
} {
  if (padBackground === "transparent") {
    return { r: 0, g: 0, b: 0, alpha: 0 };
  }

  const hex = padBackground.slice(1);
  const value = Number.parseInt(hex, 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    alpha: 1,
  };
}

/**
 * Two sharp pipelines on purpose: within a single chain libvips applies a
 * pre-resize `extract` *before* `extend`, which would crop the unpadded image
 * and throw `extract_area: bad extract area` for any out-of-bounds rect.
 */
async function cropToWebp({
  frame,
  rect,
  source,
  sourceSize,
}: {
  frame: UploadFrame;
  rect: Rect;
  source: Buffer;
  sourceSize: { width: number; height: number };
}): Promise<Buffer> {
  const { pad, extract } = padAndExtractForRect(rect, sourceSize);
  const background = sharpBackground(frame.padBackground);

  const extended = await sharp(source)
    .ensureAlpha()
    .extend({ ...pad, background })
    .png()
    .toBuffer();

  return sharp(extended)
    .extract(extract)
    .webp({ quality: 82, alphaQuality: 100, effort: 4 })
    .toBuffer();
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") || "image";
}
