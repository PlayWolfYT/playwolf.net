import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { RevealAllToggle } from "@/components/ref/RevealAllToggle";
import { SheetPlaceholder } from "@/components/ref/SheetPlaceholder";
import {
  isImageSheet,
  isWipSheet,
  type Profile,
  type ProfileKey,
} from "@/lib/references";

type ProfileViewProps = {
  profile: Profile;
  profileKey: ProfileKey;
  /** Route prefix for example detail links, e.g. `/ref/playwuff/sfw` */
  basePath: string;
};

/**
 * One full profile panel: reference sheet, description, and example gallery.
 * The description sits below the artwork so the sheet starts at the same
 * vertical position in every profile (no layout shift when switching).
 * The After Dark panel keeps every image blur-gated and adds a
 * "Reveal all" master switch above the gallery.
 */
export function ProfileView({
  profile,
  profileKey,
  basePath,
}: ProfileViewProps) {
  const isNsfw = profileKey === "nsfw";
  const sheet = profile.sheet;

  return (
    <div className="w-full">
      {sheet && isWipSheet(sheet) ? (
        <SheetPlaceholder sheet={sheet} />
      ) : sheet && isImageSheet(sheet) ? (
        <>
          <ArtworkCard
            src={sheet.src}
            alt={sheet.title}
            nsfw={isNsfw}
            artist={sheet.artist}
          />
          <div className="mt-6 flex justify-center">
            <OpenImageLink src={sheet.src} />
          </div>
        </>
      ) : null}

      {profile.description ? (
        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-glow-500/25 bg-glow-500/10 px-6 py-5 text-center shadow-inner-glow">
          <h2 className="font-display text-xs font-medium uppercase tracking-[0.28em] text-parchment-dim">
            About
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-parchment-muted whitespace-pre-line">
            {profile.description}
          </div>
        </section>
      ) : null}

      <div className="mt-14">
        {isNsfw ? (
          <div className="mb-8 flex justify-center">
            <RevealAllToggle />
          </div>
        ) : null}

        <ExampleGrid
          examples={profile.examples}
          basePath={basePath}
          nsfw={isNsfw}
          title="Examples"
          description={
            isNsfw ? "18+ content. Click any image to reveal." : undefined
          }
          showBackButton={false}
        />
      </div>
    </div>
  );
}
