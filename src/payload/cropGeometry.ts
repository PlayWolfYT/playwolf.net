/**
 * Coordinate math shared by the framed-crop hook and the admin crop drawer.
 *
 * Crops on framed collections are stored as percentages **of the original**
 * upload and are deliberately allowed to be negative or to run past 100 — a
 * square photo can be pulled out into a 16:9 cover, with the gap filled by the
 * frame's pad background. Three coordinate spaces are involved:
 *
 * - **original percent** — what the document persists in `crop`. `0/0/100/100`
 *   is exactly the original; `x: -20` starts 20% of the width to its left.
 * - **stage percent** — what `react-image-crop` reports in the drawer, where
 *   the image sits centred inside a larger "stage" box so the selection can be
 *   dragged past the image while staying clamped to something. The stage is the
 *   original grown by `maxOutset` of each axis on every side.
 * - **cropped-result percent** — the space `focalX`/`focalY` live in, because
 *   Payload applies the focal point to the already-cropped file.
 *
 * This module is intentionally pure and dependency-free (no `sharp`, no node
 * builtins) so the `"use client"` crop drawer can import it as freely as the
 * server hook can.
 *
 * The pad/extract split exists because of two hard libvips constraints: sharp's
 * `extract` rejects negative offsets outright, and an area reaching past the
 * canvas fails with `extract_area: bad extract area`. Padding the canvas first
 * moves every crop into positive, in-bounds territory. Note that the caller
 * must run `extend` and `extract` as **two separate sharp pipelines**: within a
 * single chain sharp applies a pre-resize `extract` before `extend`, which
 * would crop the unpadded image and defeat the whole exercise.
 */

/** A rectangle in whichever percent space the caller is working in. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = { x: number; y: number };

export type Size = { width: number; height: number };

/** Pixel amounts for sharp's `extend`. */
export type PadAmounts = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** Pixel rectangle for sharp's `extract`, in padded-canvas coordinates. */
export type ExtractRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PadAndExtract = {
  /** Passed to `extend` on the first pipeline. Every side is >= 0. */
  pad: PadAmounts;
  /** Size of the canvas `extend` produces, useful for assertions and logging. */
  padded: Size;
  /** Passed to `extract` on the second pipeline. Always inside `padded`. */
  extract: ExtractRegion;
  /** True when the crop reaches outside the original and padding is needed. */
  padsAnySide: boolean;
};

/** The whole original, i.e. "no crop". Also the migration's backfill value. */
export const FULL_FRAME_RECT: Rect = { x: 0, y: 0, width: 100, height: 100 };

function isFiniteRect(rect: Rect | null | undefined): rect is Rect {
  return Boolean(
    rect &&
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height) &&
    rect.width > 0 &&
    rect.height > 0,
  );
}

/** Falls back to the full frame for missing or nonsensical stored values. */
export function normalizeRect(rect: Rect | null | undefined): Rect {
  return isFiniteRect(rect)
    ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    : FULL_FRAME_RECT;
}

/**
 * Whether two rects describe the same crop. Percentages arrive from the browser
 * as floats produced by pixel divisions, so an exact comparison would report a
 * change on every save; a hundredth of a percent is well under one pixel for
 * any plausible upload.
 */
export function rectsAlmostEqual(
  a: Rect | null | undefined,
  b: Rect | null | undefined,
  epsilon = 0.01,
): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.width - b.width) <= epsilon &&
    Math.abs(a.height - b.height) <= epsilon
  );
}

/**
 * Confines a rect to the same bounds the drawer's stage imposes: at most
 * `maxOutset` of each axis past every edge of the original.
 *
 * The drawer can only ever produce a rect inside those bounds, so for a save
 * from the admin this is the identity. It exists for the other caller — the
 * crop hook, whose rect arrives on `uploadEdits[crop]` straight off the
 * request, where nothing stops `width: 8_000_000` and a padded canvas measured
 * in gigapixels. Clamping here rather than rejecting keeps a hand-written API
 * call working; the pixel ceiling in `cropToWebp` is the hard stop.
 *
 * Each axis is clamped on its own, so an out-of-bounds rect can come back with
 * a different aspect than it went in with. That only happens for input the
 * drawer could not have produced, and a slightly reframed crop is a better
 * outcome than a refused save.
 */
export function clampRectToOutset(
  rect: Rect | null | undefined,
  maxOutset: number,
): Rect {
  const safe = normalizeRect(rect);
  const outset = Math.max(0, maxOutset) * 100;
  // `0 - outset` rather than `-outset`, so a zero outset yields 0 and not -0.
  const min = 0 - outset;
  const max = 100 + outset;
  const span = max - min;

  const width = Math.min(safe.width, span);
  const height = Math.min(safe.height, span);

  return {
    x: Math.min(Math.max(safe.x, min), max - width),
    y: Math.min(Math.max(safe.y, min), max - height),
    width,
    height,
  };
}

/**
 * Turns an original-percent rect into the `extend` + `extract` arguments that
 * reproduce it from the original bytes.
 *
 * Offsets are rounded independently of sizes so the requested width/height
 * survive intact; the extract is then clamped into the padded canvas, which
 * only ever bites when rounding pushes it a pixel over the edge.
 */
