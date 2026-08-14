import type { AltSlide, Artist, ImageRef } from "@/lib/content";
import { AltCarousel } from "@/components/ref/AltCarousel";
import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { BackButton } from "@/components/ref/BackButton";
import { OpenImageLink } from "@/components/ref/OpenImageLink";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type RefImageProps = {
  src: ImageRef;
  alt: string;
  /** Rendered between the artwork and its actions — credits, chips, notes. */
  children?: React.ReactNode;
  /** When omitted, no header is rendered (page owns the heading). */
  title?: string;
  /** Optional note shown under the title */
  description?: string;
  /** Optional crediting info shown in a bar below the image */
  artist?: Artist;
  /** When false, omit the back button (page owns navigation). Defaults to true. */
  showBackButton?: boolean;
  /** Fallback for the back button when there is no history */
  backHref?: string;
  /** Show the diagonal WIP tape on the artwork. */
  isWip?: boolean;
  /** Alternate versions; when present the image becomes a carousel. */
  alts?: AltSlide[];
};

/** Full-view single image embed. */
export function RefImage({
  src,
  alt,
  children,
  title,
  description,
  artist,
  showBackButton = true,
  backHref = "/ref",
  isWip = false,
  alts = [],
}: RefImageProps) {
  const hasHeader = Boolean(title || description);

  return (
    <section className="w-full">
      {hasHeader ? (
        <header className="mb-8">
          <Badge variant={description ? "destructive" : "outline"}>
            {description ? "18+ artwork" : "Artwork file"}
          </Badge>
          {title ? (
            <h1 className="mt-4 max-w-5xl wrap-break-word font-display text-4xl font-bold leading-[0.9] tracking-[-0.06em] sm:text-6xl">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <Separator className="mt-6" />
        </header>
      ) : null}

      {alts.length > 0 ? (
        <>
          <AltCarousel alt={alt} main={{ src, artist, isWip }} alts={alts} />
          <div className="mt-6 flex flex-col items-center gap-3">
            {children}
            {showBackButton ? <BackButton fallbackHref={backHref} /> : null}
          </div>
        </>
      ) : (
        <>
          <ArtworkCard src={src} alt={alt} artist={artist} isWip={isWip} />

          <div className="mt-6 flex flex-col items-center gap-3">
            {children}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <OpenImageLink image={src} />
            </div>
            {showBackButton ? <BackButton fallbackHref={backHref} /> : null}
          </div>
        </>
      )}
    </section>
  );
}
