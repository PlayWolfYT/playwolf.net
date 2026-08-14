import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FACET_KEYS,
  FACET_LABELS,
  facetOptions,
  type FacetKey,
  type GalleryFilter,
  type GalleryItem,
} from "@/lib/content";
import { cn } from "@/lib/utils";

export function galleryHref(filter: GalleryFilter): string {
  const params = new URLSearchParams();
  for (const key of FACET_KEYS) {
    const value = filter[key];
    if (value) params.set(key, value);
  }
  if (filter.includeNsfw) params.set("nsfw", "1");
  if (filter.includeWip) params.set("wip", "1");

  const query = params.toString();
  return query ? `/gallery?${query}` : "/gallery";
}

export function parseFilter(
  params: Record<string, string | string[] | undefined>,
): GalleryFilter {
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const filter: GalleryFilter = {
    includeNsfw: single(params.nsfw) === "1",
    includeWip: single(params.wip) === "1",
  };
  for (const key of FACET_KEYS) {
    const value = single(params[key]);
    if (value) filter[key] = value;
  }
  return filter;
}

function chipClass(selected: boolean) {
  return cn(
    buttonVariants({
      variant: selected ? "default" : "outline",
      size: "sm",
    }),
    "rounded-full",
  );
}

function FacetRow({
  active,
  facetKey,
  filter,
  items,
}: {
  active?: string;
  facetKey: FacetKey;
  filter: GalleryFilter;
  items: GalleryItem[];
}) {
  const options = facetOptions(items, facetKey, filter);
  if (options.length === 0) return null;

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[7rem_1fr] sm:items-start">
      <span className="pt-2 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
        {FACET_LABELS[facetKey]}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = active === option.slug;
          return (
            <Link
              key={option.slug}
              href={galleryHref({
                ...filter,
                [facetKey]: selected ? undefined : option.slug,
              })}
              aria-pressed={selected}
              className={chipClass(selected)}
            >
              {option.label}
              <Badge variant={selected ? "secondary" : "ghost"}>{option.count}</Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function FacetBar({
  filter,
  items,
}: {
  filter: GalleryFilter;
  items: GalleryItem[];
}) {
  const narrowed = FACET_KEYS.some((key) => filter[key]);
  const activeCount =
    FACET_KEYS.filter((key) => filter[key]).length +
    (filter.includeNsfw ? 1 : 0) +
    (filter.includeWip ? 1 : 0);

  return (
    <Accordion
      defaultValue={activeCount > 0 ? ["gallery-filters"] : []}
      className="rounded-2xl border border-border bg-card/85 px-5 shadow-glow-sm backdrop-blur-sm"
    >
      <AccordionItem value="gallery-filters" className="border-0">
        <AccordionTrigger className="py-4 hover:no-underline">
          <span className="flex items-center gap-3">
            <span className="font-display text-base font-semibold tracking-[-0.025em]">
              Filter the archive
            </span>
            {activeCount > 0 ? (
              <Badge variant="secondary">{activeCount} active</Badge>
            ) : (
              <Badge variant="outline">All work</Badge>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-5">
          <Separator />
          <div className="flex flex-col">
            {FACET_KEYS.map((key, index) => (
              <div key={key}>
                {index > 0 ? <Separator /> : null}
                <FacetRow
                  active={filter[key]}
                  facetKey={key}
                  filter={filter}
                  items={items}
                />
              </div>
            ))}
          </div>

          <Separator className="mb-4" />
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={galleryHref({
                ...filter,
                includeNsfw: !filter.includeNsfw,
              })}
              aria-pressed={filter.includeNsfw}
              className={chipClass(Boolean(filter.includeNsfw))}
            >
              {filter.includeNsfw ? "Showing 18+" : "Show 18+"}
            </Link>
            <Link
              href={galleryHref({
                ...filter,
                includeWip: !filter.includeWip,
              })}
              aria-pressed={filter.includeWip}
              className={chipClass(Boolean(filter.includeWip))}
            >
              {filter.includeWip ? "Showing WIP" : "Show WIP"}
            </Link>
            {narrowed ? (
              <Link
                href={galleryHref({
                  includeNsfw: filter.includeNsfw,
                  includeWip: filter.includeWip,
                })}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
