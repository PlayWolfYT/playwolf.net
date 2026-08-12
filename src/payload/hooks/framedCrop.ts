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
  // Admin sends uploadEdits via qs; after qs.parse every number is a string.
  // Stock Payload cropImage coerces those strings — we must too, or we miss
  // the crop, skip clearing uploadEdits.crop, and sharp dies on left < 0.
  const incomingCrop = cropFromUploadEdits(uploadEdits) ?? cropFromData(mutating.data);
  const hasUploadEditsCrop = hasCropProperty(uploadEdits);

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

  // Alt-text edits leave uploadEdits.crop unset. Any present crop (even a
  // no-op re-save) must still go through us so Payload never sees OOB percents.
  if (!hasNewFile && !cropChanged && !hasUploadEditsCrop) {
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
  // Mutate the same object `parseUploadEditsFromReqOrIncomingData` returns
  // (it re-reads req.query.uploadEdits), so generateFileData must not see crop.
  clearStockCropEdits(req);

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
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as UploadEditsQuery;
}

function hasCropProperty(uploadEdits: UploadEditsQuery | undefined): boolean {
  return Boolean(uploadEdits && "crop" in uploadEdits && uploadEdits.crop != null);
}

/** Strip the fields generateFileData forwards into stock cropImage. */
function clearStockCropEdits(req: PayloadRequest): void {
  const uploadEdits = readUploadEdits(req);
  if (!uploadEdits) return;
  delete uploadEdits.crop;
  delete uploadEdits.widthInPixels;
  delete uploadEdits.heightInPixels;
}

/**
 * qs.parse leaves numeric query values as strings. Number.isFinite rejects
 * those, so callers must coerce before validating.
 */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rectFromUnknown(crop: unknown): Rect | null {
  if (!crop || typeof crop !== "object") return null;
  const raw = crop as Record<string, unknown>;
  const x = toFiniteNumber(raw.x);
  const y = toFiniteNumber(raw.y);
  const width = toFiniteNumber(raw.width);
  const height = toFiniteNumber(raw.height);
  if (x == null || y == null || width == null || height == null) return null;
  return { x, y, width, height };
}

/** Exported for unit tests — admin uploadEdits arrive as qs string coords. */
export function cropFromUploadEdits(
  uploadEdits: UploadEditsQuery | undefined,
): Rect | null {
  return rectFromUnknown(uploadEdits?.crop);
}

function cropFromData(data: { crop?: unknown } | null | undefined): Rect | null {
  return rectFromUnknown(data?.crop);
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

  // Defensive: sharp.extract rejects negatives outright. padAndExtractForRect
  // is supposed to guarantee non-negative offsets after extend — never bypass.
  if (
    extract.left < 0 ||
    extract.top < 0 ||
    !Number.isInteger(extract.left) ||
    !Number.isInteger(extract.top) ||
    !Number.isInteger(extract.width) ||
    !Number.isInteger(extract.height)
  ) {
    throw new Error(
      `framedCrop: refusing sharp.extract with left=${extract.left} top=${extract.top} ` +
        `width=${extract.width} height=${extract.height} (must be non-negative integers)`,
    );
  }

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
