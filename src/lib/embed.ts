import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import { isValidElement, type ReactNode } from "react";

function collectText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return collectText(node.props.children);
  }
  return "";
}

/**
 * Flatten a JSX description down to the plain text it renders (tags
 * stripped, whitespace collapsed) for use in meta/OG descriptions.
 */
export function reactNodeToText(node: ReactNode): string | undefined {
  const text = collectText(node).replace(/\s+/g, " ").trim();
  return text || undefined;
}

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

type BuildImageMetadataArgs = {
  title: string;
  src: StaticImageData;
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
export function buildImageMetadata({
  title,
  src,
  alt,
  description,
  pagePath,
}: BuildImageMetadataArgs): Metadata {
  const imageUrl = src.src;

  const image = {
    url: imageUrl,
    width: src.width,
    height: src.height,
    type: mimeFor(imageUrl),
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
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
