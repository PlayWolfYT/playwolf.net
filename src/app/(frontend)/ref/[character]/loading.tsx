/** Lightweight skeleton shown while a character page is loading:
 *  profile bar, description line, artwork frame, and example grid. */

import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterLoading() {
  return (
    <div className="w-full animate-pulse" aria-hidden>
      {/* Profile bar */}
      <div className="mb-10 border-b border-white/[0.07] pb-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-36 rounded-lg" />
            <Skeleton className="h-2.5 w-24 rounded-sm" />
          </div>
          <Skeleton className="h-11 w-56 rounded-xl" />
        </div>
      </div>

      {/* Description */}
      <Skeleton className="mx-auto mb-8 h-4 w-full max-w-md rounded-sm" />

      {/* Artwork frame */}
      <Skeleton className="mx-auto aspect-4/3 w-full max-w-4xl rounded-2xl" />

      {/* Example grid — flex-wrap mirrors ExampleGrid so incomplete rows stay centred */}
      <div className="mt-14 flex w-full flex-wrap justify-center gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-square w-[calc((100%-1rem)/2)] rounded-2xl sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]"
          />
        ))}
      </div>
    </div>
  );
}
