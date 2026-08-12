import { describe, expect, mock, test } from "bun:test";
import sharp from "sharp";

import { padAndExtractForRect } from "@/payload/cropGeometry";

const sidecarBodies = new Map<string, Buffer>();

mock.module("@/payload/originals/store", () => ({
  ORIGINALS_PREFIX: "originals",
  buildOriginalKey: (_collection: string, filename?: string | null) =>
    `originals/project-images/${filename ?? "source.png"}`,
  putOriginal: async (key: string, body: Buffer) => {
    sidecarBodies.set(key, body);
  },
  getOriginal: async (key: string) => {
    const body = sidecarBodies.get(key);
    return body ? { body, contentType: "image/png" } : null;
  },
  deleteOriginal: async (key: string) => {
    sidecarBodies.delete(key);
  },
}));

const { cropFromUploadEdits, framedCropBeforeOperation } =
  await import("@/payload/hooks/framedCrop");

/**
 * Mirrors Payload's stock percent→pixel conversion in cropImage.js. Negative
 * original-percent x values become negative extract.left and sharp throws.
 */
function stockCropLeft(xPercent: number, sourceWidth: number): number {
  return Math.floor((xPercent / 100) * sourceWidth);
}

describe("cropFromUploadEdits (qs string coords)", () => {
  test("coerces string percentages from qs.parse the way the admin sends them", () => {
    // DocumentInfo action URL: qs.stringify({ uploadEdits }) → qs.parse → strings.
    const crop = cropFromUploadEdits({
      crop: {
        x: "-20.5",
        y: "10",
        width: "140",
        height: "80",
      } as unknown as { x: number; y: number; width: number; height: number },
      widthInPixels: "2800" as unknown as number,
      heightInPixels: "1600" as unknown as number,
      focalPoint: { x: "50" as unknown as number, y: "50" as unknown as number },
    });

    expect(crop).toEqual({ x: -20.5, y: 10, width: 140, height: 80 });
  });

  test("rejects non-numeric garbage", () => {
    expect(
      cropFromUploadEdits({
        crop: { x: "nope", y: 0, width: 100, height: 100 } as unknown as {
          x: number;
          y: number;
          width: number;
          height: number;
        },
      }),
    ).toBeNull();
  });
});

describe("production failure reproduction (left=-410)", () => {
  test("stock Payload cropImage would ask sharp for left=-410", () => {
    // -20.5% of a ~2000px-wide original — the error seen in production.
    expect(stockCropLeft(-20.5, 2000)).toBe(-410);
  });

  test("padAndExtractForRect keeps extract.left non-negative for that crop", () => {
    const { pad, extract } = padAndExtractForRect(
      { x: -20.5, y: 10, width: 140, height: 80 },
      { width: 2000, height: 1125 },
    );

    expect(pad.left).toBe(410);
    expect(extract.left).toBe(0);
    expect(extract.top).toBeGreaterThanOrEqual(0);
    expect(extract.width).toBeGreaterThan(0);
    expect(extract.height).toBeGreaterThan(0);
  });
});

describe("framedCropBeforeOperation", () => {
  test("re-crop with qs string OOB crop clears uploadEdits.crop and never leaves stock path live", async () => {
    sidecarBodies.clear();

    const sourceW = 2000;
    const sourceH = 1125;
    const sourcePng = await sharp({
      create: {
        width: sourceW,
        height: sourceH,
        channels: 3,
        background: { r: 40, g: 180, b: 80 },
      },
    })
      .png()
      .toBuffer();

    const sidecarKey = "originals/project-images/legacy.png";
    sidecarBodies.set(sidecarKey, sourcePng);

    // Same shape createPayloadRequest leaves after qs.parse — all strings.
    const uploadEdits = {
      crop: {
        x: "-20.5",
        y: "10",
        width: "140",
        height: "80",
      },
      widthInPixels: "2800",
      heightInPixels: "900",
      focalPoint: { x: "50", y: "50" },
    };

    const req = {
      file: undefined,
      query: { uploadEdits },
      headers: new Headers(),
      protocol: "http",
      payload: {
        findByID: async () => ({
          id: 1,
          filename: "legacy.webp",
          mimeType: "image/webp",
          width: 1600,
          height: 900,
          url: "/api/project-images/file/legacy.webp",
          source: {
            key: sidecarKey,
            width: sourceW,
            height: sourceH,
            mimeType: "image/png",
          },
          crop: { x: 0, y: 0, width: 100, height: 100 },
        }),
        logger: { warn: () => undefined },
      },
    };

    const args = {
      id: 1,
      data: { alt: "recrop" },
      req,
    };

    const result = await framedCropBeforeOperation({
      args: args as never,
      collection: { slug: "project-images" } as never,
      context: {} as never,
      operation: "update",
      overrideAccess: true,
      req: req as never,
    });

    const next = result as typeof args;

    // Stock generateFileData re-reads req.query.uploadEdits — crop must be gone.
    expect(req.query.uploadEdits.crop).toBeUndefined();
    expect(req.query.uploadEdits.widthInPixels).toBeUndefined();
    expect(req.query.uploadEdits.heightInPixels).toBeUndefined();
    // Focal point can remain; it is applied in cropped-result space.
    expect(req.query.uploadEdits.focalPoint).toEqual({ x: "50", y: "50" });

    expect(req.file?.mimetype).toBe("image/webp");
    expect(req.file?.data?.length).toBeGreaterThan(0);
    expect(next.overwriteExistingFiles).toBe(true);
    expect(next.data?.crop).toEqual({
      x: -20.5,
      y: 10,
      width: 140,
      height: 80,
    });

    const meta = await sharp(req.file!.data).metadata();
    // 140% of 2000 = 2800; 80% of 1125 = 900
    expect(meta.width).toBe(2800);
    expect(meta.height).toBe(900);
    expect(meta.hasAlpha).toBe(true);
  });

  test("alt-text-only update without uploadEdits.crop is a no-op", async () => {
    const req = {
      file: undefined,
      query: {},
      headers: new Headers(),
      protocol: "http",
      payload: {
        findByID: async () => ({
          id: 2,
          filename: "keep.webp",
          crop: { x: 0, y: 0, width: 100, height: 100 },
          source: { key: "originals/project-images/keep.png", width: 100, height: 100 },
        }),
        logger: { warn: () => undefined },
      },
    };

    const args = { id: 2, data: { alt: "just alt" }, req };
    const result = await framedCropBeforeOperation({
      args: args as never,
      collection: { slug: "project-images" } as never,
      context: {} as never,
      operation: "update",
      overrideAccess: true,
      req: req as never,
    });

    expect(result).toBe(args);
    expect(req.file).toBeUndefined();
  });
});
