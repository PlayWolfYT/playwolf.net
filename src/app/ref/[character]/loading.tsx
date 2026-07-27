/** Lightweight skeleton shown while a character page is loading:
 *  profile bar, description line, artwork frame, and example grid. */

/** Skeleton block with a diagonal accent shimmer sweeping across it.
 *  Pass shape + sizing via className; overflow/rounding stay contained here. */
function SkeletonBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-shimmer" />
    </div>
  );
}

export default function CharacterLoading() {
  return (
    <div className="w-full animate-pulse" aria-hidden>
      {/* Profile bar */}
      <div className="mb-10 border-b border-white/[0.07] pb-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-6 w-36 rounded-lg bg-white/[0.06]" />
            <SkeletonBlock className="h-2.5 w-24 rounded bg-white/[0.04]" />
          </div>
          <SkeletonBlock className="h-11 w-56 rounded-full bg-white/[0.06]" />
        </div>
      </div>

      {/* Description */}
      <SkeletonBlock className="mx-auto mb-8 h-4 w-full max-w-md rounded bg-white/[0.05]" />

      {/* Artwork frame */}
      <SkeletonBlock className="mx-auto aspect-[4/3] w-full max-w-4xl rounded-3xl border border-white/[0.07] bg-white/[0.04]" />

      {/* Example grid */}
      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="aspect-square rounded-2xl border border-white/[0.07] bg-white/[0.04]"
          />
        ))}
      </div>
    </div>
  );
}
