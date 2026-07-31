import Link from "next/link";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { accentVars } from "@/lib/accent";
import type { Character } from "@/lib/content";
import { getMainArt, placeholderFor } from "@/lib/content";

type CharacterCardProps = {
  character: Character;
};

export function CharacterCard({ character }: CharacterCardProps) {
  const mainArt = getMainArt(character);
  const href = `/ref/${character.slug}`;
  // Tint the card with the character's accent (SFW preferred) so the
  // overview hints at each character's colour before their page is opened.
  const accent = (character.profiles.sfw ?? character.profiles.nsfw)?.accentColor;

  return (
    <Link
      href={href}
      style={accent ? (accentVars(accent) as React.CSSProperties) : undefined}
      className="group block overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm backdrop-blur-xl transition hover:border-glow-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      <div className="overflow-hidden rounded-[calc(1.5rem-1px)] shadow-inner-glow">
        {/* Square cover crop anchored to the top so portraits keep the head
            in frame and the wide ref-sheet fallback crops to its centre
            poses instead of letterboxing. */}
        <div className="relative aspect-square w-full overflow-hidden bg-void-lift/60">
          {mainArt ? (
            <ShimmerImage
              src={mainArt.src}
              alt={mainArt.alt}
              fill
              placeholder={placeholderFor(mainArt.src)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
              className="object-cover object-top transition duration-500 group-hover:scale-105"
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
          <h2 className="font-display text-lg font-medium tracking-tight text-parchment">
            {character.name}
          </h2>
          {character.species ? (
            <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
              {character.species}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
