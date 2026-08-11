import type { Artist, ImageRef } from "@/lib/content";
import { ArtworkCard } from "@/components/ref/ArtworkCard";
import { BackButton } from "@/components/ref/BackButton";
import { OpenImageLink } from "@/components/ref/OpenImageLink";

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
}: RefImageProps) {
  const hasHeader = Boolean(title || description);

  return (
    <section className="w-full">
      {hasHeader ? (
        <header className="mb-6 text-center">
          {title ? (
            <h1 className="font-display text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-parchment-muted">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      <ArtworkCard src={src} alt={alt} artist={artist} isWip={isWip} />

      <div className="mt-6 flex flex-col items-center gap-3">
        {children}
        <OpenImageLink image={src} />
        {showBackButton ? <BackButton fallbackHref={backHref} /> : null}
      </div>
    </section>
  );
}
