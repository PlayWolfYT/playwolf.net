import { notFound } from "next/navigation";

import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { ArtworkChips } from "@/components/ref/ArtworkChips";
import { Lightbox } from "@/components/ref/Lightbox";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { getCharacter, isProfileKey } from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string; slug: string }>;
};

/**
 * Intercepts `/ref/<character>/<profile>/<slug>` when it is reached from
 * anywhere under the character's layout — that is, from a gallery grid. The
 * standalone page one directory over still serves direct links and crawlers.
 */
export default async function ExampleModal({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = await getCharacter(characterSlug);
  const examples = character?.profiles[profileParam]?.examples ?? [];
  const index = examples.findIndex((candidate) => candidate.slug === slug);
  if (!character || index === -1) notFound();

  const example = examples[index];
  const basePath = `/ref/${character.slug}/${profileParam}`;
  const previous = examples[index - 1];
  const next = examples[index + 1];

  return (
    <Lightbox
      title={example.title}
      prevHref={previous ? `${basePath}/${previous.slug}` : undefined}
      nextHref={next ? `${basePath}/${next.slug}` : undefined}
      fallbackHref={profileParam === "sfw" ? `/ref/${character.slug}` : basePath}
      footer={
        <>
          <ArtworkChips example={example} />
          <OpenImageLink image={example.src} />
        </>
      }
    >
      <ArtworkCard
        src={example.src}
        alt={example.title}
        nsfw={profileParam === "nsfw"}
        artist={example.artist}
        fit="viewport"
      />
    </Lightbox>
  );
}
