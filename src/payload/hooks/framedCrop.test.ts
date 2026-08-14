import { describe, expect, mock, test } from "bun:test";
import sharp from "sharp";

import { padAndExtractForRect } from "@/payload/cropGeometry";

const sidecarBodies = new Map<string, Buffer>();
let nextOriginalKey = 0;

mock.module("@/payload/originals/store", () => ({
  ORIGINALS_PREFIX: "originals",
  buildOriginalKey: (_collection: string, filename?: string | null) =>
    `originals/project-images/${nextOriginalKey++}-${filename ?? "source.png"}`,
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

const {
  cropFromUploadEdits,
  framedCropBeforeOperation,
  reclaimFramedOriginalAfterChange,
} = await import("@/payload/hooks/framedCrop");

const SERVER_URL = "https://playwolf.net";

function solidPng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 180, b: 80 } },
  })
    .png()
    .toBuffer();
}

/** Minimum `PayloadRequest` shape the hook reads, plus a settable stored doc. */
function fakeReq({
  file,
  storedDoc,
  uploadEdits,
  user,
}: {
  file?: { name: string; data: Buffer; mimetype: string; size: number };
  storedDoc?: Record<string, unknown> | null;
  uploadEdits?: Record<string, unknown>;
  user?: Record<string, unknown>;
} = {}) {
  const warnings: unknown[] = [];
  return {
    context: {} as Record<string, unknown>,
    file,
    headers: new Headers(),
    protocol: "https",
    query: uploadEdits ? { uploadEdits } : {},
    user,
    warnings,
    payload: {
      config: { serverURL: SERVER_URL },
      findByID: async () => storedDoc ?? null,
      logger: {
        warn: (...entry: unknown[]) => {
          warnings.push(entry);
        },
      },
    },
  };
}

function runHook(
  req: ReturnType<typeof fakeReq>,
  args: Record<string, unknown>,
  {
    operation = "update",
    overrideAccess = true,
    slug = "project-images",
  }: { operation?: "create" | "update"; overrideAccess?: boolean; slug?: string } = {},
) {
  return framedCropBeforeOperation({
    args: args as never,
    collection: { slug } as never,
    context: req.context as never,
    operation,
    overrideAccess,
    req: req as never,
  });
}

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

describe("C1 — the pre-access guard", () => {
  test("an anonymous create is handed straight to access control, having stored nothing", async () => {
    sidecarBodies.clear();
    const upload = await solidPng(200, 200);

    const req = fakeReq({
      file: {
        name: "evil.png",
        data: upload,
        mimetype: "image/png",
        size: upload.length,
      },
    });
    const args = { data: {}, req };

    const result = await runHook(req, args, {
      operation: "create",
      overrideAccess: false,
    });

    expect(result).toBe(args);
    // Untouched: still the caller's PNG, never re-encoded, never stored.
    expect(sidecarBodies.size).toBe(0);
    expect(req.file?.mimetype).toBe("image/png");
    expect(args.data).toEqual({});
  });

  test("a signed-in create runs the crop", async () => {
    sidecarBodies.clear();
    const upload = await solidPng(200, 200);

    const req = fakeReq({
      file: {
        name: "ok.png",
        data: upload,
        mimetype: "image/png",
        size: upload.length,
      },
      user: { id: 1 },
    });
    const args: { data: Record<string, unknown>; req: unknown } = { data: {}, req };

    await runHook(req, args, { operation: "create", overrideAccess: false });

    expect(sidecarBodies.size).toBe(1);
    expect(req.file?.mimetype).toBe("image/webp");
  });

  test("the Local API keeps working without a user, the way seeds and migrations call it", async () => {
    sidecarBodies.clear();
    const upload = await solidPng(200, 200);

    const req = fakeReq({
      file: {
        name: "seed.png",
        data: upload,
        mimetype: "image/png",
        size: upload.length,
      },
    });

    await runHook(
      req,
      { data: {}, req },
      { operation: "create", overrideAccess: true },
    );

    expect(sidecarBodies.size).toBe(1);
    expect(req.file?.mimetype).toBe("image/webp");
  });
});

describe("C2 — the crop can never size an unbounded canvas", () => {
  test("an 80000% uploadEdits crop is clamped to the frame's stage instead of allocating", async () => {
    sidecarBodies.clear();

    const sourceW = 400;
    const sourceH = 225;
    const sidecarKey = "originals/project-images/hostile.png";
    sidecarBodies.set(sidecarKey, await solidPng(sourceW, sourceH));

    const req = fakeReq({
      // Exactly the shape qs.parse leaves behind for a hand-rolled request.
      uploadEdits: {
        crop: { x: "-40000", y: "-40000", width: "80000", height: "80000" },
      },
      storedDoc: {
        id: 7,
        filename: "hostile.webp",
        url: "/api/project-images/file/hostile.webp",
        source: {
          key: sidecarKey,
          width: sourceW,
          height: sourceH,
          mimeType: "image/png",
        },
        crop: { x: 0, y: 0, width: 100, height: 100 },
      },
    });

    const args: { id: number; data: Record<string, unknown>; req: unknown } = {
      id: 7,
      data: {},
      req,
    };
    await runHook(req, args);

    // project-images has maxOutset 0.5, so the stage is twice the original.
    expect(args.data.crop).toEqual({ x: -50, y: -50, width: 200, height: 200 });

    const meta = await sharp(req.file!.data).metadata();
    expect(meta.width).toBe(sourceW * 2);
    expect(meta.height).toBe(sourceH * 2);
  });

  /**
   * The clamp bounds the crop against the *original*, so a large enough
   * original still gets there. `resolveSourceBytes` trusts the recorded
   * `source.width`/`height` without decoding, which lets this drive the ceiling
   * from a tiny image — and proves the check runs before sharp is handed
   * anything.
   */
  test("a padded canvas past the pixel ceiling is refused before sharp is called", async () => {
    sidecarBodies.clear();

    const sidecarKey = "originals/project-images/enormous.png";
    sidecarBodies.set(sidecarKey, await solidPng(16, 16));

    const req = fakeReq({
      uploadEdits: { crop: { x: "-50", y: "-50", width: "200", height: "200" } },
      storedDoc: {
        id: 8,
        filename: "enormous.webp",
        source: {
          key: sidecarKey,
          // 20000² decodes from well under the 32 MB upload limit; doubled by
          // the outset that is 1.6 gigapixels of RGBA.
          width: 20_000,
          height: 20_000,
          mimeType: "image/png",
        },
        crop: { x: 0, y: 0, width: 100, height: 100 },
      },
    });

    await expect(runHook(req, { id: 8, data: {}, req })).rejects.toThrow(
      /refusing to pad/,
    );
  });
});

