import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { profileThemeVars } from "@/lib/accent";
import { getMainArt, placeholderFor, type Character } from "@/lib/content";

type CharacterCardProps = {
  character: Character;
  /**
   * Heading rank for the character's name. Defaults to 2, which is right on
   * `/ref` where the cards sit directly under the page `h1`; the landing page
   * nests them under a section `h2` and passes 3.
   */
  headingLevel?: 2 | 3 | 4;
};

export function CharacterCard({ character, headingLevel = 2 }: CharacterCardProps) {
  const mainArt = getMainArt(character);
  const Heading = `h${headingLevel}` as const;
  const accent = (character.profiles.sfw ?? character.profiles.nsfw)?.accentColor;

  return (
    <SpotlightCard
      style={accent ? (profileThemeVars(accent) as React.CSSProperties) : undefined}
    >
      <Link
        href={`/ref/${character.slug}`}
        className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Card className="h-full gap-0 border-glow-500/25 py-0 shadow-[0_18px_55px_-38px_rgb(var(--accent-500)/0.9)] transition duration-300 group-hover:-translate-y-1 group-hover:border-glow-500/60 group-hover:shadow-[0_24px_70px_-36px_rgb(var(--accent-500)/0.95)]">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <div className="absolute inset-0 bg-rim-cyan opacity-60" />
            <div
              className="pointer-events-none absolute -right-12 -top-12 z-10 size-36 rounded-full bg-glow-500/20 blur-3xl animate-slow-pulse sm:size-44"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-8 bottom-0 z-10 h-px bg-linear-to-r from-transparent via-glow-400/80 to-transparent shadow-[0_0_18px_rgb(var(--accent-500)/0.75)]"
              aria-hidden
            />
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

          <CardHeader className="border-t border-glow-500/25 bg-glow-500/[0.07] py-(--card-spacing)">
            <CardTitle>
              <Heading className="font-display text-2xl font-bold tracking-[-0.055em] text-glow-300 drop-shadow-[0_0_18px_rgb(var(--accent-500)/0.28)]">
                {character.name}
              </Heading>
            </CardTitle>
          </CardHeader>

          <CardFooter className="mt-auto justify-between gap-3 bg-glow-500/[0.04]">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-glow-400/75">
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
