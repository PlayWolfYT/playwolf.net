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
  "inline-flex min-h-11 max-w-[45%] items-center gap-2 rounded-full border border-white/10 bg-void/70 px-4 text-sm text-parchment-muted transition hover:border-glow-500/40 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";

/**
 * Step between the images of one profile without going back to the grid. The
 * titles are shown rather than bare arrows so the destination is knowable
 * before clicking — and so the links have a useful accessible name.
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
      className="mt-8 flex w-full items-center justify-between gap-3"
    >
      <KeyNav prevHref={prevHref} nextHref={nextHref} />

      {previous ? (
        <Link href={`${basePath}/${previous.slug}`} rel="prev" className={LINK_CLASS}>
          <ChevronIcon />
          <span className="truncate">{previous.title}</span>
        </Link>
      ) : (
        <span aria-hidden />
      )}

      <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
        {position} / {total}
      </span>

      {next ? (
        <Link
          href={`${basePath}/${next.slug}`}
          rel="next"
          className={`${LINK_CLASS} justify-end`}
        >
          <span className="truncate">{next.title}</span>
          <ChevronIcon className="rotate-180" />
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
