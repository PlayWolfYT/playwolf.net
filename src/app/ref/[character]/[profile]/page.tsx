import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CharacterProfiles } from "@/components/ref/CharacterProfiles";
import { buildImageMetadata, reactNodeToText } from "@/lib/embed";
import {
  getCharacter,
  getMainArt,
  getProfile,
  getProfileParams,
  getSheetImage,
  isProfileKey,
} from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string }>;
};

export function generateStaticParams() {
  return getProfileParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { character: characterSlug, profile: profileParam } = await params;
  if (!isProfileKey(profileParam)) return {};

  const character = getCharacter(characterSlug);
  const profile = getProfile(characterSlug, profileParam);
  if (!character || !profile) return {};

  const isNsfw = profileParam === "nsfw";
  const title = isNsfw
    ? `${character.name} · ${profile.label} (18+) · playwolf.net`
    : `${character.name} · playwolf.net`;

  // Prefer the profile sheet image; WIP placeholders fall back to main art.
  const embedImage = getSheetImage(profile.sheet) ?? getMainArt(character);

  const description = reactNodeToText(profile.description);

  const metadata: Metadata = embedImage
    ? buildImageMetadata({
        title,
        src: embedImage.src,
        alt: embedImage.alt,
        description,
        pagePath: `/ref/${character.slug}/${profileParam}`,
      })
    : { title, description };

  if (profileParam === "sfw") {
    // /ref/<char> is the canonical home of the SFW profile.
    metadata.alternates = { canonical: `/ref/${character.slug}` };
  }

  return metadata;
}

export default async function ProfilePage({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = getCharacter(characterSlug);
  if (!character || !character.profiles[profileParam]) notFound();

  return <CharacterProfiles character={character} />;
}
