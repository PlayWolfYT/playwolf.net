/**
 * Umami's tracker, rendered only when the deployment has been pointed at one.
 *
 * The variables are deliberately *not* `NEXT_PUBLIC_`: those are inlined during
 * `next build`, and the image is built in CI, which has no idea what URL the
 * analytics instance will end up on. Reading them here instead means the same
 * image works with analytics on, off, or moved.
 */
export function Analytics() {
  const src = process.env.UMAMI_SCRIPT_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return null;

  return <script defer src={src} data-website-id={websiteId} />;
}
