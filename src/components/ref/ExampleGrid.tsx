import Image from "next/image";
import Link from "next/link";
import type { Example } from "@/lib/content";
import { exampleThumb, placeholderFor } from "@/lib/content";
import { BackButton } from "@/components/ref/BackButton";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { VersionBadge } from "@/components/ref/VersionBadge";
import { WipTape } from "@/components/ref/WipTape";

type ExampleGridProps = {
  examples: Example[];
  /** Route prefix for detail links, e.g. `/ref/playwuff/sfw` */
  basePath: string;
  /** When omitted, no header is rendered (page owns the heading). */
  title?: string;
  description?: string;
  /** When false, omit the back button (page owns navigation). Defaults to true. */
  showBackButton?: boolean;
  /** Fallback for the back button when there is no history */
  backHref?: string;
};

export function ExampleGrid({
  examples,
  basePath,
  title,
  description,
  showBackButton = true,
  backHref = "/ref",
}: ExampleGridProps) {
  const hasHeader = Boolean(title || description);

  return (
    <section className="w-full">
      {hasHeader ? (
        <header className="mb-8 text-center">
          {title ? (
            <h2 className="font-display text-xl font-semibold tracking-tight text-parchment sm:text-2xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchment-muted">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      {examples.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.1] bg-void-lift/40 px-8 py-16 text-center">
          <p className="font-display text-lg font-medium text-parchment">
            Nothing here yet
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-parchment-muted">
            Examples will appear here soon. Check back later!
          </p>
        </div>
      ) : (
        <ul className="flex w-full flex-wrap justify-center gap-4">
          {examples.map((example) => {
            const detailHref = `${basePath}/${example.slug}`;
            const thumbSrc = exampleThumb(example);
            const thumbSizes =
              "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 17vw";
            const thumb = thumbSrc ? (
              <>
                <Image
                  src={thumbSrc}
                  alt=""
                  aria-hidden
                  fill
                  loading="lazy"
                  placeholder={placeholderFor(thumbSrc)}
                  sizes={thumbSizes}
                  className="scale-110 object-cover blur-2xl"
                />
                <ShimmerImage
                  src={thumbSrc}
                  alt={example.title}
                  fill
                  loading="lazy"
                  placeholder={placeholderFor(thumbSrc)}
                  sizes={thumbSizes}
                  className="relative z-10 object-contain"
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-void-lift/80 px-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-parchment-dim">
                {example.isWip ? "WIP" : "No image"}
              </div>
            );

            const card =
              "overflow-hidden rounded-2xl border border-white/[0.07] bg-void-lift/60 shadow-glow-sm transition hover:border-glow-500/40";
            const caption = (
              <p className="truncate px-3 py-2.5 text-sm font-medium text-parchment">
                {example.title}
              </p>
            );

            return (
              <li
                key={example.slug}
                className="w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] 2xl:w-[calc((100%-5rem)/6)]"
              >
                {/* One link per card, not one per region: the thumbnail and the
                    caption go to the same place, and two adjacent links with the
                    same destination is noise for anyone using a screen reader. */}
                <Link
                  href={detailHref}
                  className={`group block ${card} focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500`}
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <div className="absolute inset-0 origin-center transition duration-500 group-hover:scale-105">
                      {thumb}
                      {example.isWip ||
                      (!example.src && example.wipImages.length > 0) ? (
                        <WipTape />
                      ) : null}
                    </div>
                    <VersionBadge example={example} />
                  </div>
                  {caption}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {showBackButton ? (
        <div className="mt-10 flex justify-center">
          <BackButton fallbackHref={backHref} />
        </div>
      ) : null}
    </section>
  );
}
