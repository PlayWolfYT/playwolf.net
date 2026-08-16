"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";

/**
 * `ssr: false` costs nothing here — the canvas is created by an effect, so the
 * server only ever emitted an empty decorative `div` — and it keeps `ogl` plus
 * the shader out of the initial JavaScript payload for a background nobody
 * interacts with.
 */
const AuroraCanvas = dynamic(
  () =>
    import("@/components/motion/AuroraCanvas").then((module) => module.AuroraCanvas),
  { ssr: false },
);

/**
 * Adapted from React Bits' Aurora background. Pauses entirely for visitors who
 * ask for reduced motion, which is a decision only the client can make: on the
 * server `useReducedMotion()` has no preference to read.
 */
export function Aurora() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return <AuroraCanvas />;
}
