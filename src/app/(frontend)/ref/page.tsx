import type { Metadata } from "next";
import { PawPrintIcon } from "lucide-react";
import { CharacterCard } from "@/components/ref/CharacterCard";
import { PageHeader } from "@/components/site/PageHeader";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCharacters } from "@/lib/references";

export const metadata: Metadata = {
  title: "References",
  description: "Character reference sheets and art examples.",
  alternates: { canonical: "/ref" },
};

export default async function RefHome() {
  const characters = await getCharacters();

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Characters"
        title="References"
        lede="Reference sheets, palettes, details, and artwork for every character."
      />

      {characters.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <li key={character.slug}>
              <CharacterCard character={character} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-10 min-h-80 border bg-card/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PawPrintIcon />
            </EmptyMedia>
            <EmptyTitle>No characters yet</EmptyTitle>
            <EmptyDescription>
              The first profile will appear here once it is ready.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
