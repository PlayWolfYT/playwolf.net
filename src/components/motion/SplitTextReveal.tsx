"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, SplitText);

type SplitTextRevealProps = {
  text: string;
  className?: string;
};

/**
 * Responsive GSAP line reveal for page titles. SplitText supplies automatic
 * screen-reader labels and safely rebuilds line wrappers after font/size changes.
 */
export function SplitTextReveal({ text, className }: SplitTextRevealProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const heading = headingRef.current;
      if (!heading) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(heading, { clearProps: "all" });
        return;
      }

      const split = SplitText.create(heading, {
        type: "lines,words",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.words, {
            autoAlpha: 0,
            yPercent: 115,
            rotateX: -25,
            transformOrigin: "50% 100%",
            duration: 0.85,
            stagger: 0.045,
            ease: "power4.out",
          });
        },
      });

      return () => split.revert();
    },
    { scope: headingRef, dependencies: [text] },
  );

  return (
    <h1 ref={headingRef} className={className}>
      {text}
    </h1>
  );
}
