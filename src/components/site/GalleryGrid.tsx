import Image from "next/image";
import Link from "next/link";

import { placeholderFor, type GalleryItem } from "@/lib/content";
import { NsfwReveal } from "@/components/ref/NsfwReveal";
import { ShimmerImage } from "@/components/ref/ShimmerImage";

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
  return (
    <ul className="flex w-full flex-wrap gap-4">
      {items.map(({ character, example, profile }) => {
        const href = `/ref/${character.slug}/${profile}/${example.slug}`;
        const thumb = (
          <>
            <Image
              src={example.src}
              alt=""
              aria-hidden
              fill
              loading="lazy"
              placeholder={placeholderFor(example.src)}
              sizes={THUMB_SIZES}
              className="scale-110 object-cover blur-2xl"
            />
            <ShimmerImage
              src={example.src}
              alt={example.title}
              fill
              loading="lazy"
              placeholder={placeholderFor(example.src)}
              sizes={THUMB_SIZES}
              className="relative z-10 object-contain"
            />
          </>
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
            {profile === "nsfw" ? (
              <div className={`${CARD_CLASS} focus-within:border-glow-500/40`}>
                <div className="relative aspect-square w-full overflow-hidden">
                  <NsfwReveal variant="thumb" href={href}>
                    {thumb}
                  </NsfwReveal>
                </div>
                <Link
                  href={href}
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500"
                >
                  {caption}
                </Link>
              </div>
            ) : (
              <Link
                href={href}
                className={`block ${CARD_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500`}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  {thumb}
                </div>
                {caption}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
