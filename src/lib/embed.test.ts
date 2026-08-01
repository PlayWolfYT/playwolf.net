import { describe, expect, test } from "bun:test";

import type { ImageRef } from "@/lib/content";
import { buildImageMetadata } from "@/lib/embed";

function imageRef(src: string): ImageRef {
  return {
    src,
    width: 1600,
    height: 900,
    objectPosition: "50% 50%",
    original: { url: "/media/original.png", width: 6000, height: 3375 },
  };
}

function ogImage(src: string) {
  const metadata = buildImageMetadata({
    title: "Title",
    image: imageRef(src),
    alt: "Alt",
  });
  const images = metadata.openGraph?.images;
  if (!Array.isArray(images)) throw new Error("expected a list of OG images");
  return images[0] as { url: string; type: string; width: number; height: number };
}

describe("buildImageMetadata", () => {
  test("derives the MIME type from the extension", () => {
    expect(ogImage("/media/art.png").type).toBe("image/png");
    expect(ogImage("/media/art.jpg").type).toBe("image/jpeg");
    expect(ogImage("/media/art.JPEG").type).toBe("image/jpeg");
    expect(ogImage("/media/art.webp").type).toBe("image/webp");
    expect(ogImage("/media/art.gif").type).toBe("image/gif");
  });

  test("ignores a query string when reading the extension", () => {
    expect(ogImage("/media/art.png?v=2").type).toBe("image/png");
  });

  test("falls back to JPEG for anything unrecognised", () => {
    expect(ogImage("/media/art.bmp").type).toBe("image/jpeg");
    expect(ogImage("/media/art").type).toBe("image/jpeg");
  });

  test("previews the bounded derivative, never the original upload", () => {
    // Chat clients refuse to inline very large files, and an original
    // reference sheet can be tens of megabytes.
    const preview = ogImage("/media/art-display.png");
    expect(preview.url).toBe("/media/art-display.png");
    expect(preview.width).toBe(1600);
    expect(preview.height).toBe(900);
  });

  test("carries the canonical path and a large-image Twitter card", () => {
    const metadata = buildImageMetadata({
      title: "Title",
      image: imageRef("/media/art.png"),
      alt: "Alt",
      description: "Description",
      pagePath: "/ref/playwuff/sfw",
    });

    expect(metadata.openGraph?.url).toBe("/ref/playwuff/sfw");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(metadata.description).toBe("Description");
  });
});
