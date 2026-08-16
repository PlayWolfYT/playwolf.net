import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CharacterProfiles } from "@/components/ref/CharacterProfiles";
import { buildImageMetadata } from "@/lib/embed";
import { richTextToMetaDescription } from "@/lib/rich-text";
import {
  getCharacter,
  getMainArt,
  getProfile,
  getSheetImage,
  isProfileKey,
} from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { character: characterSlug, profile: profileParam } = await params;
  if (!isProfileKey(profileParam)) return {};

  const [character, profile] = await Promise.all([
    getCharacter(characterSlug),
    getProfile(characterSlug, profileParam),
  ]);
  if (!character || !profile) return {};

  const isNsfw = profileParam === "nsfw";
  const title = isNsfw ? `${character.name} · ${profile.label} (18+)` : character.name;

  // Prefer the profile sheet image; WIP placeholders fall back to main art.
  const embedImage = getSheetImage(profile.sheet) ?? getMainArt(character);

  const description = richTextToMetaDescription(profile.description);

  // `/ref/<char>` is the canonical home of the SFW profile; After Dark is a page
  // in its own right. `og:url` follows the canonical rather than the requested
  // path so the two never disagree about which address represents the page.
  const pagePath = isNsfw ? `/ref/${character.slug}/nsfw` : `/ref/${character.slug}`;

  if (!embedImage) {
    return { title, description, alternates: { canonical: pagePath } };
  }

  return buildImageMetadata({
    title,
    image: embedImage.src,
    alt: embedImage.alt,
    description,
    pagePath,
  });
}

export default async function ProfilePage({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = await getCharacter(characterSlug);
  if (!character || !character.profiles[profileParam]) notFound();

  return <CharacterProfiles character={character} activeProfile={profileParam} />;
}
