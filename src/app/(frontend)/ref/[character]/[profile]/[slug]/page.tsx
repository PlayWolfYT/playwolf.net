import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtworkChips } from "@/components/ref/ArtworkChips";
import { ExampleNav } from "@/components/ref/ExampleNav";
import { RefImage } from "@/components/ref/RefImage";
import { buildImageMetadata } from "@/lib/embed";
import { getCharacter, getExample, isProfileKey } from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) return {};

  const [character, example] = await Promise.all([
    getCharacter(characterSlug),
    getExample(characterSlug, profileParam, slug),
  ]);
  if (!character || !example) return {};

  return buildImageMetadata({
    title: `${example.title} · ${character.name}`,
    image: example.src,
    alt: example.title,
    description: profileParam === "nsfw" ? "18+ content." : undefined,
    pagePath: `/ref/${character.slug}/${profileParam}/${example.slug}`,
  });
}

export default async function ExamplePage({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = await getCharacter(characterSlug);
  const examples = character?.profiles[profileParam]?.examples ?? [];
  const index = examples.findIndex((candidate) => candidate.slug === slug);
  if (!character || index === -1) notFound();

  const example = examples[index];
  const isNsfw = profileParam === "nsfw";
  const backHref =
    profileParam === "sfw"
      ? `/ref/${character.slug}`
      : `/ref/${character.slug}/${profileParam}`;

  return (
    <>
      <RefImage
        src={example.src}
        alt={example.title}
        title={example.title}
        description={isNsfw ? "18+ content." : undefined}
        artist={example.artist}
        backHref={backHref}
      >
        <ArtworkChips example={example} />
      </RefImage>

      <ExampleNav
        basePath={`/ref/${character.slug}/${profileParam}`}
        previous={examples[index - 1]}
        next={examples[index + 1]}
        position={index + 1}
        total={examples.length}
      />
    </>
  );
}
