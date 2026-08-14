import {
  Skeleton,
  SkeletonScreen,
  THUMB_TRACK_CLASS,
} from "@/components/site/Skeleton";

/** Profile bar, description line, reference sheet frame and example grid. */
export default function CharacterLoading() {
  return (
    <SkeletonScreen label="Loading character">
      {/* Profile bar */}
      <div className="mb-10 border-b border-white/[0.07] pb-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36 rounded-lg bg-white/[0.06]" />
            <Skeleton className="h-2.5 w-24 rounded bg-white/[0.04]" />
          </div>
          <Skeleton className="h-11 w-56 rounded-full bg-white/[0.06]" />
        </div>
      </div>

      {/* Description */}
      <Skeleton className="mx-auto mb-8 h-4 w-full max-w-md rounded bg-white/[0.05]" />

      {/* Reference sheet */}
      <Skeleton className="mx-auto aspect-[4/3] w-full max-w-4xl rounded-3xl border border-white/[0.07] bg-white/[0.04]" />

      {/* Example grid — flex-wrap mirrors ExampleGrid so incomplete rows stay centred */}
      <div className="mt-14 flex w-full flex-wrap justify-center gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            className={`aspect-square rounded-2xl border border-white/[0.07] bg-white/[0.04] ${THUMB_TRACK_CLASS}`}
          />
        ))}
      </div>
    </SkeletonScreen>
  );
}
