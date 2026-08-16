"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";

type ScrollReveal<T extends HTMLElement> = {
  /** Attach to the element whose entry into the viewport drives the reveal. */
  ref: RefObject<T | null>;
  /** Hold the element at its hidden state — it has not been revealed yet. */
  hidden: boolean;
  /** Play the reveal transition rather than snapping to the target. */
  animating: boolean;
};

/**
 * Scroll reveal that never hides server-rendered content.
 *
 * Motion serialises `initial` into the SSR HTML, and `useReducedMotion()` has
 * no answer on the server, so an `initial={{ opacity: 0 }}` reveal shipped
 * every section — reduced-motion visitors included — as invisible markup that
 * could not paint until hydration finished. Callers therefore pass
 * `initial={false}` and take their hidden state from here instead, which stays
 * `false` for the server render and the whole hydration pass.
 *
 * The reveal is then armed only for elements that were off screen when they
 * mounted: hiding something the visitor can already read, so it can fade back
 * in, is a flash rather than a reveal. In practice that means the first screen
 * paints as finished markup and everything below it still animates in on
 * scroll.
 */
export function useScrollReveal<T extends HTMLElement>(
  amount = 0.12,
  enabled = true,
): ScrollReveal<T> {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount });
  const reducedMotion = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const active = enabled && !reducedMotion;

  useEffect(() => {
    if (!active) return;
    const element = ref.current;
    if (!element) return;

    // Measured rather than read from `useInView`: an IntersectionObserver
    // reports back a frame later, and by then hiding an on-screen element is
    // a visible flicker.
    const { top, bottom, height } = element.getBoundingClientRect();
    const onScreen =
      Math.min(bottom, window.innerHeight) - Math.max(top, 0) >= height * amount;
    if (onScreen) return;

    setArmed(true);
  }, [active, amount]);

  return { ref, hidden: armed && !inView, animating: armed && inView };
}
