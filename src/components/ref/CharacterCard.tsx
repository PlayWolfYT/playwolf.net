import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { accentVars } from "@/lib/accent";
import { getMainArt, placeholderFor, type Character } from "@/lib/content";

export function CharacterCard({ character }: { character: Character }) {
  const mainArt = getMainArt(character);
  const accent = (character.profiles.sfw ?? character.profiles.nsfw)?.accentColor;

  return (
    <SpotlightCard>
      <Link
        href={`/ref/${character.slug}`}
        style={accent ? (accentVars(accent) as React.CSSProperties) : undefined}
        className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Card className="h-full gap-0 py-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-glow-500/55">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-rim-cyan opacity-60" />
            {mainArt ? (
              <ShimmerImage
                src={mainArt.src.src}
                alt={mainArt.alt}
                fill
                unoptimized={mainArt.src.unoptimized}
                placeholder={placeholderFor(mainArt.src)}
                blurDataURL={mainArt.src.blurDataURL}
                sizes="(max-width: 640px) 86vw, (max-width: 1024px) 50vw, 380px"
                className="object-contain transition duration-500 group-hover:scale-[1.035]"
                style={{ objectPosition: mainArt.src.objectPosition }}
              />
            ) : (
              <div className="relative flex h-full items-center justify-center">
                <span className="brand-outline font-display text-8xl font-bold">
                  {character.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <CardHeader className="border-t border-border py-(--card-spacing)">
            <CardTitle>
              <h2 className="font-display text-2xl font-bold tracking-[-0.055em]">
                {character.name}
              </h2>
            </CardTitle>
          </CardHeader>

          <CardFooter className="mt-auto justify-between gap-3">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
              {character.species}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-glow-400">
              View character
              <ArrowUpRightIcon aria-hidden />
            </span>
          </CardFooter>
        </Card>
      </Link>
    </SpotlightCard>
  );
}
