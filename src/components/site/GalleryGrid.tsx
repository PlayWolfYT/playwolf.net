import Image from "next/image";
import Link from "next/link";

import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { VersionBadge } from "@/components/ref/VersionBadge";
import { WipTape } from "@/components/ref/WipTape";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exampleThumb, placeholderFor, type GalleryItem } from "@/lib/content";

const THUMB_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  // The first tile that actually has art is this page's LCP candidate — not
  // simply the first tile, which with `?wip=1` on is often a placeholder card
  // with no image at all, leaving the real one to load lazily.
  const lcpIndex = items.findIndex((item) => exampleThumb(item.example));

  return (
    <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map(({ character, example, profile }, index) => {
        const href = `/ref/${character.slug}/${profile}/${example.slug}`;
        const thumbSrc = exampleThumb(example);
        // Both layers share one `src`, so eager-loading the pair costs a single
        // request. Everything after it stays lazy, which is `next/image`'s
        // default — no `loading` prop needed.
        const priority = index === lcpIndex;

        return (
          <li key={`${character.slug}-${profile}-${example.slug}`}>
            <Link
              href={href}
              className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <Card className="h-full gap-0 py-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/45">
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {thumbSrc ? (
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
                        className="scale-110 object-cover blur-2xl opacity-65"
                      />
                      <ShimmerImage
                        src={thumbSrc}
                        alt={example.title}
                        fill
                        priority={priority}
                        placeholder={placeholderFor(thumbSrc)}
                        sizes={THUMB_SIZES}
                        className="relative z-10 object-contain transition duration-500 group-hover:scale-[1.035]"
                      />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-grid-soft bg-size-[28px_28px] px-3 text-center font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {example.isWip ? "Work in progress" : "Image pending"}
                    </div>
                  )}
                  {example.isWip ? <WipTape /> : null}
                  <VersionBadge example={example} />
                </div>

                <CardHeader className="border-t border-border pt-(--card-spacing)">
                  <CardTitle className="truncate">{example.title}</CardTitle>
                  <CardDescription className="truncate font-mono text-[0.55rem] uppercase tracking-[0.16em]">
                    {character.name}
                    {example.artist ? ` · ${example.artist.name}` : ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
