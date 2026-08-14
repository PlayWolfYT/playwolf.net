import { Skeleton, SkeletonScreen } from "@/components/site/Skeleton";

/** Landing page: hero, then the Work and Characters card rows. */
export default function HomeLoading() {
  return (
    <SkeletonScreen
      label="Loading page"
      className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <div className="text-center">
        <div className="mb-8 flex justify-center gap-4">
          <Skeleton className="h-4 w-4 rounded-sm bg-white/[0.06]" />
          <Skeleton className="h-3 w-3 translate-y-1 rounded-sm bg-white/[0.04]" />
          <Skeleton className="h-4 w-4 rounded-sm bg-white/[0.06]" />
        </div>

        <Skeleton className="mx-auto h-4 w-32 rounded bg-white/[0.05]" />
        <Skeleton className="mx-auto mt-6 h-10 w-full max-w-2xl rounded-xl bg-white/[0.06] sm:h-14" />
        <Skeleton className="mx-auto mt-6 h-5 w-full max-w-xl rounded bg-white/[0.04]" />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Skeleton className="h-11 w-44 rounded-full bg-white/[0.06]" />
          <Skeleton className="h-11 w-36 rounded-full bg-white/[0.05]" />
        </div>
      </div>

      <div className="mt-28">
        <Skeleton className="h-8 w-28 rounded-lg bg-white/[0.06] sm:h-9" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-3xl border border-white/[0.07] bg-void-lift/60"
            >
              <Skeleton className="aspect-[16/9] w-full bg-white/[0.04]" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-6 w-2/3 rounded bg-white/[0.05]" />
                <Skeleton className="h-4 w-full rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-28">
        <Skeleton className="h-8 w-40 rounded-lg bg-white/[0.06] sm:h-9" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-3xl border border-white/[0.07] bg-void-lift/60"
            >
              <Skeleton className="aspect-square w-full bg-white/[0.04]" />
              <div className="space-y-2 p-5">
                <Skeleton className="h-6 w-1/2 rounded bg-white/[0.05]" />
                <Skeleton className="h-3 w-1/3 rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonScreen>
  );
}
