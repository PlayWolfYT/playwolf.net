import type { Metadata } from "next";
import { RefImage } from "@/components/ref/RefImage";
import { buildImageMetadata } from "@/lib/embed";
import { refSheets } from "@/lib/references";

const sheet = refSheets.sfw;

export async function generateMetadata(): Promise<Metadata> {
  return buildImageMetadata({
    title: sheet.title,
    src: sheet.src,
    alt: sheet.title,
    description: sheet.description,
    pagePath: "/ref/sfw",
  });
}

export default function SfwRefPage() {
  return (
    <RefImage
      src={sheet.src}
      alt={sheet.title}
      title={sheet.title}
      nsfw={sheet.nsfw}
      artist={sheet.artist}
    />
  );
}
