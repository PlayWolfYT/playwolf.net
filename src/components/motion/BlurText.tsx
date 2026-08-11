"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

/**
 * Source-owned adaptation of React Bits' BlurText. Words stay in the document
 * flow, while Motion handles the blur/fade stagger when the heading enters.
 */
export function BlurText({ text, className, delay = 0.08 }: BlurTextProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inView = useInView(headingRef, { once: true, amount: 0.45 });
  const reducedMotion = useReducedMotion();
  const words = text.split(/\s+/);

  return (
    <h1 ref={headingRef} className={className} aria-label={text}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden
          className="inline-block will-change-[transform,filter,opacity]"
          initial={reducedMotion ? false : { filter: "blur(12px)", opacity: 0, y: 18 }}
          animate={
            reducedMotion || inView
              ? { filter: "blur(0px)", opacity: 1, y: 0 }
              : { filter: "blur(12px)", opacity: 0, y: 18 }
          }
          transition={{
            delay: reducedMotion ? 0 : index * delay,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : null}
        </motion.span>
      ))}
    </h1>
  );
}
