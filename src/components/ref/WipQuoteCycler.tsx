"use client";

import { useEffect, useState } from "react";

type WipQuoteCyclerProps = {
  quotes: string[];
  /** Milliseconds a quote stays on screen */
  interval: number;
};

/** Must match the `transition-*` duration on the quote line. */
const FADE_MS = 500;

/**
 * Fades between random quotes from the pool, with a bar underneath that fills
 * over each interval. Split out of `SheetPlaceholder` so the placeholder can
 * stay a server component (it receives icon components as props).
 */
export function WipQuoteCycler({ quotes, interval }: WipQuoteCyclerProps) {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [visible, setVisible] = useState(false);

  // The first pick happens after mount so the server markup (index 0, faded
  // out) always hydrates cleanly before the shuffle starts.
  useEffect(() => {
    if (quotes.length === 0) return;

    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    // Defer the first pick so hydration stays deterministic (index 0,
    // faded out) and we avoid synchronous setState in the effect body.
    const showTimer = setTimeout(() => {
      if (cancelled) return;
      setIndex(Math.floor(Math.random() * quotes.length));
      setVisible(true);
    }, 40);

    const cycleTimer = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        if (cancelled) return;
        setIndex((previous) => {
          if (quotes.length === 1) return previous;
          let next = previous;
          while (next === previous) {
            next = Math.floor(Math.random() * quotes.length);
          }
          return next;
        });
        setCycle((previous) => previous + 1);
        setVisible(true);
      }, FADE_MS);
    }, interval);

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearInterval(cycleTimer);
    };
  }, [quotes, interval]);

  const quote = quotes[index] ?? "";

  return (
    <>
      <div className="flex min-h-[3.25rem] max-w-md items-center justify-center">
        <p
          className={`font-display text-lg font-light italic leading-snug text-glow-300/90 transition-all duration-500 sm:text-xl ${
            visible
              ? "translate-y-0 opacity-100 blur-0"
              : "translate-y-1 opacity-0 blur-[2px]"
          }`}
          aria-live="polite"
        >
          {quote ? `\u201C${quote}\u201D` : null}
        </p>
      </div>
    </>
  );
}
