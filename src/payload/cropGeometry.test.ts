import { describe, expect, test } from "bun:test";

import {
  focalPointInCrop,
  FULL_FRAME_RECT,
  maxAspectRect,
  normalizeRect,
  originalRectToStage,
  padAndExtractForRect,
  type Rect,
  rectsAlmostEqual,
  snapRectToAspect,
  stagePointToOriginal,
  stageRectToOriginal,
  stageSizeForSource,
} from "@/payload/cropGeometry";

const source = { width: 1000, height: 500 };

describe("padAndExtractForRect", () => {
  test("an in-bounds crop needs no padding", () => {
    const { pad, padded, extract, padsAnySide } = padAndExtractForRect(
      { x: 10, y: 20, width: 50, height: 40 },
      source,
    );

    expect(pad).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(padded).toEqual(source);
    expect(extract).toEqual({ left: 100, top: 100, width: 500, height: 200 });
    expect(padsAnySide).toBe(false);
  });

  test("the full frame extracts the whole original", () => {
    const { extract, padsAnySide } = padAndExtractForRect(FULL_FRAME_RECT, source);
    expect(extract).toEqual({ left: 0, top: 0, width: 1000, height: 500 });
    expect(padsAnySide).toBe(false);
  });

  test("a crop reaching past the left and top edges pads instead of going negative", () => {
    const { pad, padded, extract } = padAndExtractForRect(
      { x: -20, y: -10, width: 60, height: 50 },
      source,
    );

    expect(pad).toEqual({ top: 50, right: 0, bottom: 0, left: 200 });
    expect(padded).toEqual({ width: 1200, height: 550 });
    expect(extract).toEqual({ left: 0, top: 0, width: 600, height: 250 });
  });

  test("a crop reaching past the right and bottom edges pads those sides", () => {
    const { pad, padded, extract } = padAndExtractForRect(
      { x: 60, y: 70, width: 60, height: 50 },
      source,
    );

    expect(pad).toEqual({ top: 0, right: 200, bottom: 100, left: 0 });
    expect(padded).toEqual({ width: 1200, height: 600 });
    expect(extract).toEqual({ left: 600, top: 350, width: 600, height: 250 });
  });

  test("a crop larger than the original on every side pads all four", () => {
    const { pad, padded, extract } = padAndExtractForRect(
      { x: -50, y: -50, width: 200, height: 200 },
      source,
    );

    expect(pad).toEqual({ top: 250, right: 500, bottom: 250, left: 500 });
    expect(padded).toEqual({ width: 2000, height: 1000 });
    expect(extract).toEqual({ left: 0, top: 0, width: 2000, height: 1000 });
  });

  test("offsets stay non-negative and inside the padded canvas for every rect", () => {
    const coordinates = [-400, -100, -37, 0, 33, 100, 250];
    const sizes = [1, 17, 100, 233, 400];
    const sources = [source, { width: 37, height: 41 }, { width: 4000, height: 3000 }];

    for (const box of sources) {
      for (const x of coordinates) {
        for (const y of coordinates) {
          for (const width of sizes) {
            for (const height of sizes) {
              const { pad, padded, extract } = padAndExtractForRect(
                { x, y, width, height },
                box,
              );

              for (const side of [pad.top, pad.right, pad.bottom, pad.left]) {
                expect(side).toBeGreaterThanOrEqual(0);
              }
              expect(extract.left).toBeGreaterThanOrEqual(0);
              expect(extract.top).toBeGreaterThanOrEqual(0);
              expect(extract.width).toBeGreaterThan(0);
              expect(extract.height).toBeGreaterThan(0);
              expect(extract.left + extract.width).toBeLessThanOrEqual(padded.width);
              expect(extract.top + extract.height).toBeLessThanOrEqual(padded.height);
            }
          }
        }
      }
    }
  });

  test("a fully out-of-bounds crop still yields a usable region", () => {
    const { extract, padded } = padAndExtractForRect(
      { x: 300, y: -400, width: 50, height: 50 },
      source,
    );

    expect(extract.left).toBe(3000);
    expect(extract.top).toBe(0);
    expect(extract.width).toBe(500);
    expect(extract.height).toBe(250);
    expect(padded).toEqual({ width: 3500, height: 2500 });
  });

  test("a degenerate rect falls back to the full frame", () => {
    const { extract } = padAndExtractForRect(
      { x: 0, y: 0, width: 0, height: Number.NaN },
      source,
    );
    expect(extract).toEqual({ left: 0, top: 0, width: 1000, height: 500 });
  });
});

describe("normalizeRect", () => {
  test("keeps out-of-bounds but finite values", () => {
    const rect = { x: -25, y: 10, width: 150, height: 40 };
    expect(normalizeRect(rect)).toEqual(rect);
  });

  test("replaces missing or zero-sized rects with the full frame", () => {
    expect(normalizeRect(undefined)).toEqual(FULL_FRAME_RECT);
    expect(normalizeRect({ x: 0, y: 0, width: 100, height: 0 })).toEqual(
      FULL_FRAME_RECT,
    );
  });
});

