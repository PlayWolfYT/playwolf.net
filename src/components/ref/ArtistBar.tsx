import type { Artist } from "@/lib/content";
import { LinkRow } from "@/components/site/LinkRow";
import { Badge } from "@/components/ui/badge";

/**
 * Credit bar for a piece of artwork. Styled to sit flush against the bottom of
 * the image inside the same card — hence the divider on top and rounding only
 * on the bottom corners.
 */
export function ArtistBar({ artist }: { artist: Artist }) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-muted/35 px-5 py-4 sm:flex-row">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <Badge variant="outline">Artist</Badge>
        <span className="font-display text-base font-semibold text-foreground">
          {artist.name}
        </span>
      </div>

      <LinkRow links={artist.links} align="end" />
    </div>
  );
}
