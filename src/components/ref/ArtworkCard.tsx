import type { Artist, ImageRef } from "@/lib/content";
import { placeholderFor } from "@/lib/content";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { ShimmerImage } from "@/components/ref/ShimmerImage";

type ArtworkCardProps = {
  src: ImageRef;
  alt: string;
  /** Rendered flush against the bottom of the image, inside the same card */
  artist?: Artist;
  /**
   * `"page"` lets a tall piece run past the fold, which is what a page is for.
   * `"viewport"` keeps the whole card on screen instead — the lightbox has
   * nowhere to scroll to.
   */
  fit?: "page" | "viewport";
};

/**
 * Widest the artwork may grow on large screens. Derived from the aspect ratio
 * so wide reference sheets can use the room a near-full-width page offers
 * while tall pieces don't end up taller than the viewport.
 */
function frameFor(src: ImageRef): { className: string; px: number } {
  const ratio = src.width / src.height;
  if (ratio >= 1.3) return { className: "max-w-6xl", px: 1152 };
  if (ratio >= 0.85) return { className: "max-w-4xl", px: 896 };
  return { className: "max-w-2xl", px: 672 };
}

/** Single piece of artwork with its credit bar attached to the same card. */
export function ArtworkCard({ src, alt, artist, fit = "page" }: ArtworkCardProps) {
  const frame = frameFor(src);
  const bounded = fit === "viewport";

  const image = (
    <ShimmerImage
      src={src}
      alt={alt}
      width={src.width}
      height={src.height}
      placeholder={placeholderFor(src)}
      sizes={`(max-width: ${frame.px}px) 100vw, ${frame.px}px`}
      className={
        bounded ? "mx-auto h-auto max-h-[70vh] w-auto max-w-full" : "h-auto w-full"
      }
    />
  );

  return (
    <figure
      className={`mx-auto rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 shadow-glow-sm ${
        bounded ? "w-fit max-w-full" : `w-full ${frame.className}`
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-t-3xl ${artist ? "" : "rounded-b-3xl"}`}
      >
        {image}
      </div>

      {artist ? (
        <figcaption>
          <ArtistBar artist={artist} />
        </figcaption>
      ) : null}
    </figure>
  );
}
