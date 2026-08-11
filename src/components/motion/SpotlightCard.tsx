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
  const reducedMotion = useReducedMotion();
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);

  function moveSpotlight(event: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative h-full rounded-3xl ${className}`}
      onPointerMove={moveSpotlight}
      onPointerEnter={() => setSpotlightOpacity(1)}
      onPointerLeave={() => setSpotlightOpacity(0)}
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
