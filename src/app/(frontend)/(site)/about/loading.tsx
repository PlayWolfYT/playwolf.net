import {
  SkeletonPageHeader,
  SkeletonProse,
  SkeletonScreen,
} from "@/components/site/Skeleton";

/** Header plus the panel the about copy is written into. */
export default function AboutLoading() {
  return (
    <SkeletonScreen
      label="Loading page"
      className="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <SkeletonPageHeader lede={false} />

      <div className="mt-12 rounded-3xl border border-white/[0.07] bg-void-lift/60 px-6 py-8 sm:px-10 sm:py-10">
        <SkeletonProse lines={6} />
      </div>
    </SkeletonScreen>
  );
}
