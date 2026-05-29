import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefImage } from "@/components/ref/RefImage";
import { buildImageMetadata } from "@/lib/embed";
import { getAllSlugs, getExample } from "@/lib/references";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllSlugs(false).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = getExample(slug, false);
  if (!example) return {};
  return buildImageMetadata({
    title: `${example.title} · playwolf.net`,
    src: example.src,
    alt: example.title,
    pagePath: `/ref/examples/${example.slug}`,
  });
}

export default async function SfwExamplePage({ params }: PageProps) {
  const { slug } = await params;
  const example = getExample(slug, false);
  if (!example) notFound();

  return (
    <RefImage
      src={example.src}
      alt={example.title}
      title={example.title}
      artist={example.artist}
    />
  );
}
