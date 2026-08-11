import { describe, expect, test } from "bun:test";

import { aspectsMatch, pickUploadRenderSource } from "@/lib/uploadSource";

describe("pickUploadRenderSource", () => {
  test("framed upload prefers largest same-aspect derivative over tiny frame", () => {
    const picked = pickUploadRenderSource({
      original: {
        src: "/api/friend-images/file/DSCF7485-1.webp",
        width: 1947,
        height: 779,
      },
      sizes: {
        frame: {
          url: "/api/friend-images/file/DSCF7485-1-680x272.webp",
          width: 680,
          height: 272,
        },
        card: {
          url: "/api/friend-images/file/DSCF7485-1-1024x410.webp",
          width: 1024,
          height: 410,
        },
        display: {
          url: "/api/friend-images/file/DSCF7485-1-1947x779.webp",
          width: 1947,
          height: 779,
        },
      },
    });

    expect(picked.isFramed).toBe(true);
    expect(picked.src).toBe("/api/friend-images/file/DSCF7485-1-1947x779.webp");
    expect(picked.width).toBe(1947);
  });

  test("framed upload ignores non-matching display/card (legacy 3:2 main)", () => {
    const picked = pickUploadRenderSource({
      original: {
        src: "/api/friend-images/file/DSCF7485.webp",
        width: 2048,
        height: 1365,
      },
      sizes: {
        frame: {
          url: "/api/friend-images/file/DSCF7485-680x272.webp",
          width: 680,
          height: 272,
        },
        card: {
          url: "/api/friend-images/file/DSCF7485-1024x683.webp",
          width: 1024,
          height: 683,
        },
        display: {
          url: "/api/friend-images/file/DSCF7485-2048x1365.webp",
          width: 2048,
          height: 1365,
        },
      },
    });

    expect(picked.isFramed).toBe(true);
    expect(picked.src).toBe("/api/friend-images/file/DSCF7485-680x272.webp");
    expect(aspectsMatch(picked.width / picked.height, 5 / 2)).toBe(true);
  });

  test("unframed media still prefers display then card", () => {
    const picked = pickUploadRenderSource({
      original: { src: "/api/media/file/art.webp", width: 4000, height: 3000 },
      sizes: {
        card: { url: "/api/media/file/art-1024.webp", width: 1024, height: 768 },
        display: {
          url: "/api/media/file/art-2560.webp",
          width: 2560,
          height: 1920,
        },
      },
    });

    expect(picked.isFramed).toBe(false);
    expect(picked.src).toBe("/api/media/file/art-2560.webp");
  });
});
