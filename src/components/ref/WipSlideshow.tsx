"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { containedFrameStyle } from "@/components/ref/ArtworkCard";
import { ArtworkStageSwap } from "@/components/ref/ArtworkStageSwap";
import { WipTape } from "@/components/ref/WipTape";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import type { ImageRef } from "@/lib/content";

type Slide = {
  src: ImageRef;
  caption?: string;
};

/** Sketches sit below the main piece, so they get a tighter height cap. */
const WIP_MAX_HEIGHT_SVH = 50;

const NAV_CLASS =
  "border-glow-500/30 bg-glow-500/8 text-glow-300 hover:border-glow-400/60 hover:bg-glow-500/15 hover:text-glow-300 active:not-aria-[haspopup]:translate-y-0";

export function WipSlideshow({
  slides,
  title = "WIP sketches",
}: {
  slides: Slide[];
  title?: string;
}) {
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const stage = slides[0].src;
  const current = slides[Math.min(index, slides.length - 1)];
  const count = slides.length;

  const goTo = (next: number) => {
    setIndex(((next % count) + count) % count);
  };

  return (
    <section className="mx-auto mt-14 w-full max-w-3xl">
      <header className="mb-5 flex flex-col items-center gap-3 text-center">
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
        <p
          role="status"
          className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="sr-only">Sketch </span>
          {index + 1} / {count}
        </p>
      </header>

      <Card
        className="mx-auto max-w-full gap-0 border-glow-500/25 bg-glow-500/[0.05] py-0 shadow-[0_24px_70px_-48px_rgb(var(--accent-500)/0.9)]"
        style={containedFrameStyle(stage, WIP_MAX_HEIGHT_SVH)}
      >
        <div
          className="relative overflow-hidden bg-void"
          style={{ aspectRatio: `${stage.width} / ${stage.height}` }}
        >
          <WipTape />
          <ArtworkStageSwap
            src={current.src}
            alt={current.caption || `WIP sketch ${index + 1}`}
            direction={1}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
        {current.caption ? (
          <CardFooter className="border-t border-glow-500/20 bg-glow-500/[0.06] justify-center text-center text-sm text-foreground/75">
            {current.caption}
          </CardFooter>
        ) : null}
      </Card>

      {count > 1 ? (
        <div className="mt-5 flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goTo(index - 1)}
            aria-label="Previous sketch"
            className={NAV_CLASS}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goTo(index + 1)}
            aria-label="Next sketch"
            className={NAV_CLASS}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
