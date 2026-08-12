/**
 * On-site display frames for croppable upload collections. The admin crop tool
 * locks to these ratios and `framedCrop` bakes that selection into the stored
 * file — the public site should show that crop as-is (no second focal cover).
 */
export type UploadFrame = {
  /** Width ÷ height, passed to react-image-crop. */
  aspect: number;
  /** Human label shown in the crop drawer, e.g. "4:5". */
  label: string;
  /** Short note about where this frame is used. */
  usage: string;
  /** Suggested export size (reference only — not enforced as a pixel crop). */
  referenceSize: { width: number; height: number };
  /**
   * Fill for the area a crop covers outside the original. `"transparent"`
   * produces an alpha WebP; a hex string is opaque. Passed straight to sharp's
   * `extend({ background })`.
   */
  padBackground: "transparent" | `#${string}`;
  /**
   * How far the crop may reach past each edge of the original, as a fraction of
   * that axis of the original. Bounds both the drawer's stage and the canvas
   * sharp has to pad, so it cannot be unlimited.
   */
  maxOutset: number;
};

/**
 * `0.5` lets a crop be at most twice the original in each axis, so the padded
 * canvas peaks at four times the pixels — enough to letterbox any image whose
 * aspect is within 2× of its frame's (a square into 16:9 needs 0.28 per side,
 * into 1.91:1 it needs 0.46) while a stray drag can never ask libvips for a
 * canvas that dwarfs the upload. It is per-frame so an extreme ratio can raise
 * it if a real image ever needs more room.
 */
const DEFAULT_MAX_OUTSET = 0.5;

export const UPLOAD_FRAMES = {
  "friend-images": {
    aspect: 5 / 2,
    label: "5:2",
    usage: "Featured friend banner beside artwork",
    referenceSize: { width: 680, height: 272 },
    padBackground: "transparent",
    // The widest frame, and the one most often fed a portrait avatar, so it gets
    // room to pad a full-height crop out to 5:2 from a square source.
    maxOutset: 1,
  },
  "character-images": {
    aspect: 1,
    label: "1:1",
    usage: "Character overview card",
    referenceSize: { width: 1200, height: 1200 },
    padBackground: "transparent",
    maxOutset: DEFAULT_MAX_OUTSET,
  },
  "project-images": {
    aspect: 16 / 9,
    label: "16:9",
    usage: "Project cover on /projects",
    referenceSize: { width: 1600, height: 900 },
    padBackground: "transparent",
    maxOutset: DEFAULT_MAX_OUTSET,
  },
  "site-images": {
    aspect: 1200 / 630,
    label: "1.91:1",
    usage: "Default social / Open Graph preview",
    referenceSize: { width: 1200, height: 630 },
    /**
     * The `void` token from tailwind.config.ts. Opaque rather than transparent
     * because these become Open Graph images and chat clients composite alpha
     * previews unpredictably — usually onto white, which a dark site does not
     * survive.
     */
    padBackground: "#050506",
    maxOutset: DEFAULT_MAX_OUTSET,
  },
} as const satisfies Record<string, UploadFrame>;

export type FramedCollectionSlug = keyof typeof UPLOAD_FRAMES;

export function frameForCollection(slug: string | undefined): UploadFrame | undefined {
  if (!slug) return undefined;
  return UPLOAD_FRAMES[slug as FramedCollectionSlug];
}

export function frameAdminDescription(frame: UploadFrame): string {
  const { width, height } = frame.referenceSize;
  return `${frame.usage}. Crop is locked to ${frame.label} (about ${width}×${height}). What you select is what appears on the site.`;
}

/**
 * Optional fallback when `AspectLockedEditUpload` is mounted without an
 * explicit `frame` prop (e.g. relationship drawers reporting another slug).
 */
let activeUploadFrame: UploadFrame | undefined;

export function setActiveUploadFrame(frame: UploadFrame | undefined): void {
  activeUploadFrame = frame;
}

export function getActiveUploadFrame(): UploadFrame | undefined {
  return activeUploadFrame;
}
