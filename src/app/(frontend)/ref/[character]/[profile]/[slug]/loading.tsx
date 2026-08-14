import { Skeleton, SkeletonScreen } from "@/components/site/Skeleton";

/**
 * A single artwork: title, the frame itself, the chips under it and the
 * previous/next row. The frame is `4/3` because the real one is sized from the
 * artwork's own ratio, which is not known until it arrives.
 */
export default function ArtworkLoading() {
  return (
    <SkeletonScreen label="Loading artwork">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Skeleton className="h-8 w-64 rounded-lg bg-white/[0.06] sm:h-9 sm:w-80" />
      </div>

      <Skeleton className="mx-auto aspect-[4/3] w-full max-w-4xl rounded-3xl border border-white/[0.07] bg-white/[0.04]" />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Skeleton className="h-7 w-24 rounded-full bg-white/[0.05]" />
        <Skeleton className="h-7 w-20 rounded-full bg-white/[0.05]" />
        <Skeleton className="h-7 w-28 rounded-full bg-white/[0.05]" />
      </div>

      <div className="mt-6 flex justify-center">
        <Skeleton className="h-11 w-44 rounded-full bg-white/[0.06]" />
      </div>

      <div className="mt-14 flex items-center justify-between gap-4">
        <Skeleton className="h-11 w-32 rounded-full bg-white/[0.05]" />
        <Skeleton className="h-3 w-16 rounded bg-white/[0.04]" />
        <Skeleton className="h-11 w-32 rounded-full bg-white/[0.05]" />
      </div>
    </SkeletonScreen>
  );
}
