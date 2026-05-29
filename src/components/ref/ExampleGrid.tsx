import Image from "next/image";
import Link from "next/link";
import type { Example } from "@/lib/references";
import { BackButton } from "@/components/ref/BackButton";
import { NsfwReveal } from "@/components/ref/NsfwReveal";

type ExampleGridProps = {
  examples: Example[];
  /** Route prefix for detail links, e.g. `/ref/examples` or `/ref/examples/nsfw` */
  basePath: string;
  title: string;
  description?: string;
};

export function ExampleGrid({
  examples,
  basePath,
  title,
  description,
}: ExampleGridProps) {
  return (
    <section className="w-full">
      <header className="mb-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchment-muted">
            {description}
          </p>
        ) : null}
      </header>

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
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {examples.map((example) => {
            const detailHref = `${basePath}/${example.slug}`;
            const thumb = (
              <Image
                src={example.src}
                alt={example.title}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            );

            return (
              <li key={example.slug}>
                <div className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-void-lift/60 shadow-glow-sm transition focus-within:border-glow-500/40 hover:border-glow-500/40">
                  <div className="relative aspect-square w-full overflow-hidden">
                    {example.nsfw ? (
                      <NsfwReveal variant="thumb" href={detailHref}>
                        {thumb}
                      </NsfwReveal>
                    ) : (
                      <Link
                        href={detailHref}
                        aria-label={example.title}
                        className="block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500"
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

      <div className="mt-10 flex justify-center">
        <BackButton />
      </div>
    </section>
  );
}
