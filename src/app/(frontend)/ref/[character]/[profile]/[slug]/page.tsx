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
import { absoluteUrl, JsonLd, type JsonLdNode } from "@/components/site/JsonLd";
import { buildImageMetadata } from "@/lib/embed";
import {
  exampleThumb,
  type Character,
  type Example,
  type ProfileKey,
} from "@/lib/content";
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

  const title = `${example.title} · ${character.name}`;
  const description = profileParam === "nsfw" ? "18+ content." : undefined;
  const pagePath = `/ref/${character.slug}/${profileParam}/${example.slug}`;

  // A commission with no art delivered yet still gets a canonical, so the URL
  // already shared with the artist accrues to this page.
  const image = exampleThumb(example);
  if (!image) return { title, description, alternates: { canonical: pagePath } };

  return buildImageMetadata({
    title,
    image,
    alt: example.title,
    description,
    pagePath,
  });
}

/**
 * Google Images is a wanted traffic source for this section, so the rating is
 * declared rather than the graph withheld — `contentRating` is the field for
 * saying "adult" without saying "do not index".
 */
function artworkGraph(
  character: Character,
  profile: ProfileKey,
  example: Example,
): JsonLdNode {
  const image = example.src ?? exampleThumb(example);
  // `featuring` already leads with the character the artwork belongs to.
  const cast =
    example.featuring.length > 0
      ? example.featuring.map((member) => member.name)
      : [character.name];

  return {
    "@type": "VisualArtwork",
    name: example.title,
    url: absoluteUrl(`/ref/${character.slug}/${profile}/${example.slug}`),
    image: image ? absoluteUrl(image.src) : undefined,
    dateModified: example.updatedAt,
    // Only meaningful in the affirmative: schema.org has no "everyone" value
    // that a search engine acts on.
    contentRating: profile === "nsfw" ? "adult" : undefined,
    creator: example.artist
      ? {
          "@type": "Person",
          name: example.artist.name,
          sameAs: example.artist.links.map((link) => link.url),
        }
      : undefined,
    copyrightHolder: { "@type": "Person", name: "playwolf" },
    about: cast.map((name) => ({ "@type": "Thing", name })),
    keywords:
      example.tags.length > 0 ? example.tags.map((tag) => tag.label) : undefined,
    creativeWorkStatus: example.isWip ? "In progress" : undefined,
  };
}

export default async function ExamplePage({ params }: PageProps) {
  const { character: characterSlug, profile: profileParam, slug } = await params;
  if (!isProfileKey(profileParam)) notFound();

  // The session lookup does not depend on the character, so it rides along
  // rather than waiting for it.
  const [character, adminUser] = await Promise.all([
    getCharacter(characterSlug),
    getAdminUser(),
  ]);
  const examples = character?.profiles[profileParam]?.examples ?? [];
  const index = examples.findIndex((candidate) => candidate.slug === slug);
  if (!character || index === -1) notFound();

  const example = examples[index];
  const isNsfw = profileParam === "nsfw";
  const backHref =
    profileParam === "sfw"
      ? `/ref/${character.slug}`
      : `/ref/${character.slug}/${profileParam}`;

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
      <JsonLd nodes={artworkGraph(character, profileParam, example)} />

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
        <section className="mx-auto max-w-3xl px-4 py-10">
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
