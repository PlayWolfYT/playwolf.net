import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { Reveal } from "@/components/motion/Reveal";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { SheetPlaceholder } from "@/components/ref/SheetPlaceholder";
import { RichTextContent } from "@/lib/rich-text";
import { isImageSheet, isWipSheet, type Profile, type ProfileKey } from "@/lib/content";

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
 *
 * After Dark artwork is shown as-is: reaching this route at all means the 18+
 * warning has been accepted (see `NsfwConsentProvider`).
 */
export function ProfileView({ profile, profileKey, basePath }: ProfileViewProps) {
  const isNsfw = profileKey === "nsfw";
  const sheet = profile.sheet;

  return (
    <div className="w-full">
      {sheet && isWipSheet(sheet) ? (
        <SheetPlaceholder sheet={sheet} />
      ) : sheet && isImageSheet(sheet) ? (
        <>
          {/* The reference sheet opens the page and is by far its largest
              element, so it is this route's LCP candidate. */}
          <ArtworkCard
            src={sheet.src}
            alt={sheet.title}
            artist={sheet.artist}
            priority
          />
          <div className="mt-6 flex justify-center">
            <OpenImageLink image={sheet.src} />
          </div>
        </>
      ) : null}

      {profile.description ? (
        <Reveal>
          <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-glow-500/25 bg-glow-500/10 px-6 py-5 text-center shadow-inner-glow">
            <h2 className="font-display text-xs font-medium uppercase tracking-[0.28em] text-parchment-dim">
              About
            </h2>
            <RichTextContent
              className="mt-3 text-sm leading-relaxed text-parchment-muted"
              value={profile.description}
            />
          </section>
        </Reveal>
      ) : null}

      <div className="mt-14">
        <ExampleGrid
          examples={profile.examples}
          basePath={basePath}
          title="Examples"
          description={isNsfw ? "18+ content." : undefined}
          showBackButton={false}
        />
      </div>
    </div>
  );
}
