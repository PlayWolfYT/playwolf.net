"use client";

import Link from "next/link";

import { errorActionClassName } from "@/components/ErrorPageFrame";

/**
 * Sits inside the reference chrome rather than replacing the page, so a failed
 * character or gallery still leaves the header, footer and navigation usable.
 * Errors thrown by the `/ref` layout itself escape this boundary and land on
 * the frontend-wide one instead.
 */
export default function RefError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 px-8 py-12 text-center shadow-glow-sm backdrop-blur-xl">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-parchment-dim">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
        Could not load this reference
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchment-muted">
        The gallery is temporarily unreachable. Trying again usually does it.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className={errorActionClassName}>
          Try again
        </button>
        <Link
          href="/ref"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-void/70 px-6 text-sm text-parchment-muted transition hover:border-white/25 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          All characters
        </Link>
      </div>

      {process.env.NODE_ENV === "development" && error.message ? (
        <p className="mt-6 break-words text-center font-mono text-[11px] leading-relaxed text-coral-soft/85">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
