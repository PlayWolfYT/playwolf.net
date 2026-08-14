import { ProfileSwitcher, type ProfileTab } from "@/components/ref/ProfileSwitcher";
import { ProfileView } from "@/components/ref/ProfileView";
import { PROFILE_KEYS, type Character, type ProfileKey } from "@/lib/content";
import Link from "next/link";
import { BackArrow } from "./BackArrow";

type CharacterProfilesProps = {
  character: Character;
  /** Profile this route should render — only this panel is in the HTML. */
  activeProfile: ProfileKey;
};

/**
 * Shared body of `/ref/<character>` and `/ref/<character>/<profile>`: the
 * sticky profile switcher plus the active profile only (real navigation
 * between SFW / After Dark — no hidden sibling panels).
 */
export function CharacterProfiles({
  character,
  activeProfile,
}: CharacterProfilesProps) {
  const profile = character.profiles[activeProfile];
  if (!profile) return null;

  const tabs: ProfileTab[] = PROFILE_KEYS.flatMap((key) => {
    const candidate = character.profiles[key];
    if (!candidate) return [];

    const isNsfw = key === "nsfw";
    return [
      {
        key,
        label: candidate.label,
        badge: isNsfw ? "18+" : undefined,
        // SFW's canonical URL is the bare character page.
        href: isNsfw ? `/ref/${character.slug}/nsfw` : `/ref/${character.slug}`,
      },
    ];
  });

  return (
    <div className="w-full">
      <ProfileSwitcher
        characterName={character.name}
        species={character.species}
        tabs={tabs}
      />

      <ProfileView
        profile={profile}
        profileKey={activeProfile}
        basePath={`/ref/${character.slug}/${activeProfile}`}
      />

      <div className="mt-14 flex justify-center">
        <Link
          href="/ref"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-void-lift/60 px-6 text-sm font-medium text-parchment-muted transition hover:border-white/20 hover:text-parchment focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          <BackArrow />
          Back to Characters
        </Link>
      </div>
    </div>
  );
}
