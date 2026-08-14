import {
  Skeleton,
  SkeletonPageHeader,
  SkeletonScreen,
  SkeletonThumbCard,
  THUMB_TRACK_CLASS,
} from "@/components/site/Skeleton";

/**
 * Header, filter bar and the first two rows of tiles. The tracks are shared
 * with `GalleryGrid`, so the columns do not move when the real tiles land.
 */
export default function GalleryLoading() {
  return (
    <SkeletonScreen
      label="Loading gallery"
      className="mx-auto max-w-[100rem] px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <SkeletonPageHeader />

      {/* Filter bar */}
      <div className="mt-12 rounded-3xl border border-white/[0.07] bg-void-lift/40 p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, row) => (
            <div key={row} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Skeleton className="h-3 w-16 shrink-0 rounded bg-white/[0.04] sm:w-20" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, chip) => (
                  <Skeleton
                    key={chip}
                    className="h-11 w-24 rounded-full bg-white/[0.05]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
          <Skeleton className="h-11 w-28 rounded-full bg-white/[0.05]" />
          <Skeleton className="h-11 w-28 rounded-full bg-white/[0.05]" />
        </div>
      </div>

      <Skeleton className="mx-auto mt-6 h-3 w-20 rounded bg-white/[0.04]" />

      <div className="mt-6 flex w-full flex-wrap gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className={THUMB_TRACK_CLASS}>
            <SkeletonThumbCard captionLines={2} />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}
