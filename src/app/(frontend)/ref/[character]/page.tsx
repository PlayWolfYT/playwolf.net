import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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

/** Canonical home of a character's SFW profile. */
export default async function CharacterPage({ params }: PageProps) {
  const { character: characterSlug } = await params;
  const character = await getCharacter(characterSlug);
  if (!character) notFound();

  // A character with no SFW profile is sent to the explicit After Dark URL
  // rather than served 18+ artwork from an address that doesn't say so — the
  // warning gate reads the route to decide when to ask.
  if (getDefaultProfileKey(character) === "nsfw") {
    redirect(`/ref/${character.slug}/nsfw`);
  }

  return <CharacterProfiles character={character} activeProfile="sfw" />;
}
