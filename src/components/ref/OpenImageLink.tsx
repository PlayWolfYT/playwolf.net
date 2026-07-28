import type { StaticImageData } from "next/image";

type OpenImageLinkProps = {
  src: StaticImageData;
  /** Link text. Defaults to "Open full image". */
  label?: string;
};

/**
 * Opens the untouched asset in a new tab — used under example artwork and
 * reference sheets alike, so the raw file is always one click away.
 */
export function OpenImageLink({
  src,
  label = "Open full image",
}: OpenImageLinkProps) {
  return (
    <a
      href={src.src}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:border-glow-500/60 hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
    >
      {label}
    </a>
  );
}
