import {
  Skeleton,
  SkeletonPageHeader,
  SkeletonScreen,
} from "@/components/site/Skeleton";

/** Header plus the panel holding the row of circular link buttons. */
export default function LinksLoading() {
  return (
    <SkeletonScreen
      label="Loading links"
      className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <SkeletonPageHeader />

      <div className="mt-12 rounded-3xl border border-white/[0.07] bg-void-lift/60 px-6 py-10">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-11 rounded-full bg-white/[0.05]" />
          ))}
        </div>
      </div>
    </SkeletonScreen>
  );
}
