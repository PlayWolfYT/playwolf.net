"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ArtworkCard, frameFor } from "@/components/ref/ArtworkCard";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { useNsfwConsent } from "@/components/site/NsfwConsent";
import {
  placeholderFor,
  type AltSlide,
  type Artist,
  type ImageRef,
} from "@/lib/content";

type Slide = {
  image: ImageRef;
  /** Caption shown next to the counter; the main slide has none. */
  label?: string;
  artist?: Artist;
  isWip: boolean;
  /** Detail page of the slide when it is an independent artwork. */
  sourceHref?: string;
  sourceTitle?: string;
  /** 18+ counterpart on a SFW page — blurred until deliberately revealed. */
  gated: boolean;
};

type AltCarouselProps = {
  /** Alt-text base — the artwork title. */
  alt: string;
  /** The artwork's own image, always slide one. */
  main: { src: ImageRef; artist?: Artist; isWip?: boolean };
  alts: AltSlide[];
};

const CHEVRON_CLASS =
  "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-void/75 text-parchment-muted backdrop-blur transition hover:border-glow-500/50 hover:text-glow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500";

/**
 * The artwork plus its alternate versions as one swappable image. The main
 * image is always the first slide; inline alt images and linked counterpart
 * artworks follow. Owns the "Open full image" link so it can follow the
 * active slide's original upload.
 *
 * Cross-rating counterparts (`slide.profile === "nsfw"` on a SFW page) render
 * blurred — thumbnail and main image — until the visitor clicks the reveal
 * overlay. The click goes through `confirmNsfw`, so first-time visitors get
 * the site-wide 18+ dialog and returning ones (consent cookie set) just get
 * the deliberate click. The blur classes are part of the first render, so the
 * unblurred artwork never flashes.
 */
export function AltCarousel({ alt, main, alts }: AltCarouselProps) {
  const slides: Slide[] = [
    {
      image: main.src,
      artist: main.artist,
      isWip: Boolean(main.isWip),
      gated: false,
    },
    ...alts.map((slide) => ({
      image: slide.image,
      label: slide.label,
      // Inline alts share the main piece's credit; linked counterpart
      // artworks carry their own artist when present.
      artist: slide.artist ?? main.artist,
      isWip: false,
      sourceHref: slide.sourceHref,
      sourceTitle: slide.sourceTitle,
      gated: slide.profile === "nsfw",
    })),
  ];

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const { confirmNsfw } = useNsfwConsent();

  const current = slides[Math.min(index, slides.length - 1)];
  const count = slides.length;
  const currentBlurred = current.gated && !revealed.has(index);

  const reveal = async (slideIndex: number) => {
    if (!(await confirmNsfw())) return;
    setRevealed((previous) => new Set(previous).add(slideIndex));
  };

  return (
    <div className="w-full">
      <div className={`relative mx-auto w-full ${frameFor(current.image).className}`}>
        <ArtworkCard
          src={current.image}
          alt={current.label ? `${alt} — ${current.label}` : alt}
          artist={current.artist}
          isWip={current.isWip}
          imageClassName={currentBlurred ? "scale-110 blur-3xl" : undefined}
        />

        {currentBlurred ? (
          <button
            type="button"
            onClick={() => void reveal(index)}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl bg-void/40 px-6 text-center backdrop-blur-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-coral-soft"
          >
            <span className="inline-flex items-center rounded-full border border-coral-soft/50 bg-void/80 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-coral-soft">
              18+
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-parchment sm:text-xl">
              After Dark version
            </span>
            <span className="max-w-xs text-sm leading-relaxed text-parchment-muted">
              Click to reveal — 18+ content.
            </span>
          </button>
        ) : null}

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setIndex((value) => (value - 1 + count) % count)}
              aria-label="Previous version"
              className={`${CHEVRON_CLASS} left-3`}
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((value) => (value + 1) % count)}
              aria-label="Next version"
              className={`${CHEVRON_CLASS} right-3`}
            >
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        {/* While a gated slide is still blurred, its untouched original must
            not be one click away either — the link returns on reveal. */}
        {currentBlurred ? null : (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <OpenImageLink image={current.image} />
          </div>
        )}

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-parchment-muted">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-glow-400">
            {index + 1} / {count}
          </span>
          {current.label ? <span>{current.label}</span> : null}
          {current.sourceHref ? (
            <Link
              href={current.sourceHref}
              className="text-xs text-glow-400 underline-offset-4 transition hover:text-glow-300 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
            >
              View this version&rsquo;s page
              {current.gated ? <span className="sr-only"> (18+ content)</span> : null}
            </Link>
          ) : null}
        </p>

        {count > 1 ? (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            {slides.map((slide, slideIndex) => {
              const active = slideIndex === index;
              const blurred = slide.gated && !revealed.has(slideIndex);
              return (
                <button
                  key={slideIndex}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={`Show version ${slideIndex + 1} of ${count}${
                    slide.label ? ` — ${slide.label}` : ""
                  }${slide.gated ? " (18+)" : ""}`}
                  aria-current={active}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${
                    active
                      ? "border-glow-500/70 shadow-glow-sm"
                      : "border-white/10 opacity-70 hover:border-white/25 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    loading="lazy"
                    placeholder={placeholderFor(slide.image)}
                    sizes="80px"
                    className={`object-cover${blurred ? " scale-125 blur-xl" : ""}`}
                  />
                  {blurred ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 z-10 flex items-center justify-center bg-void/30"
                    >
                      <span className="rounded-full border border-coral-soft/50 bg-void/80 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.1em] text-coral-soft">
                        18+
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
