import type { Example } from "@/lib/content";

/**
 * Corner chip on grid thumbs for pieces with same-rating alternate versions.
 * The count includes the main image, so "2" reads as "two versions in total".
 * Cross-rating counterparts (slides carrying a `profile`) are excluded — an
 * SFW card must not advertise or count its After Dark twin.
 */
export function VersionBadge({ example }: { example: Example }) {
  const sameRating = example.alts.filter((slide) => !slide.profile);
  if (sameRating.length === 0) return null;
  const count = sameRating.length + 1;

  return (
    <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-white/10 bg-void/75 px-2 py-1 font-mono text-[0.6rem] text-parchment-muted backdrop-blur">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
        aria-hidden
      >
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
      {count}
      <span className="sr-only">versions</span>
    </span>
  );
}
