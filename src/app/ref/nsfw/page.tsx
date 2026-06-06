import type { Metadata } from "next";
import { RefImage } from "@/components/ref/RefImage";
import { buildImageMetadata } from "@/lib/embed";
import { refSheets } from "@/lib/references";

const sheet = refSheets.nsfw;

export function generateMetadata(): Metadata {
  return buildImageMetadata({
    title: sheet.title,
    src: sheet.src,
    alt: sheet.title,
    description: sheet.description,
    pagePath: "/ref/nsfw",
  });
}

export default function NsfwRefPage() {
  return (
    <RefImage
      src={sheet.src}
      alt={sheet.title}
      title={sheet.title}
      nsfw={sheet.nsfw}
      description={sheet.nsfw ? "18+ content. Click to reveal." : undefined}
      artist={sheet.artist}
    />
  );
}
