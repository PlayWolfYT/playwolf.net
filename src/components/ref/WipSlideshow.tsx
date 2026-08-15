"use client";

import Image from "next/image";

import { WipTape } from "@/components/ref/WipTape";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { placeholderFor, type ImageRef } from "@/lib/content";

type Slide = {
  src: ImageRef;
  caption?: string;
};

export function WipSlideshow({
  slides,
  title = "WIP sketches",
}: {
  slides: Slide[];
  title?: string;
}) {
  if (slides.length === 0) return null;

  return (
    <section className="mx-auto mt-14 w-full max-w-5xl px-4">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge
            variant="outline"
            className="border-glow-500/35 bg-glow-500/10 text-glow-300"
          >
            Work in progress
          </Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.055em]">
            {title}
          </h2>
        </div>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
          {slides.length} {slides.length === 1 ? "frame" : "frames"}
        </p>
      </header>

      {/* shadcn marks this `role="region" aria-roledescription="carousel"` but
          leaves it unnamed, which reads as a bare "carousel" landmark. */}
      <Carousel aria-label={title} opts={{ loop: slides.length > 1 }}>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={`${slide.src.src}-${index}`}>
              <Card className="gap-0 border-glow-500/25 bg-glow-500/[0.05] py-0 shadow-[0_24px_70px_-48px_rgb(var(--accent-500)/0.9)]">
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                  <WipTape />
                  <Image
                    src={slide.src}
                    alt={slide.caption || `WIP sketch ${index + 1}`}
                    fill
                    placeholder={placeholderFor(slide.src)}
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 1024px"
                  />
                </div>
                {slide.caption ? (
                  <CardFooter className="border-t border-glow-500/20 bg-glow-500/[0.06] justify-center text-center text-sm text-foreground/75">
                    {slide.caption}
                  </CardFooter>
                ) : null}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* The stock "Previous slide" / "Next slide" repeat the artwork page's
            other controls verbatim, so the name says what actually moves. */}
        {slides.length > 1 ? (
          <div className="mt-5 flex gap-2">
            <CarouselPrevious
              aria-label="Previous sketch"
              className="static translate-x-0 translate-y-0 border-glow-500/30 bg-glow-500/8 text-glow-300 hover:border-glow-400/60 hover:bg-glow-500/15 hover:text-glow-300"
            />
            <CarouselNext
              aria-label="Next sketch"
              className="static translate-x-0 translate-y-0 border-glow-500/30 bg-glow-500/8 text-glow-300 hover:border-glow-400/60 hover:bg-glow-500/15 hover:text-glow-300"
            />
          </div>
        ) : null}
      </Carousel>
    </section>
  );
}
