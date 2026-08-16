"use client";

import { motion } from "motion/react";

import { useScrollReveal } from "@/components/motion/useScrollReveal";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

const HIDDEN = { filter: "blur(12px)", opacity: 0, y: 18 };
const SHOWN = { filter: "blur(0px)", opacity: 1, y: 0 };
const INSTANT = { duration: 0 };

/**
 * Source-owned adaptation of React Bits' BlurText. Words stay in the document
 * flow, while Motion handles the blur/fade stagger when the heading enters.
 *
 * This is the landing page's `h1` and therefore its LCP element, so the
 * hidden state is never rendered on the server — see `useScrollReveal`.
 */
export function BlurText({ text, className, delay = 0.08 }: BlurTextProps) {
  const { ref, hidden, animating } = useScrollReveal<HTMLHeadingElement>(0.45);
  const words = text.split(/\s+/);

  return (
    <h1 ref={ref} className={className} aria-label={text}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden
          className="inline-block will-change-[transform,filter,opacity]"
          initial={false}
          animate={hidden ? HIDDEN : SHOWN}
          transition={
            animating
              ? { delay: index * delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }
              : INSTANT
          }
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : null}
        </motion.span>
      ))}
    </h1>
  );
}
