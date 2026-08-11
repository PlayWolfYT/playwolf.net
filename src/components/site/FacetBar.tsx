import Link from "next/link";

import {
  FACET_KEYS,
  FACET_LABELS,
  facetOptions,
  type FacetKey,
  type GalleryFilter,
  type GalleryItem,
} from "@/lib/content";

/**
 * Filters live entirely in the query string: every control below is a plain
 * link to another URL, so the state survives a reload, can be shared, and
 * works before any JavaScript arrives.
 */
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

/** Reading a filter back off the URL, ignoring anything unrecognised. */
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

const CHIP_BASE =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";
const CHIP_OFF = `${CHIP_BASE} border-white/10 bg-void/70 text-parchment-muted hover:border-glow-500/40 hover:text-parchment`;
const CHIP_ON = `${CHIP_BASE} border-glow-500/45 bg-glow-500/10 text-glow-400 hover:bg-glow-500/20`;

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
    <div className="flex flex-col gap-2 border-b border-white/[0.05] pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:border-0 sm:pb-0">
      <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-parchment-dim sm:w-20">
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
              className={selected ? CHIP_ON : CHIP_OFF}
            >
              {option.label}
              <span className="text-parchment-dim">{option.count}</span>
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
    <div className="rounded-3xl border border-white/[0.07] bg-void-lift/40 backdrop-blur-xl">
      {/* Checkbox disclosure: collapsed by default on mobile, always open from sm. */}
      <input
        type="checkbox"
        id="gallery-filters"
        className="peer sr-only"
        defaultChecked={activeCount > 0}
      />
      <label
        htmlFor="gallery-filters"
        className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment transition hover:text-glow-400 peer-checked:[&>span:last-child]:rotate-180 sm:hidden"
      >
        <span>
          Filters
          {activeCount > 0 ? (
            <span className="ml-2 text-glow-400">· {activeCount} active</span>
          ) : null}
        </span>
        <span aria-hidden className="text-parchment-dim transition">
          ▾
        </span>
      </label>

      <div className="hidden flex-col gap-3 border-t border-white/[0.07] p-4 peer-checked:flex sm:flex sm:border-0 sm:p-5">
        {FACET_KEYS.map((key) => (
          <FacetRow
            key={key}
            active={filter[key]}
            facetKey={key}
            filter={filter}
            items={items}
          />
        ))}

        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
          <Link
            href={galleryHref({ ...filter, includeNsfw: !filter.includeNsfw })}
            aria-pressed={filter.includeNsfw}
            className={filter.includeNsfw ? CHIP_ON : CHIP_OFF}
          >
            {filter.includeNsfw ? "Showing 18+" : "Show 18+"}
          </Link>

          <Link
            href={galleryHref({ ...filter, includeWip: !filter.includeWip })}
            aria-pressed={filter.includeWip}
            className={filter.includeWip ? CHIP_ON : CHIP_OFF}
          >
            {filter.includeWip ? "Showing WIP" : "Show WIP"}
          </Link>

          {narrowed ? (
            <Link
              href={galleryHref({
                includeNsfw: filter.includeNsfw,
                includeWip: filter.includeWip,
              })}
              className={CHIP_OFF}
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
