/**
 * Picks which upload URL/dimensions the public site should render.
 *
 * Framed libraries bake the admin crop into the main file and `sizes.frame`.
 * Prefer the largest derivative that still matches the frame aspect so retina
 * banners are sharp, and never fall back to a differently-proportioned size
 * that CSS `object-cover` would re-crop.
 */

export type UploadSourceDims = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
};

export type UploadSizes = {
  frame?: UploadSourceDims | null;
  display?: UploadSourceDims | null;
  card?: UploadSourceDims | null;
};

type Candidate = { src: string; width: number; height: number };

function candidate(value: UploadSourceDims | null | undefined): Candidate | undefined {
  if (!value?.url || !value.width || !value.height) return undefined;
  return { src: value.url, width: value.width, height: value.height };
}

export function aspectRatio(width: number, height: number): number {
  return width / height;
}

/** Frame sizes are exact ratios (5:2, 1:1, …); allow a little encode rounding. */
export function aspectsMatch(a: number, b: number, epsilon = 0.03): boolean {
  return Math.abs(a - b) <= epsilon;
}

export function pickUploadRenderSource(args: {
  original: Candidate;
  sizes?: UploadSizes | null;
}): { src: string; width: number; height: number; isFramed: boolean } {
  const sizes = args.sizes;
  const isFramed = Boolean(sizes && "frame" in sizes);
  const framed = candidate(sizes && "frame" in sizes ? sizes.frame : undefined);

  if (isFramed && framed) {
    const target = aspectRatio(framed.width, framed.height);
    const matching = [
      candidate(sizes?.display),
      candidate(sizes?.card),
      framed,
      args.original,
    ].filter((entry): entry is Candidate => {
      return Boolean(entry && aspectsMatch(aspectRatio(entry.width, entry.height), target));
    });

    matching.sort((a, b) => b.width - a.width);
    return { ...(matching[0] ?? framed), isFramed: true };
  }

  if (isFramed) {
    // `frame` key present but empty (`withoutEnlargement`) — main file is the crop.
    const usable =
      candidate(sizes?.display) ?? candidate(sizes?.card) ?? args.original;
    return { ...usable, isFramed: true };
  }

  const usable =
    candidate(sizes?.display) ?? candidate(sizes?.card) ?? args.original;
  return { ...usable, isFramed: false };
}
