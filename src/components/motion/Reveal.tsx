"use client";

import { motion } from "motion/react";

import { useScrollReveal } from "@/components/motion/useScrollReveal";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

const SHOWN = { opacity: 1, y: 0 };
const INSTANT = { duration: 0 };

/** Reusable, one-shot viewport reveal for server-rendered page sections. */
export function Reveal({ children, className, delay = 0, distance = 24 }: RevealProps) {
  const { ref, hidden, animating } = useScrollReveal<HTMLDivElement>();

  return (
    <motion.div
      ref={ref}
      className={className}
      // `initial={false}` is deliberate: it keeps the hidden state out of the
      // server HTML so the section can paint before hydration. `hidden` takes
      // over once the reveal is armed — see `useScrollReveal`.
      initial={false}
      animate={hidden ? { opacity: 0, y: distance } : SHOWN}
      transition={
        animating ? { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] } : INSTANT
      }
    >
      {children}
    </motion.div>
  );
}
