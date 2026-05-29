import Image from "next/image";
import type { Artist } from "@/lib/references";
import { getImageDimensions } from "@/lib/embed";
import { ArtistBar } from "@/components/ref/ArtistBar";
import { BackButton } from "@/components/ref/BackButton";
import { NsfwReveal } from "@/components/ref/NsfwReveal";

type RefImageProps = {
  src: string;
  alt: string;
  title: string;
  nsfw?: boolean;
  /** Optional note shown under the title */
  description?: string;
  /** Optional crediting info shown in a bar below the image */
  artist?: Artist;
};

/**
 * Full-view single image embed. Renders the real `src` regardless of the NSFW
 * flag (the blur is a CSS-only overlay), so direct links and crawlers always
 * receive the unblurred asset.
 */
export async function RefImage({
  src,
  alt,
  title,
  nsfw = false,
  description,
  artist,
}: RefImageProps) {
  const dimensions = await getImageDimensions(src);
  const width = dimensions?.width ?? 1200;
  const height = dimensions?.height ?? 1500;

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      sizes="(max-width: 768px) 100vw, 768px"
      className="h-auto w-full"
    />
  );

  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchment-muted">
            {description}
          </p>
        ) : null}
      </header>

      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm">
        <div className="overflow-hidden rounded-[calc(1.5rem-1px)]">
          {nsfw ? <NsfwReveal>{image}</NsfwReveal> : image}
        </div>
      </div>

      {artist ? (
        <div className="mt-4">
          <ArtistBar artist={artist} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-3">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:border-glow-500/60 hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
        >
          Open full image
        </a>
        <BackButton />
      </div>
    </section>
  );
}
