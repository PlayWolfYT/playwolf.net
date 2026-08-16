import {
  Skeleton,
  SkeletonPageHeader,
  SkeletonScreen,
} from "@/components/site/Skeleton";

/** Header plus one row of project cards, on the same three-column tracks. */
export default function ProjectsLoading() {
  return (
    <SkeletonScreen
      label="Loading projects"
      className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <SkeletonPageHeader />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-white/[0.07] bg-void-lift/60"
          >
            <Skeleton className="aspect-[16/9] w-full bg-white/[0.04]" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-6 w-2/3 rounded bg-white/[0.05]" />
              <Skeleton className="h-4 w-full rounded bg-white/[0.03]" />
              <Skeleton className="h-3 w-16 rounded bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}
