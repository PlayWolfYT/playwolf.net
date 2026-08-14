import Link from "next/link";

import type { Example } from "@/lib/content";
import { KeyNav } from "@/components/ref/KeyNav";

type ExampleNavProps = {
  /** Route prefix the siblings live under, e.g. `/ref/playwuff/sfw`. */
  basePath: string;
  previous?: Example;
  next?: Example;
  /** One-based position of the current image within the profile. */
  position: number;
  total: number;
};

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${className}`}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const LINK_CLASS =
  "inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-glow-500/30 bg-glow-500/[0.06] px-3 text-sm text-glow-300 shadow-[0_12px_35px_-26px_rgb(var(--accent-500)/0.9)] transition hover:border-glow-400/65 hover:bg-glow-500/15 hover:text-glow-300 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 sm:max-w-[45%] sm:flex-none sm:px-4";

/**
 * Step between the images of one profile without going back to the grid. The
 * titles are shown rather than bare arrows so the destination is knowable
 * before clicking — and so the links have a useful accessible name. On narrow
 * screens titles hide and the links become "Prev"/"Next" so the row fits.
 */
export function ExampleNav({
  basePath,
  previous,
  next,
  position,
  total,
}: ExampleNavProps) {
  if (total < 2) return null;

  const prevHref = previous ? `${basePath}/${previous.slug}` : undefined;
  const nextHref = next ? `${basePath}/${next.slug}` : undefined;

  return (
    <nav
      aria-label="Image"
      className="mt-8 flex w-full items-center justify-between gap-2 sm:gap-3"
    >
      <KeyNav prevHref={prevHref} nextHref={nextHref} />

      {previous ? (
        <Link href={`${basePath}/${previous.slug}`} rel="prev" className={LINK_CLASS}>
          <ChevronIcon />
          <span className="sm:hidden">Prev</span>
          <span className="hidden truncate sm:inline">{previous.title}</span>
        </Link>
      ) : (
        <span className="min-w-0 flex-1 sm:max-w-[45%] sm:flex-none" aria-hidden />
      )}

      <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-glow-400">
        {position} / {total}
      </span>

      {next ? (
        <Link
          href={`${basePath}/${next.slug}`}
          rel="next"
          className={`${LINK_CLASS} justify-end`}
        >
          <span className="sm:hidden">Next</span>
          <span className="hidden truncate sm:inline">{next.title}</span>
          <ChevronIcon className="rotate-180" />
        </Link>
      ) : (
        <span className="min-w-0 flex-1 sm:max-w-[45%] sm:flex-none" aria-hidden />
      )}
    </nav>
  );
}
