import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/site/EmptyState";
import { FacetBar, galleryHref, parseFilter } from "@/components/site/FacetBar";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { PageHeader } from "@/components/site/PageHeader";
import { matchesFilter } from "@/lib/content";
import { getGallery } from "@/lib/references";

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
    <div className="mx-auto w-full max-w-[100rem] px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageHeader
        eyebrow="Everything, everywhere"
        title="Gallery"
        lede="Every piece across every character. Narrow it down by whoever drew it, whoever is in it, or what it is."
      />

      <div className="mt-12">
        <FacetBar filter={filter} items={items} />
      </div>

      <p className="mt-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
        {shown.length} {shown.length === 1 ? "piece" : "pieces"}
      </p>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            description="No artwork fits every filter at once. Try loosening one of them."
          >
            <Link
              href={galleryHref({ includeNsfw: filter.includeNsfw })}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 transition hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
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
