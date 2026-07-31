import type { Metadata } from "next";

import type { ImageRef } from "@/lib/content";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

function mimeFor(src: string): string {
  const ext = src.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "image/jpeg";
}

type BuildImageMetadataArgs = {
  title: string;
  image: ImageRef;
  alt: string;
  description?: string;
  /** Canonical page path, e.g. `/ref/playwuff/sfw` */
  pagePath?: string;
};

/**
 * Build Next `Metadata` that forces a full-size image preview in
 * Discord/Telegram. Combined with `metadataBase` (set in the root layout) the
 * `og:image` URL resolves to an absolute one, and `summary_large_image` makes
 * Discord render the large image rather than a small thumbnail.
 *
 * Embeds get the bounded derivative rather than the original: chat clients
 * refuse to inline very large files, and a reference sheet original can be
 * tens of megabytes.
 */
export function buildImageMetadata({
  title,
  image,
  alt,
  description,
  pagePath,
}: BuildImageMetadataArgs): Metadata {
  const preview = {
    url: image.src,
    width: image.width,
    height: image.height,
    type: mimeFor(image.src),
    alt,
  };

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: pagePath,
      images: [preview],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.src],
    },
  };
}
