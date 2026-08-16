"use client";

import { Fragment } from "react";
import { motion } from "motion/react";

import { useScrollReveal } from "@/components/motion/useScrollReveal";

type SplitTextRevealProps = {
  text: string;
  className?: string;
};

const HIDDEN = { opacity: 0, y: "110%" };
const SHOWN = { opacity: 1, y: "0%" };
const INSTANT = { duration: 0 };

/**
 * Page-title reveal: each word rises out of its own clipping mask, staggered
 * left to right.
 *
 * The split is done in the markup instead of by measuring rendered lines, so
 * the heading is ordinary selectable text that needs no runtime rebuild when
 * the font loads or the viewport changes — and no `initial` state reaches the
 * server HTML, so the title paints before hydration (`useScrollReveal`).
 */
export function SplitTextReveal({ text, className }: SplitTextRevealProps) {
  const { ref, hidden, animating } = useScrollReveal<HTMLHeadingElement>(0.4);
  const words = text.split(/\s+/);

  return (
    <h1 ref={ref} className={className}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          {/* The mask is what makes a word look like it rises out of the line.
              Vertical padding keeps descenders from being clipped at rest and
              the matching negative margin gives the height back, so the
              heading occupies exactly the space plain text would. */}
          <span className="-my-[0.15em] inline-block overflow-hidden py-[0.15em] align-bottom">
            <motion.span
              className="inline-block will-change-[transform,opacity]"
              initial={false}
              animate={hidden ? HIDDEN : SHOWN}
              transition={
                animating
                  ? { delay: index * 0.045, duration: 0.85, ease: [0.16, 1, 0.3, 1] }
                  : INSTANT
              }
            >
              {word}
            </motion.span>
          </span>
          {/* A real space between the masks, so long titles still wrap. */}
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </h1>
  );
}
