import type { StaticImageData } from "next/image";
import type { Artist } from "@/lib/references";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { NsfwReveal } from "@/components/ref/NsfwReveal";
import { ShimmerImage } from "@/components/ref/ShimmerImage";

type ArtworkCardProps = {
  src: StaticImageData;
  alt: string;
  nsfw?: boolean;
  /** Rendered flush against the bottom of the image, inside the same card */
  artist?: Artist;
  priority?: boolean;
};

/**
 * Widest the artwork may grow on large screens. Derived from the aspect ratio
 * so wide reference sheets can use the room a near-full-width page offers
 * while tall pieces don't end up taller than the viewport.
 */
function frameFor(src: StaticImageData): { className: string; px: number } {
  const ratio = src.width / src.height;
  if (ratio >= 1.3) return { className: "max-w-6xl", px: 1152 };
  if (ratio >= 0.85) return { className: "max-w-4xl", px: 896 };
  return { className: "max-w-2xl", px: 672 };
}

/**
 * Single piece of artwork with its credit bar attached to the same card. The
 * real `src` is always rendered (the NSFW blur is a CSS-only overlay), so
 * direct links and crawlers receive the unblurred asset.
 */
export function ArtworkCard({
  src,
  alt,
  nsfw = false,
  artist,
  priority = false,
}: ArtworkCardProps) {
  const frame = frameFor(src);

  const image = (
    <ShimmerImage
      src={src}
      alt={alt}
      width={src.width}
      height={src.height}
      // Next only generates blurDataURL for lowercase image extensions;
      // some assets are .PNG, so fall back to no placeholder for those.
      placeholder={src.blurDataURL ? "blur" : "empty"}
      priority={priority}
      sizes={`(max-width: ${frame.px}px) 100vw, ${frame.px}px`}
      className="h-auto w-full"
    />
  );

  return (
    <figure
      className={`mx-auto w-full rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 shadow-glow-sm ${frame.className}`}
    >
      <div
        className={`relative overflow-hidden rounded-t-3xl ${artist ? "" : "rounded-b-3xl"}`}
      >
        {nsfw ? <NsfwReveal>{image}</NsfwReveal> : image}
      </div>

      {artist ? (
        <figcaption>
          <ArtistBar artist={artist} />
        </figcaption>
      ) : null}
    </figure>
  );
}
