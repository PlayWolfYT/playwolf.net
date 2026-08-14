import Image from "next/image";
import Link from "next/link";

import { exampleThumb, placeholderFor, type GalleryItem } from "@/lib/content";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { VersionBadge } from "@/components/ref/VersionBadge";
import { WipTape } from "@/components/ref/WipTape";

const THUMB_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 17vw";

const CARD_CLASS =
  "overflow-hidden rounded-2xl border border-white/[0.07] bg-void-lift/60 shadow-glow-sm transition hover:border-glow-500/40";

/**
 * The gallery mixes characters and ratings in one list, so unlike a profile
 * grid each card has to say whose it is and link into that character's own
 * section.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  // The first tile that actually has art is this page's LCP candidate — not
  // simply the first tile, which with `?wip=1` on is often a placeholder card
  // with no image at all, leaving the real one to load lazily.
  const lcpIndex = items.findIndex((item) => exampleThumb(item.example));

  return (
    <ul className="flex w-full flex-wrap gap-4">
      {items.map(({ character, example, profile }, index) => {
        const href = `/ref/${character.slug}/${profile}/${example.slug}`;
        const thumbSrc = exampleThumb(example);
        // Both layers share one `src`, so eager-loading the pair costs a single
        // request. Everything after it stays lazy, which is `next/image`'s
        // default — no `loading` prop needed.
        const priority = index === lcpIndex;
        const thumb = thumbSrc ? (
          <>
            <Image
              src={thumbSrc}
              alt=""
              aria-hidden
              fill
              priority={priority}
              // Same `src` as the layer below, so this renders the preload link
              // React keeps when it de-duplicates the pair. Without it that link
              // would be the one *without* a priority hint.
              fetchPriority={priority ? "high" : undefined}
              placeholder={placeholderFor(thumbSrc)}
              sizes={THUMB_SIZES}
              className="scale-110 object-cover blur-2xl"
            />
            <ShimmerImage
              src={thumbSrc}
              alt={example.title}
              fill
              priority={priority}
              placeholder={placeholderFor(thumbSrc)}
              sizes={THUMB_SIZES}
              className="relative z-10 object-contain"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-void-lift/80 px-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
            {example.isWip ? "WIP" : "No image"}
          </div>
        );

        const caption = (
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-parchment">
              {example.title}
            </p>
            <p className="mt-0.5 truncate font-mono text-[0.6rem] uppercase tracking-[0.2em] text-parchment-dim">
              {character.name}
              {example.artist ? ` · ${example.artist.name}` : ""}
            </p>
          </div>
        );

        return (
          <li
            key={`${character.slug}-${profile}-${example.slug}`}
            className="w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]"
          >
            <Link
              href={href}
              className={`group block ${CARD_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500`}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <div className="absolute inset-0 origin-center transition duration-500 group-hover:scale-105">
                  {thumb}
                  {example.isWip ? <WipTape /> : null}
                </div>
                <VersionBadge example={example} />
              </div>
              {caption}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
