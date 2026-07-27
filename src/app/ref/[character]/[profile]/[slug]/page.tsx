import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefImage } from "@/components/ref/RefImage";
import { buildImageMetadata } from "@/lib/embed";
import {
  getCharacter,
  getExample,
  getExampleParams,
  isProfileKey,
} from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string; slug: string }>;
};

export function generateStaticParams() {
  return getExampleParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    character: characterSlug,
    profile: profileParam,
    slug,
  } = await params;
  if (!isProfileKey(profileParam)) return {};

  const character = getCharacter(characterSlug);
  const example = getExample(characterSlug, profileParam, slug);
  if (!character || !example) return {};

  return buildImageMetadata({
    title: `${example.title} · ${character.name}`,
    src: example.src,
    alt: example.title,
    description: profileParam === "nsfw" ? "18+ content." : undefined,
    pagePath: `/ref/${character.slug}/${profileParam}/${example.slug}`,
  });
}

export default async function ExamplePage({ params }: PageProps) {
  const {
    character: characterSlug,
    profile: profileParam,
    slug,
  } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = getCharacter(characterSlug);
  const example = getExample(characterSlug, profileParam, slug);
  if (!character || !example) notFound();

  const isNsfw = profileParam === "nsfw";
  const backHref =
    profileParam === "sfw"
      ? `/ref/${character.slug}`
      : `/ref/${character.slug}/${profileParam}`;

  return (
    <RefImage
      src={example.src}
      alt={example.title}
      title={example.title}
      nsfw={isNsfw}
      description={isNsfw ? "18+ content. Click to reveal." : undefined}
      artist={example.artist}
      backHref={backHref}
    />
  );
}
