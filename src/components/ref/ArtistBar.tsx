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
    <div className="flex flex-col items-center justify-between gap-4 border-t border-glow-500/25 bg-glow-500/[0.07] px-5 py-4 shadow-[inset_0_1px_0_rgb(var(--accent-300)/0.08)] sm:flex-row">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <Badge
          variant="outline"
          className="border-glow-500/40 bg-glow-500/10 text-glow-300"
        >
          Artist
        </Badge>
        <span className="font-display text-base font-semibold text-foreground">
          {artist.name}
        </span>
      </div>

      <LinkRow
        links={artist.links}
        align="center"
        className="[&_a]:border-glow-500/30 [&_a]:bg-glow-500/8 [&_a]:text-glow-300 [&_a]:shadow-[0_0_22px_-12px_rgb(var(--accent-500)/0.9)] [&_a]:hover:border-glow-400/60 [&_a]:hover:bg-glow-500/15"
      />
    </div>
  );
}
