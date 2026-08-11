"use client";

import Image from "next/image";
import { useState } from "react";

import { WipTape } from "@/components/ref/WipTape";
import { placeholderFor, type ImageRef } from "@/lib/content";

type Slide = {
  src: ImageRef;
  caption?: string;
};

/** Simple client slideshow for WIP sketches on an artwork detail page. */
export function WipSlideshow({
  slides,
  title = "WIP sketches",
}: {
  slides: Slide[];
  title?: string;
}) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;

  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="mx-auto mt-12 w-full max-w-4xl px-4">
      <header className="mb-4 text-center">
        <h2 className="font-display text-lg font-medium text-parchment">{title}</h2>
        <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
          {index + 1} / {slides.length}
        </p>
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-void-lift/50">
        <WipTape />
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={current.src}
            alt={current.caption || `WIP sketch ${index + 1}`}
            fill
            placeholder={placeholderFor(current.src)}
            className="object-contain"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
        {current.caption ? (
          <p className="border-t border-white/[0.06] px-4 py-3 text-center text-sm text-parchment-muted">
            {current.caption}
          </p>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              setIndex((value) => (value - 1 + slides.length) % slides.length)
            }
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-parchment-muted transition hover:border-glow-500/40 hover:text-glow-300"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setIndex((value) => (value + 1) % slides.length)}
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-parchment-muted transition hover:border-glow-500/40 hover:text-glow-300"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