describe("H3 — a replacement upload never releases the original it supersedes early", () => {
  test("the superseded sidecar survives the hook and is dropped only afterChange", async () => {
    sidecarBodies.clear();

    const previousKey = "originals/project-images/previous.png";
    sidecarBodies.set(previousKey, await solidPng(300, 200));

    const replacement = await solidPng(640, 360);
    const req = fakeReq({
      file: {
        name: "replacement.png",
        data: replacement,
        mimetype: "image/png",
        size: replacement.length,
      },
      storedDoc: {
        id: 9,
        filename: "previous.webp",
        source: { key: previousKey, width: 300, height: 200, mimeType: "image/png" },
        crop: { x: 0, y: 0, width: 100, height: 100 },
      },
    });

    const args: { id: number; data: Record<string, unknown>; req: unknown } = {
      id: 9,
      data: {},
      req,
    };
    await runHook(req, args);

    const newKey = (args.data.source as { key: string }).key;
    expect(newKey).not.toBe(previousKey);
    // Both present: a save that fails from here on can still find its original.
    expect(sidecarBodies.has(previousKey)).toBe(true);
    expect(sidecarBodies.has(newKey)).toBe(true);

    await reclaimFramedOriginalAfterChange({
      collection: { slug: "project-images" } as never,
      context: req.context as never,
      doc: { id: 9 } as never,
      operation: "update",
      previousDoc: {} as never,
      req: req as never,
    });

    expect(sidecarBodies.has(previousKey)).toBe(false);
    expect(sidecarBodies.has(newKey)).toBe(true);
  });

  test("a save that never reaches afterChange leaves the original in place", async () => {
    sidecarBodies.clear();

    const previousKey = "originals/project-images/kept.png";
    sidecarBodies.set(previousKey, await solidPng(300, 200));

    const replacement = await solidPng(640, 360);
    const req = fakeReq({
      file: {
        name: "kept.png",
        data: replacement,
        mimetype: "image/png",
        size: replacement.length,
      },
      storedDoc: {
        id: 10,
        filename: "kept.webp",
        source: { key: previousKey, width: 300, height: 200, mimeType: "image/png" },
      },
    });

    await runHook(req, { id: 10, data: {}, req });

    expect(sidecarBodies.has(previousKey)).toBe(true);
  });
});

describe("H2 — adopting a legacy main file", () => {
  const originalFetch = globalThis.fetch;

  async function withStubbedFetch<T>(
    stub: typeof globalThis.fetch,
    run: () => Promise<T>,
  ): Promise<T> {
    globalThis.fetch = stub;
    try {
      return await run();
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  test("resolves a relative url against serverURL and forwards no credentials", async () => {
    sidecarBodies.clear();
    const legacy = await solidPng(320, 180);
    const calls: { url: string; init?: RequestInit }[] = [];

    const req = fakeReq({
      uploadEdits: { crop: { x: "0", y: "0", width: "100", height: "100" } },
      storedDoc: {
        id: 11,
        filename: "legacy.webp",
        mimeType: "image/webp",
        url: "/api/project-images/file/legacy.webp",
      },
    });
    // A session cookie the old implementation would have replayed.
    req.headers.set("cookie", "playwolf-token=secret");
    req.headers.set("origin", "https://attacker.example");

    await withStubbedFetch(
      (async (input: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return new Response(new Uint8Array(legacy), { status: 200 });
      }) as typeof globalThis.fetch,
      () => runHook(req, { id: 11, data: {}, req }),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${SERVER_URL}/api/project-images/file/legacy.webp`);
    expect(calls[0].init?.headers).toBeUndefined();
    expect(req.file?.mimetype).toBe("image/webp");
  });

  test("refuses a url pointing off this deployment's origin", async () => {
    sidecarBodies.clear();
    const calls: string[] = [];

    const req = fakeReq({
      uploadEdits: { crop: { x: "0", y: "0", width: "100", height: "100" } },
      storedDoc: {
        id: 12,
        filename: "exfil.webp",
        url: "http://169.254.169.254/latest/meta-data/",
      },
    });

    await withStubbedFetch(
      (async (input: string | URL | Request) => {
        calls.push(String(input));
        return new Response(null, { status: 200 });
      }) as typeof globalThis.fetch,
      async () => {
        await expect(runHook(req, { id: 12, data: {}, req })).rejects.toThrow(
          /was not found in storage/,
        );
      },
    );

    expect(calls).toHaveLength(0);
  });
});
