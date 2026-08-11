/**
 * On-site display frames for croppable upload collections. The admin crop tool
 * locks to these ratios so the selected area matches what `object-cover` shows
 * on the public site.
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
};

export const UPLOAD_FRAMES = {
  "friend-images": {
    aspect: 5 / 2,
    label: "5:2",
    usage: "Featured friend banner beside artwork",
    referenceSize: { width: 680, height: 272 },
  },
  "character-images": {
    aspect: 1,
    label: "1:1",
    usage: "Character overview card",
    referenceSize: { width: 1200, height: 1200 },
  },
  "project-images": {
    aspect: 16 / 9,
    label: "16:9",
    usage: "Project cover on /projects",
    referenceSize: { width: 1600, height: 900 },
  },
  "site-images": {
    aspect: 1200 / 630,
    label: "1.91:1",
    usage: "Default social / Open Graph preview",
    referenceSize: { width: 1200, height: 630 },
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
