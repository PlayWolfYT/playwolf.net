import { Skeleton, SkeletonProse, SkeletonScreen } from "@/components/site/Skeleton";

/** One project: status line, title, summary, the 16:9 cover, then the body. */
export default function ProjectLoading() {
  return (
    <SkeletonScreen
      label="Loading project"
      className="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <div className="text-center">
        <Skeleton className="mx-auto h-3 w-32 rounded bg-white/[0.05]" />
        <Skeleton className="mx-auto mt-4 h-9 w-64 rounded-lg bg-white/[0.06] sm:h-10 sm:w-80" />
        <Skeleton className="mx-auto mt-4 h-4 w-full max-w-xl rounded bg-white/[0.04]" />
      </div>

      <Skeleton className="mt-12 aspect-[16/9] w-full rounded-3xl border border-white/[0.07] bg-white/[0.04]" />

      <div className="mt-12">
        <SkeletonProse lines={5} />
      </div>
    </SkeletonScreen>
  );
}
