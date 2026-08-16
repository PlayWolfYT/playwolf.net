/**
 * URL vetting shared by the rich-text link converter, the CMS `links` field and
 * the `LinkRow` renderer. Every consumer treats stored URLs as inbound data:
 * documents are JSON, so a `javascript:` href can be written by anything that
 * can write to the database, not just the admin UI.
 *
 * Dependency-free on purpose — this runs in the Payload admin bundle (field
 * `validate`), in server components and in unit tests.
 */

/**
 * Schemes an `href` may carry. `javascript:`, `data:`, `vbscript:` and `file:`
 * are the ones that matter; anything not listed is dropped rather than guessed
 * at.
 */
export const SAFE_HREF_SCHEMES = ["http:", "https:", "mailto:", "tel:"] as const;

/** Schemes a stored `links.url` may carry. Email kinds hold a bare address. */
export const SAFE_LINK_SCHEMES = ["http:", "https:"] as const;

/**
 * A bare address, `local@domain.tld`, with no scheme — the shape the `email`
 * link kind stores. Shared with `detectLinkKind` so the classifier and the
 * validator cannot drift apart; it lives here because this module is the one
 * with no imports, and `detectLinkKind` pulls a type from the CMS field that
 * in turn imports this file.
 */
export const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Leading scheme of a URL, ignoring the control characters browsers strip while
 * parsing one — `java\tscript:alert(1)` navigates in every browser, so a naive
 * `startsWith("javascript:")` check misses it.
 */
function schemeOf(value: string): string | undefined {
  const cleaned = value.replace(/[\u0000-\u0020]/g, "");
  const match = /^([a-zA-Z][a-zA-Z0-9+.\-]*):/.exec(cleaned);
  return match ? `${match[1].toLowerCase()}:` : undefined;
}

/** Whether a value is safe to place in an `href`. */
export function isSafeHref(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const scheme = schemeOf(trimmed);
  // Relative (`/gallery`, `#top`) and protocol-relative hrefs inherit the page.
  if (!scheme) return true;
  return (SAFE_HREF_SCHEMES as readonly string[]).includes(scheme);
}

/** The href to render, or `undefined` when the scheme is not allow-listed. */
export function safeHref(value: unknown): string | undefined {
  return isSafeHref(value) ? (value as string).trim() : undefined;
}

/** Bare email address, as the `email` link kind stores it. */
export function isEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  // `mailto:hi@example.com` passes the address shape, but the scheme is added at
  // render time — storing it too yields `mailto:mailto:…`.
  if (schemeOf(trimmed)) return false;
  return EMAIL_ADDRESS.test(trimmed);
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value.trim());
  } catch {
    return undefined;
  }
}

/**
 * Absolute `http:`/`https:` URL. A scheme is required: a bare `playwolf.net` in
 * an `href` resolves against the current page instead of the intended host.
 */
export function isHttpUrl(value: string): boolean {
  const url = parseUrl(value);
  if (!url) return false;
  return (
    (SAFE_LINK_SCHEMES as readonly string[]).includes(url.protocol) &&
    url.hostname.length > 0
  );
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "[::1]"
  );
}

/**
 * `https:` URL, or `http:` on loopback where the request never leaves the
 * machine. Used for endpoints that carry a credential.
 */
export function isSecureUrl(value: string): boolean {
  const url = parseUrl(value);
  if (!url) return false;
  if (url.protocol === "https:") return url.hostname.length > 0;
  return url.protocol === "http:" && isLoopbackHost(url.hostname);
}
