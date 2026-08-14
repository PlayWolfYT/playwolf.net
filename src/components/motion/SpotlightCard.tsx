"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * React Bits-style pointer spotlight combined with Motion's spring hover.
 * The decorative layer ignores pointer events, so nested links remain intact.
 */
export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Measured once when the pointer arrives. `getBoundingClientRect()` on every
  // `pointermove` forced a synchronous layout per event, on a card that is
  // simultaneously being animated by the hover spring.
  const boundsRef = useRef<DOMRect | null>(null);
  const reducedMotion = useReducedMotion();
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);

  function enter() {
    boundsRef.current = cardRef.current?.getBoundingClientRect() ?? null;
    setSpotlightOpacity(1);
  }

  function leave() {
    boundsRef.current = null;
    setSpotlightOpacity(0);
  }

  function moveSpotlight(event: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    const bounds = boundsRef.current;
    if (!card || !bounds) return;
    card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative h-full rounded-3xl ${className}`}
      onPointerMove={moveSpotlight}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocusCapture={() => setSpotlightOpacity(0.8)}
      onBlurCapture={() => setSpotlightOpacity(0)}
      whileHover={reducedMotion ? undefined : { y: -7, scale: 1.012 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.7 }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: spotlightOpacity,
          background:
            "radial-gradient(340px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgb(var(--accent-300) / 0.16), transparent 62%)",
        }}
        aria-hidden
      />
      {children}
    </motion.div>
  );
}
