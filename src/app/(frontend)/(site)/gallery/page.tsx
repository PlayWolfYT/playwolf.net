import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/site/EmptyState";
import { FacetBar, galleryHref, parseFilter } from "@/components/site/FacetBar";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { PageHeader } from "@/components/site/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { matchesFilter } from "@/lib/content";
import { getGallery } from "@/lib/references";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Every commission and reference in one place, filterable.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GalleryPage({ searchParams }: PageProps) {
  const [items, params] = await Promise.all([getGallery(), searchParams]);
  const filter = parseFilter(params);
  const shown = items.filter((item) => matchesFilter(item, filter));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <PageHeader
        eyebrow="Image index"
        title="Gallery"
        lede="Every piece across every character. Filter by artist, cast, tag, or state without losing the shareable URL."
      />

      <div className="mt-10">
        <FacetBar filter={filter} items={items} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Result set
        </p>
        <Badge variant="outline">
          {shown.length} {shown.length === 1 ? "piece" : "pieces"}
        </Badge>
      </div>

      <div className="mt-5">
        {shown.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            description="No artwork fits every filter at once. Try loosening one of them."
          >
            <Link
              href={galleryHref({
                includeNsfw: filter.includeNsfw,
                includeWip: filter.includeWip,
              })}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "rounded-xl",
              )}
            >
              Clear filters
            </Link>
          </EmptyState>
        ) : (
          <GalleryGrid items={shown} />
        )}
      </div>
    </div>
  );
}
