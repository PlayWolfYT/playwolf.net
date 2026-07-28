import type { Metadata } from "next";
import { SparkStar } from "@/components/BrandBackdrop";
import { CharacterCard } from "@/components/ref/CharacterCard";
import { getCharacters } from "@/lib/references";

export const metadata: Metadata = {
  title: "References · playwolf.net",
  description: "Character reference sheets and art examples.",
};

export default function RefHome() {
  const characters = getCharacters();

  return (
    <div className="w-full">
      <div className="mb-10 flex justify-center gap-4 text-glow-500/40">
        <SparkStar className="h-4 w-4 animate-twinkle" />
        <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
        <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
      </div>

      <h1 className="text-center font-display text-3xl font-light tracking-tight text-parchment sm:text-4xl">
        References
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-parchment-muted">
        Pick a character to view reference sheets and art examples.
      </p>

      {/* Flex-wrap instead of grid so odd rows (e.g. a single character) stay
          centred; widths mirror the previous 1/2/3-column grid tracks. */}
      <div className="mx-auto mt-12 flex w-full max-w-5xl flex-wrap justify-center gap-6">
        {characters.map((character) => (
          <div
            key={character.slug}
            className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc((100%-3rem)/3)]"
          >
            <CharacterCard character={character} />
          </div>
        ))}
      </div>
    </div>
  );
}
