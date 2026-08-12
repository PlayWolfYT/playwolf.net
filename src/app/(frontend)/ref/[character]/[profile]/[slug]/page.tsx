import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtworkChips } from "@/components/ref/ArtworkChips";
import { BackButton } from "@/components/ref/BackButton";
import { CommissionStatus } from "@/components/ref/CommissionStatus";
import { ExampleNav } from "@/components/ref/ExampleNav";
import { FeaturedFriends } from "@/components/ref/FeaturedFriends";
import { RefImage } from "@/components/ref/RefImage";
import { SheetPlaceholder } from "@/components/ref/SheetPlaceholder";
import { WipSlideshow } from "@/components/ref/WipSlideshow";
import { buildImageMetadata } from "@/lib/embed";
import { exampleThumb } from "@/lib/content";
import { getAdminUser } from "@/lib/admin/auth";
import {
  getArtworkAdminMeta,
  getCharacter,
  getExample,
  isProfileKey,
} from "@/lib/references";

type PageProps = {
  params: Promise<{ character: string; profile: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) return {};

  const [character, example] = await Promise.all([
    getCharacter(characterSlug),
    getExample(characterSlug, profileParam, slug),
  ]);
  if (!character || !example) return {};

  const image = exampleThumb(example);
  if (!image) {
    return {
      title: `${example.title} · ${character.name}`,
      description: profileParam === "nsfw" ? "18+ content." : undefined,
    };
  }

  return buildImageMetadata({
    title: `${example.title} · ${character.name}`,
    image,
    alt: example.title,
    description: profileParam === "nsfw" ? "18+ content." : undefined,
    pagePath: `/ref/${character.slug}/${profileParam}/${example.slug}`,
  });
}

export default async function ExamplePage({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) notFound();

  const character = await getCharacter(characterSlug);
  const examples = character?.profiles[profileParam]?.examples ?? [];
  const index = examples.findIndex((candidate) => candidate.slug === slug);
  if (!character || index === -1) notFound();

  const example = examples[index];
  const isNsfw = profileParam === "nsfw";
  const backHref =
    profileParam === "sfw"
      ? `/ref/${character.slug}`
      : `/ref/${character.slug}/${profileParam}`;

  const adminUser = await getAdminUser();
  const commission = adminUser
    ? await getArtworkAdminMeta(characterSlug, profileParam, slug)
    : undefined;

  const finalImage = example.src;
  const showGenerated =
    example.isWip &&
    example.overviewDisplay === "generated" &&
    !finalImage &&
    example.wipPlaceholder;
  const heroImage = finalImage ?? exampleThumb(example);
  const showWipSlideshow =
    example.wipImages.length > 0 && (example.isWip || example.showWipHistory);

  return (
    <>
      {finalImage ? (
        <RefImage
          src={finalImage}
          alt={example.title}
          title={example.title}
          description={isNsfw ? "18+ content." : undefined}
          artist={example.artist}
          backHref={backHref}
          isWip={example.isWip}
          alts={example.alts}
        >
          <ArtworkChips example={example} />
        </RefImage>
      ) : showGenerated && example.wipPlaceholder ? (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <SheetPlaceholder
            sheet={{
              kind: "wip",
              title: example.title,
              artist: example.artist,
              wip: example.wipPlaceholder,
            }}
          />
          <div className="mt-6 flex flex-col items-center gap-3">
            <ArtworkChips example={example} />
            <BackButton fallbackHref={backHref} />
          </div>
        </section>
      ) : heroImage ? (
        <RefImage
          src={heroImage}
          alt={example.title}
          title={example.title}
          description={isNsfw ? "18+ content." : undefined}
          artist={example.artist}
          backHref={backHref}
          isWip={example.isWip}
          alts={example.alts}
        >
          <ArtworkChips example={example} />
        </RefImage>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-parchment-dim">
            {example.isWip ? "In progress" : "Artwork"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-parchment">
            {example.title}
          </h1>
          <div className="mt-6 flex flex-col items-center gap-3">
            <ArtworkChips example={example} />
            <BackButton fallbackHref={backHref} />
          </div>
        </section>
      )}

      {commission ? <CommissionStatus commission={commission} /> : null}

      {showWipSlideshow ? <WipSlideshow slides={example.wipImages} /> : null}

      <FeaturedFriends example={example} />

      <ExampleNav
        basePath={`/ref/${character.slug}/${profileParam}`}
        previous={examples[index - 1]}
        next={examples[index + 1]}
        position={index + 1}
        total={examples.length}
      />
    </>
  );
}
