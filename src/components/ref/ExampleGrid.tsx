import Image from "next/image";
import Link from "next/link";
import type { Example } from "@/lib/references";
import { BackButton } from "@/components/ref/BackButton";
import { NsfwReveal } from "@/components/ref/NsfwReveal";
import { ShimmerImage } from "@/components/ref/ShimmerImage";

type ExampleGridProps = {
  examples: Example[];
  /** Route prefix for detail links, e.g. `/ref/playwuff/sfw` */
  basePath: string;
  /** Blur-gate every thumbnail (the grid belongs to an After Dark profile) */
  nsfw?: boolean;
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
  nsfw = false,
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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {examples.map((example) => {
            const detailHref = `${basePath}/${example.slug}`;
            const thumbSizes =
              "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 17vw";
            const thumb = (
              <>
                <Image
                  src={example.src}
                  alt=""
                  aria-hidden
                  fill
                  placeholder={example.src.blurDataURL ? "blur" : "empty"}
                  sizes={thumbSizes}
                  className="scale-110 object-cover blur-2xl"
                />
                <ShimmerImage
                  src={example.src}
                  alt={example.title}
                  fill
                  placeholder={example.src.blurDataURL ? "blur" : "empty"}
                  sizes={thumbSizes}
                  className="relative z-10 object-contain"
                />
              </>
            );

            return (
              <li key={example.slug}>
                <div className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-void-lift/60 shadow-glow-sm transition focus-within:border-glow-500/40 hover:border-glow-500/40">
                  <div className="relative aspect-square w-full overflow-hidden">
                    {nsfw ? (
                      <NsfwReveal variant="thumb" href={detailHref}>
                        {thumb}
                      </NsfwReveal>
                    ) : (
                      <Link
                        href={detailHref}
                        aria-label={example.title}
                        className="relative block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500"
                      >
                        {thumb}
                      </Link>
                    )}
                  </div>
                  <Link
                    href={detailHref}
                    className="block px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500"
                  >
                    <p className="truncate text-sm font-medium text-parchment">
                      {example.title}
                    </p>
                  </Link>
                </div>
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
