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

/**
 * One `og:image` descriptor. Dimensions and type are spelled out because
 * Discord and Telegram lay the embed out from the metadata rather than waiting
 * on the file, and a preview with no declared size renders as a thumbnail.
 */
export function ogImage(image: ImageRef, alt: string) {
  return {
    url: image.src,
    width: image.width,
    height: image.height,
    type: mimeFor(image.src),
    alt,
  };
}

/**
 * Fields every page with its own preview has to repeat. Next *replaces* a
 * parent segment's `openGraph` object rather than merging into it, so anything
 * set only in the root layout vanishes the moment a page declares one — which
 * is also why pages without an image of their own declare no `openGraph` at all
 * and forgo `og:url`: doing otherwise would discard the site-wide preview.
 *
 * `title` and `description` are the exception. Next backfills those from the
 * page's own resolved `title`/`description`.
 */
export const OG_SITE_FIELDS = {
  type: "website",
  locale: "en_US",
  siteName: "playwolf.net",
} as const;

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
 *
 * Rating never changes any of this. After Dark pages carry the same full
 * preview and no `robots` directive, because reference URLs are sent straight
 * to artists and have to unfurl without the recipient opening the link.
 */
export function buildImageMetadata({
  title,
  image,
  alt,
  description,
  pagePath,
}: BuildImageMetadataArgs): Metadata {
  return {
    title,
    description,
    alternates: pagePath ? { canonical: pagePath } : undefined,
    openGraph: {
      ...OG_SITE_FIELDS,
      title,
      description,
      url: pagePath,
      images: [ogImage(image, alt)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.src],
    },
  };
}