describe("rectsAlmostEqual", () => {
  test("ignores sub-pixel float drift", () => {
    const a: Rect = { x: 10, y: 10, width: 50, height: 25 };
    expect(rectsAlmostEqual(a, { ...a, x: 10.004 })).toBe(true);
    expect(rectsAlmostEqual(a, { ...a, x: 10.5 })).toBe(false);
  });

  test("a missing side is never equal", () => {
    expect(rectsAlmostEqual(undefined, FULL_FRAME_RECT)).toBe(false);
  });
});

describe("stage conversion", () => {
  const maxOutset = 0.5;

  test("the stage grows the original by maxOutset on each side", () => {
    expect(stageSizeForSource(source, maxOutset)).toEqual({
      width: 2000,
      height: 1000,
    });
    expect(stageSizeForSource(source, 0)).toEqual(source);
  });

  test("the whole stage maps to the outset bounds in original percent", () => {
    expect(stageRectToOriginal(FULL_FRAME_RECT, maxOutset)).toEqual({
      x: -50,
      y: -50,
      width: 200,
      height: 200,
    });
  });

  test("the original occupies the middle of the stage", () => {
    expect(originalRectToStage(FULL_FRAME_RECT, maxOutset)).toEqual({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });
  });

  test("round-trips both directions", () => {
    const rect = { x: -12.5, y: 33.25, width: 140, height: 42 };
    for (const outset of [0, 0.25, 0.5, 1]) {
      const roundTripped = stageRectToOriginal(
        originalRectToStage(rect, outset),
        outset,
      );
      expect(rectsAlmostEqual(roundTripped, rect, 1e-9)).toBe(true);
    }
  });

  test("keeps the pixel aspect ratio of a selection", () => {
    const stage = stageSizeForSource(source, maxOutset);
    const stageRect = snapRectToAspect(
      { x: 10, y: 10, width: 70, height: 70 },
      16 / 9,
      stage,
    );
    const stageAspect =
      ((stageRect.width / 100) * stage.width) /
      ((stageRect.height / 100) * stage.height);

    const originalRect = stageRectToOriginal(stageRect, maxOutset);
    const originalAspect =
      ((originalRect.width / 100) * source.width) /
      ((originalRect.height / 100) * source.height);

    expect(originalAspect).toBeCloseTo(stageAspect, 10);
    expect(originalAspect).toBeCloseTo(16 / 9, 10);
  });

  test("converts a stage point into original space", () => {
    expect(stagePointToOriginal({ x: 50, y: 50 }, maxOutset)).toEqual({
      x: 50,
      y: 50,
    });
    expect(stagePointToOriginal({ x: 0, y: 100 }, maxOutset)).toEqual({
      x: -50,
      y: 150,
    });
  });
});

describe("snapRectToAspect", () => {
  test("narrows a too-wide rect about its centre", () => {
    expect(
      snapRectToAspect({ x: 0, y: 0, width: 100, height: 100 }, 1, source),
    ).toEqual({ x: 25, y: 0, width: 50, height: 100 });
  });

  test("shortens a too-tall rect about its centre", () => {
    expect(
      snapRectToAspect({ x: 0, y: 0, width: 100, height: 100 }, 4, source),
    ).toEqual({ x: 0, y: 25, width: 100, height: 50 });
  });

  test("leaves a rect that already matches alone", () => {
    const rect = { x: 10, y: 20, width: 50, height: 50 };
    const snapped = snapRectToAspect(rect, 2, source);
    expect(rectsAlmostEqual(snapped, rect, 1e-9)).toBe(true);
  });

  test("passes through nonsensical aspects and boxes", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    expect(snapRectToAspect(rect, 0, source)).toEqual(rect);
    expect(snapRectToAspect(rect, 1, { width: 0, height: 0 })).toEqual(rect);
  });

  test("maxAspectRect fills the box on the unconstrained axis", () => {
    expect(maxAspectRect({ width: 1000, height: 1000 }, 16 / 9)).toEqual({
      x: 0,
      y: (100 - 56.25) / 2,
      width: 100,
      height: 56.25,
    });
  });
});

describe("focalPointInCrop", () => {
  test("the crop centre is the centre of the result", () => {
    expect(
      focalPointInCrop({ x: 40, y: 40 }, { x: 20, y: 20, width: 40, height: 40 }),
    ).toEqual({ x: 50, y: 50 });
  });

  test("works for a crop that starts outside the original", () => {
    expect(
      focalPointInCrop({ x: 0, y: 0 }, { x: -50, y: -50, width: 200, height: 200 }),
    ).toEqual({ x: 25, y: 25 });
  });

  test("clamps a point outside the crop into the result", () => {
    const crop = { x: 20, y: 20, width: 40, height: 40 };
    expect(focalPointInCrop({ x: 0, y: 90 }, crop)).toEqual({ x: 0, y: 100 });
  });
});
