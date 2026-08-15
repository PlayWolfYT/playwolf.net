import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { Reveal } from "@/components/motion/Reveal";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { SheetPlaceholder } from "@/components/ref/SheetPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
          <Card className="relative mx-auto mt-10 max-w-3xl overflow-hidden border-glow-500/30 bg-glow-500/[0.08] shadow-[inset_0_1px_0_rgb(var(--accent-300)/0.14),0_24px_70px_-48px_rgb(var(--accent-500)/0.9)] [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
            <span
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-linear-to-r from-transparent via-glow-300/85 to-transparent"
              aria-hidden
            />
            <CardHeader>
              <Badge
                variant="outline"
                className="border-glow-500/35 bg-glow-500/10 text-glow-300"
              >
                About this profile
              </Badge>
            </CardHeader>
            <CardContent className="relative">
              <RichTextContent
                className="text-base leading-relaxed text-foreground/80"
                value={profile.description}
              />
            </CardContent>
          </Card>
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
