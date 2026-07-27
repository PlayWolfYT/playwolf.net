"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * `next/image` that keeps the skeleton's shimmer sweep over the frame until
 * the file has actually finished downloading, then fades it out. Layered on
 * top of the blur placeholder, so slow connections see the blurred preview
 * plus the animated glow instead of an empty frame.
 *
 * The overlay is absolutely positioned, so callers must provide a positioned
 * (`relative`) ancestor that matches the image bounds.
 */
export function ShimmerImage({ alt, onLoad, ...props }: ImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // `onLoad` never fires for images that finished before hydration (e.g.
  // served from cache), so reconcile with the DOM once mounted.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <>
      <Image
        {...props}
        alt={alt}
        ref={ref}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="absolute inset-0 animate-shimmer bg-shimmer" />
      </span>
    </>
  );
}
