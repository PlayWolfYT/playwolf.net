import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { Reveal } from "@/components/motion/Reveal";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { SheetPlaceholder } from "@/components/ref/SheetPlaceholder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <ArtworkCard src={sheet.src} alt={sheet.title} artist={sheet.artist} />
          <div className="mt-6 flex justify-center">
            <OpenImageLink image={sheet.src} />
          </div>
        </>
      ) : null}

      {profile.description ? (
        <Reveal>
          <Card className="mx-auto mt-10 max-w-3xl [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Character notes
              </Badge>
              <CardTitle className="mt-3 text-2xl font-bold tracking-[-0.045em]">
                About this profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextContent
                className="text-base leading-relaxed text-muted-foreground"
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
