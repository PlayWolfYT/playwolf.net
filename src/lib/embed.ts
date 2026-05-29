import path from "node:path";
import { readFile } from "node:fs/promises";
import { imageSize } from "image-size";
import type { Metadata } from "next";

export type ImageDimensions = {
  width: number;
  height: number;
  /** OG mime type, e.g. `image/jpeg` */
  type: string;
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

function mimeFor(src: string): string {
  const ext = src.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "image/jpeg";
}

/**
 * Read intrinsic dimensions for an asset stored under `public/`.
 * `src` is a public-relative path like `/reference-sheet.jpg`.
 * Returns `null` if the file can't be read or measured.
 */
export async function getImageDimensions(
  src: string,
): Promise<ImageDimensions | null> {
  try {
    const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    const buffer = await readFile(filePath);
    const { width, height } = imageSize(buffer);
    if (!width || !height) return null;
    return { width, height, type: mimeFor(src) };
  } catch {
    return null;
  }
}

type BuildImageMetadataArgs = {
  title: string;
  /** Public-relative path, e.g. `/reference-sheet.jpg` */
  src: string;
  alt: string;
  description?: string;
  /** Canonical page path, e.g. `/ref/sfw` */
  pagePath?: string;
};

/**
 * Build Next `Metadata` that forces a full-size image preview in
 * Discord/Telegram. Combined with `metadataBase` (set in the root layout),
 * the `og:image`/`twitter:image` URLs resolve to absolute paths, and
 * `summary_large_image` makes Discord render the large image rather than a
 * small thumbnail. Always point `src` at the real (unblurred) asset.
 */
export async function buildImageMetadata({
  title,
  src,
  alt,
  description,
  pagePath,
}: BuildImageMetadataArgs): Promise<Metadata> {
  const dimensions = await getImageDimensions(src);

  const image = dimensions
    ? {
        url: src,
        width: dimensions.width,
        height: dimensions.height,
        type: dimensions.type,
        alt,
      }
    : { url: src, alt };

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: pagePath,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [src],
    },
  };
}
