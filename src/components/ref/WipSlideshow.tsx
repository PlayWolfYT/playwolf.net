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
          <Badge variant="secondary">Process archive</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.055em]">
            {title}
          </h2>
        </div>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
          {slides.length} {slides.length === 1 ? "frame" : "frames"}
        </p>
      </header>

      <Carousel opts={{ loop: slides.length > 1 }}>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={`${slide.src.src}-${index}`}>
              <Card className="gap-0 py-0">
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
                  <CardFooter className="justify-center text-center text-sm text-muted-foreground">
                    {slide.caption}
                  </CardFooter>
                ) : null}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 ? (
          <div className="mt-5 flex gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        ) : null}
      </Carousel>
    </section>
  );
}
