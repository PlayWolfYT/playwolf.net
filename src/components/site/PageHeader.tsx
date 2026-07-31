import type { ReactNode } from "react";
import { SparkStar } from "@/components/BrandBackdrop";

/**
 * The heading treatment every non-landing page opens with — the same sparkle
 * row, title weight and lede width, so the pages read as one site.
 */
export function PageHeader({
  children,
  eyebrow,
  lede,
  title,
}: {
  children?: ReactNode;
  eyebrow?: string;
  lede?: string;
  title: string;
}) {
  return (
    <header className="text-center">
      <div className="mb-10 flex justify-center gap-4 text-glow-500/40" aria-hidden>
        <SparkStar className="h-4 w-4 animate-twinkle" />
        <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
        <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
      </div>

      {eyebrow ? (
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-glow-500">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="mt-4 font-display text-3xl font-light tracking-tight text-parchment sm:text-4xl">
        {title}
      </h1>

      {lede ? (
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchment-muted">
          {lede}
        </p>
      ) : null}

      {children}
    </header>
  );
}
