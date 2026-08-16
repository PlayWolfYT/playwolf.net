"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { placeholderFor, type ImageRef } from "@/lib/content";

type ArtworkStageSwapProps = {
  src: ImageRef;
  alt: string;
  /** Kept so the carousel can pass travel direction; the dissolve ignores it. */
  direction: 1 | -1;
  sizes: string;
  imageClassName?: string;
  priority?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const dissolve = {
  enter: {
    opacity: 0,
    scale: 1.04,
    filter: "blur(18px) brightness(1.25)",
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
  },
  leave: {
    opacity: 0,
    scale: 1,
    filter: "blur(14px) brightness(0.75)",
  },
};

const fade = {
  enter: { opacity: 0 },
  show: { opacity: 1 },
  leave: { opacity: 0 },
};

/**
 * Dissolves one piece into the next inside a locked stage — no slide, no
 * wipe. Used for alt versions and WIP history. The outgoing piece blurs
 * out while the incoming one sharpens in, with a short glow pulse.
 */
export function ArtworkStageSwap({
  src,
  alt,
  sizes,
  imageClassName,
  priority = false,
}: ArtworkStageSwapProps) {
  const reduced = useReducedMotion();
  const variants = reduced ? fade : dissolve;

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={src.src}
          className="absolute inset-0"
          variants={variants}
          initial="enter"
          animate="show"
          exit="leave"
          transition={{ duration: reduced ? 0.2 : 0.5, ease: EASE }}
        >
          <ShimmerImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            placeholder={placeholderFor(src)}
            sizes={sizes}
            className={`object-contain${imageClassName ? ` ${imageClassName}` : ""}`}
          />
        </motion.div>
      </AnimatePresence>

      {reduced ? null : (
        <motion.div
          key={`pulse-${src.src}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-1 bg-glow-300/25 mix-blend-screen"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        />
      )}
    </>
  );
}
