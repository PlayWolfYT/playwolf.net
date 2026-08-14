import type { ReactNode } from "react";
import { SparkStar } from "@/components/BrandBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SplitTextReveal } from "@/components/motion/SplitTextReveal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * The heading treatment every non-landing page opens with — the same sparkle
 * row, title weight and lede width, so the pages read as one site.
 */
export function PageHeader({
  children,
  eyebrow,
  lede,
  title,
}: {
  children?: ReactNode;
  eyebrow?: string;
  lede?: string;
  title: string;
}) {
  return (
    <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,28rem)] lg:items-end">
      <div>
        {eyebrow ? (
          <Reveal distance={10}>
            <Badge variant="outline" className="border-primary/35 text-primary">
              <SparkStar className="animate-twinkle" />
              {eyebrow}
            </Badge>
          </Reveal>
        ) : null}

        <SplitTextReveal
          text={title}
          className="mt-5 max-w-5xl wrap-break-word font-display text-[clamp(3.5rem,11vw,8.5rem)] font-bold leading-[0.82] tracking-[-0.075em] text-foreground"
        />
      </div>

      <div className="flex flex-col items-start gap-5 lg:pb-2">
        {lede ? (
          <Reveal delay={0.16} distance={14}>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              {lede}
            </p>
          </Reveal>
        ) : null}
        {children}
      </div>

      <Separator className="lg:col-span-2" />
    </header>
  );
}
