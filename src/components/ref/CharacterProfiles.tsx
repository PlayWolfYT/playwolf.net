import { BackButton } from "@/components/ref/BackButton";
import {
  ProfileSwitcher,
  type ProfilePanel,
} from "@/components/ref/ProfileSwitcher";
import { ProfileView } from "@/components/ref/ProfileView";
import {
  PROFILE_KEYS,
  type Character,
} from "@/lib/references";
import Link from "next/link";
import { BackArrow } from "./BackArrow";

type CharacterProfilesProps = {
  character: Character;
};

/**
 * Shared body of `/ref/<character>` and `/ref/<character>/<profile>`: the
 * sticky profile switcher plus every profile panel (all server-rendered,
 * toggled client-side without a page load).
 */
export function CharacterProfiles({ character }: CharacterProfilesProps) {
  const panels: ProfilePanel[] = PROFILE_KEYS.flatMap((key) => {
    const profile = character.profiles[key];
    if (!profile) return [];

    const isNsfw = key === "nsfw";
    return [
      {
        key,
        label: profile.label,
        badge: isNsfw ? "18+" : undefined,
        // SFW's canonical URL is the bare character page.
        href: isNsfw ? `/ref/${character.slug}/nsfw` : `/ref/${character.slug}`,
        content: (
          <ProfileView
            profile={profile}
            profileKey={key}
            basePath={`/ref/${character.slug}/${key}`}
          />
        ),
      },
    ];
  });

  return (
    <div className="w-full">
      <ProfileSwitcher
        characterName={character.name}
        species={character.species}
        panels={panels}
      />

      <div className="mt-14 flex justify-center">
        <Link
          href="/ref"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          <BackArrow />
          Back to Characters
        </Link>
      </div>
    </div>
  );
}
