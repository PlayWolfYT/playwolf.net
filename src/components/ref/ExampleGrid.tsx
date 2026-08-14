import Image from "next/image";
import Link from "next/link";

import { BackButton } from "@/components/ref/BackButton";
import { ShimmerImage } from "@/components/ref/ShimmerImage";
import { VersionBadge } from "@/components/ref/VersionBadge";
import { WipTape } from "@/components/ref/WipTape";
import { EmptyState } from "@/components/site/EmptyState";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { exampleThumb, placeholderFor, type Example } from "@/lib/content";

type ExampleGridProps = {
  examples: Example[];
  basePath: string;
  title?: string;
  description?: string;
  showBackButton?: boolean;
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
        <header className="mb-8">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-primary">
            Image set
          </p>
          {title ? (
            <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.06em] sm:text-6xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <Separator className="mt-6" />
        </header>
      ) : null}

      {examples.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Examples will appear here as soon as they are ready."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {examples.map((example) => {
            const detailHref = `${basePath}/${example.slug}`;
            const thumbSrc = exampleThumb(example);
            const thumbSizes =
              "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";

            return (
              <li key={example.slug}>
                <Link
                  href={detailHref}
                  className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <Card className="h-full gap-0 py-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-glow-500/55">
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {thumbSrc ? (
                        <>
                          <Image
                            src={thumbSrc}
                            alt=""
                            aria-hidden
                            fill
                            loading="lazy"
                            placeholder={placeholderFor(thumbSrc)}
                            sizes={thumbSizes}
                            className="scale-110 object-cover blur-2xl opacity-65"
                          />
                          <ShimmerImage
                            src={thumbSrc}
                            alt={example.title}
                            fill
                            loading="lazy"
                            placeholder={placeholderFor(thumbSrc)}
                            sizes={thumbSizes}
                            className="relative z-10 object-contain transition duration-500 group-hover:scale-[1.035]"
                          />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-grid-soft bg-size-[28px_28px] px-3 text-center font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                          {example.isWip ? "Work in progress" : "Image pending"}
                        </div>
                      )}
                      {example.isWip ||
                      (!example.src && example.wipImages.length > 0) ? (
                        <WipTape />
                      ) : null}
                      <VersionBadge example={example} />
                    </div>
                    <CardHeader className="border-t border-border pt-(--card-spacing)">
                      <CardTitle className="truncate">{example.title}</CardTitle>
                    </CardHeader>
                  </Card>
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