export function padAndExtractForRect(rect: Rect, source: Size): PadAndExtract {
  const safe = normalizeRect(rect);
  const sourceWidth = Math.max(1, Math.round(source.width));
  const sourceHeight = Math.max(1, Math.round(source.height));

  const left = Math.round((safe.x / 100) * sourceWidth);
  const top = Math.round((safe.y / 100) * sourceHeight);
  const width = Math.max(1, Math.round((safe.width / 100) * sourceWidth));
  const height = Math.max(1, Math.round((safe.height / 100) * sourceHeight));

  const pad: PadAmounts = {
    left: Math.max(0, -left),
    top: Math.max(0, -top),
    right: Math.max(0, left + width - sourceWidth),
    bottom: Math.max(0, top + height - sourceHeight),
  };

  const padded: Size = {
    width: sourceWidth + pad.left + pad.right,
    height: sourceHeight + pad.top + pad.bottom,
  };

  const extractLeft = left + pad.left;
  const extractTop = top + pad.top;

  return {
    pad,
    padded,
    extract: {
      left: extractLeft,
      top: extractTop,
      width: Math.max(1, Math.min(width, padded.width - extractLeft)),
      height: Math.max(1, Math.min(height, padded.height - extractTop)),
    },
    padsAnySide: pad.top > 0 || pad.right > 0 || pad.bottom > 0 || pad.left > 0,
  };
}

/**
 * Pixel size of the drawer's stage: the original grown by `maxOutset` of each
 * axis on all four sides. Because the growth is proportional per axis the stage
 * keeps the original's aspect ratio, so an aspect-locked selection stays
 * aspect-locked after conversion to original percent.
 */
export function stageSizeForSource(source: Size, maxOutset: number): Size {
  const scale = 1 + 2 * Math.max(0, maxOutset);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

/** Stage percent -> original percent along one axis. */
function stageToOriginal(percent: number, maxOutset: number): number {
  const outset = Math.max(0, maxOutset);
  return percent * (1 + 2 * outset) - outset * 100;
}

/** Original percent -> stage percent along one axis. */
function originalToStage(percent: number, maxOutset: number): number {
  const outset = Math.max(0, maxOutset);
  return (percent + outset * 100) / (1 + 2 * outset);
}

export function stageRectToOriginal(rect: Rect, maxOutset: number): Rect {
  const scale = 1 + 2 * Math.max(0, maxOutset);
  return {
    x: stageToOriginal(rect.x, maxOutset),
    y: stageToOriginal(rect.y, maxOutset),
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

export function originalRectToStage(rect: Rect, maxOutset: number): Rect {
  const scale = 1 + 2 * Math.max(0, maxOutset);
  return {
    x: originalToStage(rect.x, maxOutset),
    y: originalToStage(rect.y, maxOutset),
    width: rect.width / scale,
    height: rect.height / scale,
  };
}

export function stagePointToOriginal(point: Point, maxOutset: number): Point {
  return {
    x: stageToOriginal(point.x, maxOutset),
    y: stageToOriginal(point.y, maxOutset),
  };
}

export function originalPointToStage(point: Point, maxOutset: number): Point {
  return {
    x: originalToStage(point.x, maxOutset),
    y: originalToStage(point.y, maxOutset),
  };
}

/**
 * Shrinks a percent rect onto `aspect` (width ÷ height in pixels) about its own
 * centre. Percent space is anisotropic, so the pixel size of the box the
 * percentages refer to has to come along — for a stage-space rect that is the
 * stage size, for an original-space rect the original's.
 */
export function snapRectToAspect(rect: Rect, aspect: number, box: Size): Rect {
  if (!Number.isFinite(aspect) || aspect <= 0) return rect;
  if (!box.width || !box.height) return rect;

  const widthPx = (rect.width / 100) * box.width;
  const heightPx = (rect.height / 100) * box.height;
  if (!(widthPx > 0) || !(heightPx > 0)) return rect;

  const tooWide = widthPx / heightPx > aspect;
  const nextWidthPx = tooWide ? heightPx * aspect : widthPx;
  const nextHeightPx = tooWide ? heightPx : widthPx / aspect;

  const width = (nextWidthPx / box.width) * 100;
  const height = (nextHeightPx / box.height) * 100;

  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}

/** Largest rect of `aspect` centred in the box, as percentages of that box. */
export function maxAspectRect(box: Size, aspect: number): Rect {
  return snapRectToAspect(FULL_FRAME_RECT, aspect, box);
}

/**
 * Re-expresses a focal point as a percentage of the cropped result, which is
 * the space Payload's `createImageSizes` applies `focalX`/`focalY` in. The
 * point and the crop must be given in the same space (stage or original — the
 * conversion is the same affine map either way).
 *
 * Clamped to the crop, since a focal point outside the visible result would
 * only push the derivative sizes off the image.
 */
export function focalPointInCrop(point: Point, crop: Rect): Point {
  const safe = normalizeRect(crop);
  const clamp = (value: number) => Math.min(100, Math.max(0, value));
  return {
    x: clamp(((point.x - safe.x) / safe.width) * 100),
    y: clamp(((point.y - safe.y) / safe.height) * 100),
  };
}
