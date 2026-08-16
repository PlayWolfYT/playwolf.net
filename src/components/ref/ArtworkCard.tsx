import type { CSSProperties, ReactNode } from "react";
import type { Artist, ImageRef } from "@/lib/content";
import { placeholderFor } from "@/lib/content";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { ArtworkStageSwap } from "@/components/ref/ArtworkStageSwap";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { WipTape } from "@/components/ref/WipTape";

type ArtworkCardProps = {
  src: ImageRef;
  alt: string;
  /** Rendered flush against the bottom of the image, inside the same card */
  artist?: Artist;
  /**
   * `"viewport"` (default) sizes the card to the image after both the column
   * cap and a viewport height cap, so the whole piece stays on screen.
   * `"page"` lets it run at column width to its intrinsic height.
   */
  fit?: "page" | "viewport";
  /**
   * Lock the image area to this file's aspect ratio and contained size.
   * `src` is then fitted inside so alt versions share one unchanging frame.
   */
  stage?: ImageRef;
  /** Overlay controls (alt chevrons, NSFW reveal) sit on the image stage. */
  children?: ReactNode;
  /** +1 / −1 drives the staged wipe when swapping alt versions. */
  swapDirection?: 1 | -1;
  /** When true, show the diagonal WIP tape over the image. */
  isWip?: boolean;
  /**
   * Extra classes on the artwork `<img>` itself — the alt carousel uses this
   * to blur gated 18+ slides from the very first render (no unblurred flash).
   */
  imageClassName?: string;
  /**
   * Set on the one card that is the page's largest above-the-fold image, so
   * the browser fetches it eagerly at high priority instead of discovering it
   * through the lazy-loading queue. At most one per route.
   */
  priority?: boolean;
};

/** Matches the generated sheet placeholder so uploads and WIP stand-ins align. */
export const ARTWORK_MAX_WIDTH_CLASS = "max-w-4xl";
export const ARTWORK_MAX_WIDTH_PX = 896;

/**
 * Viewport height reserved for the image itself. The leftover `14rem` covers
 * the site header, page padding, and the title sitting above the card.
 */
export const ARTWORK_MAX_HEIGHT_SVH = 70;

/**
 * Widest the artwork may grow on large screens. Exported so the alt carousel
 * can size a wrapper to the same frame and pin its chevron controls to the
 * card's edges rather than the page's.
 */
export function frameFor(_src: ImageRef): { className: string; px: number } {
  return { className: ARTWORK_MAX_WIDTH_CLASS, px: ARTWORK_MAX_WIDTH_PX };
}

/**
 * Width of a frame that shows the whole image: the column's `100%`, shrunk
 * further when the height cap binds so the card matches the picture instead
 * of letterboxing or stretching to a credit bar's min-content width.
 */
export function containedFrameStyle(
  src: ImageRef,
  maxSvh: number = ARTWORK_MAX_HEIGHT_SVH,
): CSSProperties {
  const ratio = src.width / Math.max(src.height, 1);
  return {
    width: `min(100%, calc(${maxSvh}svh * ${ratio}), calc((100svh - 14rem) * ${ratio}))`,
  };
}

/** Single piece of artwork with its credit bar attached to the same card. */
export function ArtworkCard({
  src,
  alt,
  artist,
  fit = "viewport",
  stage,
  children,
  swapDirection = 1,
  isWip = false,
  imageClassName,
  priority = false,
}: ArtworkCardProps) {
  const box = stage ?? src;
  const framed = Boolean(stage);
  const metrics = frameFor(box);
  const bounded = fit === "viewport";

  const image = framed ? (
    <ArtworkStageSwap
      src={src}
      alt={alt}
      direction={swapDirection}
      priority={priority}
      imageClassName={imageClassName}
      sizes={`(max-width: ${metrics.px}px) 100vw, ${metrics.px}px`}
    />
  ) : (
    <ShimmerImage
      src={src}
      alt={alt}
      width={src.width}
      height={src.height}
      priority={priority}
      placeholder={placeholderFor(src)}
      sizes={`(max-width: ${metrics.px}px) 100vw, ${metrics.px}px`}
      className={`h-auto w-full${imageClassName ? ` ${imageClassName}` : ""}`}
    />
  );

  return (
    <figure
      // Hover feedback lives on the frame (border + glow), never the artwork:
      // the pointer crosses the image on its way to the controls around it,
      // and a large picture zooming under the cursor reads as jitter.
      className={`group mx-auto min-w-0 w-full overflow-hidden rounded-2xl border border-glow-500/30 bg-[linear-gradient(145deg,rgb(var(--accent-500)/0.12),rgb(var(--accent-700)/0.04)_38%,var(--card)_72%)] shadow-[0_26px_85px_-54px_rgb(var(--accent-500)/0.95),0_0_0_1px_rgb(var(--accent-500)/0.06)] backdrop-blur-sm transition duration-300 hover:border-glow-400/65 hover:shadow-[0_30px_90px_-46px_rgb(var(--accent-500)/0.95),0_0_0_1px_rgb(var(--accent-400)/0.12)] ${metrics.className}`}
      style={bounded ? containedFrameStyle(box) : undefined}
    >
      <div className="relative overflow-hidden">
        <div
          className={framed ? "relative w-full bg-void" : "relative"}
          style={framed ? { aspectRatio: `${box.width} / ${box.height}` } : undefined}
        >
          {image}
          {isWip ? <WipTape /> : null}
          {children}
        </div>
      </div>

      {artist ? (
        <figcaption className="min-w-0">
          <ArtistBar artist={artist} />
        </figcaption>
      ) : null}
    </figure>
  );
}
