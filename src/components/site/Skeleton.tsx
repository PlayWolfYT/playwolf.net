import type { ReactNode } from "react";

/**
 * The thumbnail grid container shared by `GalleryGrid` and `ExampleGrid`.
 * Repeated here so a loading state reserves the same columns the real cards
 * land in and nothing jumps when they arrive — keep the three in step.
 */
export const THUMB_GRID_CLASS =
  "grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5";

/**
 * One placeholder bone with the accent shimmer sweeping across it. Shape, size
 * and fill come from `className`; the sweep and its clipping live here.
 *
 * Always `aria-hidden`: the bones are decoration standing in for content that
 * does not exist yet, and the wait itself is announced by `SkeletonScreen`.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-shimmer" />
    </div>
  );
}

/**
 * Wrapper for a route's whole loading state.
 *
 * `role="status"` turns it into a live region so a screen reader is told the
 * page is still coming, instead of the silence a wholly `aria-hidden` skeleton
 * leaves behind. `label` is both the region's name and its only announceable
 * text, since every bone inside is hidden.
 */
export function SkeletonScreen({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`w-full animate-pulse ${className}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Sparkle row, eyebrow, title and lede of `PageHeader`, at the same sizes. */
export function SkeletonPageHeader({ lede = true }: { lede?: boolean }) {
  return (
    <div className="text-center">
      <div className="mb-10 flex justify-center gap-4">
        <Skeleton className="h-4 w-4 rounded-sm bg-white/[0.06]" />
        <Skeleton className="h-3 w-3 translate-y-1 rounded-sm bg-white/[0.04]" />
        <Skeleton className="h-4 w-4 rounded-sm bg-white/[0.06]" />
      </div>
      <Skeleton className="mx-auto h-3 w-32 rounded bg-white/[0.05]" />
      <Skeleton className="mx-auto mt-5 h-9 w-56 rounded-lg bg-white/[0.06] sm:h-10 sm:w-72" />
      {lede ? (
        <Skeleton className="mx-auto mt-6 h-4 w-full max-w-md rounded bg-white/[0.04]" />
      ) : null}
    </div>
  );
}

/**
 * A square thumbnail card with its caption, as used by every artwork grid.
 * `captionLines` is 2 in the gallery, where each tile also names the character.
 */
export function SkeletonThumbCard({ captionLines = 1 }: { captionLines?: 1 | 2 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-void-lift/60">
      <Skeleton className="aspect-square w-full bg-white/[0.04]" />
      <div className="px-3 py-2.5">
        <Skeleton className="h-5 w-3/4 rounded bg-white/[0.05]" />
        {captionLines === 2 ? (
          <Skeleton className="mt-0.5 h-2.5 w-1/2 rounded bg-white/[0.04]" />
        ) : null}
      </div>
    </div>
  );
}

/** Lines of body copy, tapering on the last line like real prose. */
export function SkeletonProse({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 rounded bg-white/[0.04] ${
            index === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
