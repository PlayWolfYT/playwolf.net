import Link from "next/link";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { accentVars } from "@/lib/accent";
import type { Character } from "@/lib/content";
import { getMainArt, placeholderFor } from "@/lib/content";

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
  const href = `/ref/${character.slug}`;
  // Tint the card with the character's accent (SFW preferred) so the
  // overview hints at each character's colour before their page is opened.
  const accent = (character.profiles.sfw ?? character.profiles.nsfw)?.accentColor;

  return (
    <SpotlightCard>
      <Link
        href={href}
        style={accent ? (accentVars(accent) as React.CSSProperties) : undefined}
        className="group block h-full overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm backdrop-blur-xl transition hover:border-glow-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
      >
        <div className="h-full overflow-hidden rounded-[calc(1.5rem-1px)] shadow-inner-glow">
          {/* Pre-cropped 1:1 frame; objectPosition is centered in toImageRef. */}
          <div className="relative aspect-square w-full overflow-hidden bg-void-lift/60">
            {mainArt ? (
              <ShimmerImage
                src={mainArt.src.src}
                alt={mainArt.alt}
                fill
                unoptimized={mainArt.src.unoptimized}
                placeholder={placeholderFor(mainArt.src)}
                blurDataURL={mainArt.src.blurDataURL}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                className="object-contain transition duration-500 group-hover:scale-105"
                style={{ objectPosition: mainArt.src.objectPosition }}
              />
            ) : (
              // No art yet — show the character's initial as a placeholder.
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-6xl font-medium text-parchment-dim/50">
                  {character.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="p-5">
            <Heading className="font-display text-lg font-medium tracking-tight text-parchment">
              {character.name}
            </Heading>
            {character.species ? (
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
                {character.species}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}
