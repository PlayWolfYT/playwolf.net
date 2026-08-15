import type { Artist, ImageRef } from "@/lib/content";
import { placeholderFor } from "@/lib/content";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { WipTape } from "@/components/ref/WipTape";

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
  /** When true, show the diagonal WIP tape over the image. */
  isWip?: boolean;
  /**
   * Extra classes on the artwork `<img>` itself — the alt carousel uses this
   * to blur gated 18+ slides from the very first render (no unblurred flash).
   */
  imageClassName?: string;
};

/**
 * Widest the artwork may grow on large screens. Derived from the aspect ratio
 * so wide reference sheets can use the room a near-full-width page offers
 * while tall pieces don't end up taller than the viewport.
 *
 * Exported so the alt carousel can size a wrapper to the same frame and pin
 * its chevron controls to the card's edges rather than the page's.
 */
export function frameFor(src: ImageRef): { className: string; px: number } {
  const ratio = src.width / src.height;
  if (ratio >= 1.3) return { className: "max-w-6xl", px: 1152 };
  if (ratio >= 0.85) return { className: "max-w-4xl", px: 896 };
  return { className: "max-w-2xl", px: 672 };
}

/** Single piece of artwork with its credit bar attached to the same card. */
export function ArtworkCard({
  src,
  alt,
  artist,
  fit = "page",
  isWip = false,
  imageClassName,
}: ArtworkCardProps) {
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
      className={`${
        bounded ? "mx-auto h-auto max-h-[70vh] w-auto max-w-full" : "h-auto w-full"
      }${imageClassName ? ` ${imageClassName}` : ""}`}
    />
  );

  return (
    <figure
      // Hover feedback lives on the frame (border + glow), never the artwork:
      // the pointer crosses the image on its way to the controls around it,
      // and a large picture zooming under the cursor reads as jitter.
      className={`group mx-auto overflow-hidden rounded-2xl border border-glow-500/30 bg-[linear-gradient(145deg,rgb(var(--accent-500)/0.12),rgb(var(--accent-700)/0.04)_38%,var(--card)_72%)] shadow-[0_26px_85px_-54px_rgb(var(--accent-500)/0.95),0_0_0_1px_rgb(var(--accent-500)/0.06)] backdrop-blur-sm transition duration-300 hover:border-glow-400/65 hover:shadow-[0_30px_90px_-46px_rgb(var(--accent-500)/0.95),0_0_0_1px_rgb(var(--accent-400)/0.12)] ${
        bounded ? "w-fit max-w-full" : `w-full ${frame.className}`
      }`}
    >
      <div className="relative overflow-hidden">
        <div className="relative">
          {image}
          {isWip ? <WipTape /> : null}
        </div>
      </div>

      {artist ? (
        <figcaption>
          <ArtistBar artist={artist} />
        </figcaption>
      ) : null}
    </figure>
  );
}
