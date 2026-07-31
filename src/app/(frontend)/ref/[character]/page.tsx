import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CharacterProfiles } from "@/components/ref/CharacterProfiles";
import { buildImageMetadata } from "@/lib/embed";
import { richTextToPlainText } from "@/lib/rich-text";
import { getCharacter, getDefaultProfileKey, getMainArt } from "@/lib/references";

type PageProps = { params: Promise<{ character: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { character: characterSlug } = await params;
  const character = await getCharacter(characterSlug);
  if (!character) return {};

  const title = character.name;
  const description = richTextToPlainText(
    character.profiles[getDefaultProfileKey(character)]?.description,
  );

  const mainArt = getMainArt(character);
  if (!mainArt) return { title, description };

  return buildImageMetadata({
    title,
    image: mainArt.src,
    alt: mainArt.alt,
    description,
    pagePath: `/ref/${character.slug}`,
  });
}

/** Canonical character page — the SFW profile is active by default
 *  (falls back to NSFW for characters without an SFW profile). */
export default async function CharacterPage({ params }: PageProps) {
  const { character: characterSlug } = await params;
  const character = await getCharacter(characterSlug);
  if (!character) notFound();

  return (
    <CharacterProfiles
      character={character}
      activeProfile={getDefaultProfileKey(character)}
    />
  );
}
