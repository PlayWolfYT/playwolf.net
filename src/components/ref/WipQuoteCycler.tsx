"use client";

import { useEffect, useRef, useState } from "react";

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
 *
 * The quote is decoration, so it is `aria-hidden`: announcing a new random
 * line every few seconds forever is a WCAG 2.2.2 failure, and there is nothing
 * here a screen-reader user needs (`SheetPlaceholder` already states the sheet
 * is a work in progress). The swap itself also stops for reduced motion and
 * while the placeholder is off screen.
 */
export function WipQuoteCycler({ quotes, interval }: WipQuoteCyclerProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  // The first pick happens after mount so the server markup (index 0, faded
  // out) always hydrates cleanly before the shuffle starts.
  useEffect(() => {
    if (quotes.length === 0) return;

    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleTimer: ReturnType<typeof setInterval> | undefined;

    // Defer the first pick so hydration stays deterministic (index 0,
    // faded out) and we avoid synchronous setState in the effect body.
    const showTimer = setTimeout(() => {
      if (cancelled) return;
      setIndex(Math.floor(Math.random() * quotes.length));
      setVisible(true);
    }, 40);

    const start = () => {
      if (cycleTimer !== undefined) return;
      cycleTimer = setInterval(() => {
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
          setVisible(true);
        }, FADE_MS);
      }, interval);
    };

    const stop = () => {
      clearInterval(cycleTimer);
      cycleTimer = undefined;
      if (fadeTimer === undefined) return;
      // Caught mid fade-out: finish on the quote that is already there rather
      // than leaving the line blank until something resumes it.
      clearTimeout(fadeTimer);
      fadeTimer = undefined;
      setVisible(true);
    };

    // The global reduced-motion rule in `globals.css` flattens the transition
    // but not the swap, so a reduced-motion visitor would get the text
    // replaced abruptly every few seconds — the gate has to live here.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Starts closed: nothing cycles until the observer confirms the
    // placeholder is actually on screen.
    let onScreen = false;

    const sync = () => {
      if (reduced.matches || !onScreen) stop();
      else start();
    };

    const node = frameRef.current;
    let observer: IntersectionObserver | undefined;

    if (node && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          onScreen = entries.some((entry) => entry.isIntersecting);
          sync();
        },
        { rootMargin: "96px" },
      );
      observer.observe(node);
    } else {
      // Nothing to observe with, so fall back to the reduced-motion gate alone.
      onScreen = true;
      sync();
    }

    reduced.addEventListener("change", sync);

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearInterval(cycleTimer);
      observer?.disconnect();
      reduced.removeEventListener("change", sync);
    };
  }, [quotes, interval]);

  const quote = quotes[index] ?? "";

  return (
    <div
      ref={frameRef}
      className="flex min-h-[3.25rem] w-full max-w-md items-center justify-center"
    >
      <p
        aria-hidden
        className={`text-center font-display text-lg font-light italic leading-snug text-glow-300/90 transition-all duration-500 sm:text-xl ${
          visible
            ? "translate-y-0 opacity-100 blur-0"
            : "translate-y-1 opacity-0 blur-[2px]"
        }`}
      >
        {quote ? `\u201C${quote}\u201D` : null}
      </p>
    </div>
  );
}
