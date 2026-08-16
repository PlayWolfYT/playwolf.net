import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from "payload";
import sharp from "sharp";

import {
  clampRectToOutset,
  FULL_FRAME_RECT,
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

/**
 * Ceiling on the canvas `extend` may produce, checked before sharp allocates.
 *
 * `clampRectToOutset` already bounds the crop to the frame's stage, which caps
 * the canvas at `(1 + 2 × maxOutset)²` times the original — but the *original*
 * is only bounded by the 32 MB upload limit, and 32 MB of PNG can decode to
 * hundreds of megapixels. Both limits are needed; this is the one that does not
 * depend on the request being well-formed.
 *
 * 100 MP leaves real headroom: the widest derivative this site emits is 2560px,
 * and the drawer's own default selection on a 4096×4096 friend avatar (the
 * largest outset of any frame) pads to roughly 60 MP.
 */
const MAX_PADDED_PIXELS = 100_000_000;

/**
 * Sidecar keys replaced during this request, keyed by `collection:id`, waiting
 * for the save to actually succeed before they are dropped. Keyed rather than
 * a single value because one bulk update runs this hook once per document and
 * `req.context` is shared across all of them.
 */
const SUPERSEDED_ORIGINALS = "framedCropSupersededOriginals";

function contextSlot(req: PayloadRequest, name: string): Map<string, string> {
  const context = req.context as Record<string, unknown>;
  const existing = context[name];
  if (existing instanceof Map) return existing as Map<string, string>;
  const created = new Map<string, string>();
  context[name] = created;
  return created;
}

function contextKey(collection: string, id: number | string): string {
  return `${collection}:${id}`;
}

function takeContextKey(
  req: PayloadRequest,
  name: string,
  collection: string,
  id: number | string | undefined,
): string | undefined {
  if (id == null) return undefined;
  const slot = (req.context as Record<string, unknown>)[name];
  if (!(slot instanceof Map)) return undefined;
  const key = contextKey(collection, id);
  const value = slot.get(key);
  slot.delete(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

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
  overrideAccess,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const slug = collection.slug;
  if (!isFramedSlug(slug)) return args;

  /**
   * `beforeOperation` runs *before* `executeAccess`, so an anonymous
   * `POST /api/site-images` reaches everything below — decoding an attacker's
   * file with sharp and writing a permanent `originals/` object — and only then
   * gets its 403. Returning the args untouched hands the request straight to
   * the access check that refuses it, having stored nothing.
   *
   * `overrideAccess` is the same flag the operation feeds `executeAccess`, so
   * this cannot diverge from it: the Local API (seeds, migrations) defaults it
   * to true and keeps working with no user.
   */
  if (!overrideAccess && !req.user) return args;

  const mutating = args as MutatingArgs;
  const frame = UPLOAD_FRAMES[slug];
  const file = req.file;
  const hasNewFile = Boolean(file?.data?.length);
  const uploadEdits = readUploadEdits(req);
  // Admin sends uploadEdits via qs; after qs.parse every number is a string.
  // Stock Payload cropImage coerces those strings — we must too, or we miss
  // the crop, skip clearing uploadEdits.crop, and sharp dies on left < 0.
  const requestedCrop = cropFromUploadEdits(uploadEdits) ?? cropFromData(mutating.data);
  // The rect is request data all the way from the browser, and every canvas
  // dimension below is derived from it. Clamp before anything measures it.
  const incomingCrop =
    requestedCrop && clampRectToOutset(requestedCrop, frame.maxOutset);
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

  // Documents written before the clamp existed can still hold an unbounded
  // rect, so the stored value goes through it too.
  const rect = clampRectToOutset(
    incomingCrop ?? previousCrop ?? FULL_FRAME_RECT,
    frame.maxOutset,
  );

  mutating.data = mutating.data ?? {};

  let sourceBytes: Buffer;
  let sourceMeta: {
    width: number;
    height: number;
    mimeType: string;
    filename?: string | null;
  };

  if (hasNewFile && file?.data) {
    sourceBytes = file.data;
    const meta = await sharp(sourceBytes).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!(width > 0 && height > 0)) {
      throw new Error(`Could not read dimensions for upload in ${slug}`);
    }

    const key = buildOriginalKey(slug, file.name);
    await putOriginal(key, sourceBytes, file.mimetype);

    /**
     * Store first, release second. Dropping the old sidecar before the new
     * `source.key` is committed loses the original outright if the save then
     * fails: `getOriginal` answers a missing key with `null` by design, so the
     * next re-crop adopts the already-cropped WebP as the "original" and every
     * pixel outside the last crop is gone, silently. Deferring the delete to
     * `afterChange` costs an orphaned object when a save fails, which is
     * garbage someone can collect rather than data nobody can recover.
     */
    const previousKey = originalDoc?.source?.key;
    if (
      mutating.id != null &&
      typeof previousKey === "string" &&
      previousKey.length > 0 &&
      previousKey !== key
    ) {
      contextSlot(req, SUPERSEDED_ORIGINALS).set(
        contextKey(slug, mutating.id),
        previousKey,
      );
    }

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
 * Releases the sidecar a replacement upload superseded, now that the row
 * naming the replacement is committed. See the store-first comment above for
 * why this cannot happen while the crop is still being derived.
 */
export const reclaimFramedOriginalAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  req,
}) => {
  const key = takeContextKey(
    req,
    SUPERSEDED_ORIGINALS,
    collection.slug,
    (doc as CropDoc | undefined)?.id,
  );
  if (!key) return doc;

  try {
    await deleteOriginal(key);
  } catch (error) {
    req.payload.logger.warn(
      { err: error, key },
      "Failed to delete superseded framed-crop original sidecar",
    );
  }

  return doc;
};

/**
 * Drop the sidecar when the document itself is deleted. Runs after the row is
 * gone so a failed delete cannot orphan the public file while removing the
 * only recoverable original.
 *
 * `source` is authenticated-only rather than `hidden`, so it is still on the
 * document handed to this hook — a delete that got this far had a user.
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

/**
 * Resolves an upload's `url` against the configured `serverURL`, and refuses
 * anything that does not land on it.
 *
 * The base used to come from the request's `Origin`/`Host`, both of which the
 * caller chooses freely — so an upload with a relative `url` could be turned
 * into a server-side GET against any host the attacker named, with this
 * process's network position. `serverURL` is configuration, not request data,
 * which makes it the only trustworthy base available here.
 */
function trustedFileURL(url: string, req: PayloadRequest): URL | null {
  const base = req.payload.config.serverURL;
  if (!base) return null;

  try {
    const resolved = new URL(url, base);
    return resolved.origin === new URL(base).origin ? resolved : null;
  } catch {
    return null;
  }
}

async function fetchMainFileViaUrl(
  originalDoc: CropDoc | null,
  req: PayloadRequest,
): Promise<Buffer | null> {
  const url = originalDoc?.url;
  if (typeof url !== "string" || !url) return null;

  const fileURL = trustedFileURL(url, req);
  if (!fileURL) {
    req.payload.logger.warn(
      { serverURL: req.payload.config.serverURL, url },
      "Refusing to fetch a framed-crop main file off this deployment's own origin",
    );
    return null;
  }

  try {
    // No credentials: every framed collection is `read: anyone`, so the file
    // route needs none, and forwarding the operator's session cookie would let
    // this fetch reach anything that session can.
    const res = await fetch(fileURL, { method: "GET" });
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
  const { pad, padded, extract } = padAndExtractForRect(rect, sourceSize);

  const paddedPixels = padded.width * padded.height;
  if (paddedPixels > MAX_PADDED_PIXELS) {
    throw new Error(
      `framedCrop: refusing to pad to ${padded.width}×${padded.height} ` +
        `(${paddedPixels} pixels, ceiling ${MAX_PADDED_PIXELS})`,
    );
  }

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
