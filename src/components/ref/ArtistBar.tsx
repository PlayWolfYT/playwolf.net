import type { Artist } from "@/lib/content";
import { LinkRow } from "@/components/site/LinkRow";

/**
 * Credit bar for a piece of artwork. Styled to sit flush against the bottom of
 * the image inside the same card — hence the divider on top and rounding only
 * on the bottom corners.
 */
export function ArtistBar({ artist }: { artist: Artist }) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-b-3xl border-t border-white/12 bg-linear-to-br from-void-lift to-void-panel px-5 py-4 sm:flex-row">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-glow-500">
          Artist
        </span>
        <span className="font-display text-base font-medium text-parchment">
          {artist.name}
        </span>
      </div>

      <LinkRow links={artist.links} />
    </div>
  );
}
