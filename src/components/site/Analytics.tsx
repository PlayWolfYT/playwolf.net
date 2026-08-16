import Script from "next/script";

/** The tracker's origin, so the connection is warm before the script is asked for. */
function scriptOrigin(src: string): string | null {
  try {
    // Deliberately no `crossOrigin`: the tracker is fetched as a plain script,
    // and a CORS preconnect would open a connection it cannot reuse.
    return new URL(src).origin;
  } catch {
    return null;
  }
}

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

  const origin = scriptOrigin(src);

  return (
    <>
      {origin ? <link rel="preconnect" href={origin} /> : null}
      {/* Analytics is never worth delaying the page for, so it waits for the
          load event. Umami hooks the History API itself, so it still records
          client-side navigations after it arrives. */}
      <Script src={src} data-website-id={websiteId} strategy="lazyOnload" />
    </>
  );
}
