/**
 * A cookie rather than `localStorage`, because the server has to know the
 * answer while rendering: an 18+ page must ship the warning in its very first
 * HTML, not paint the artwork and then cover it once React hydrates.
 */
export const NSFW_CONSENT_COOKIE = "nsfw-consent";

/** A year, so regulars are asked once rather than every session. */
export const NSFW_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Whether a URL puts 18+ artwork on screen: any After Dark route
 * (`/ref/<character>/nsfw/...`) or the gallery with its 18+ filter switched on.
 *
 * `search` accepts either a query string or the `URLSearchParams`-alike that
 * `useSearchParams()` hands back.
 */
export function isNsfwLocation(
  pathname: string,
  search: string | { get(key: string): string | null } = "",
): boolean {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "ref") return segments[2] === "nsfw";

  if (segments.length === 1 && segments[0] === "gallery") {
    const params = typeof search === "string" ? new URLSearchParams(search) : search;
    return params.get("nsfw") === "1";
  }

  return false;
}

/** Where to drop someone who declines the warning with no history to pop. */
export function nsfwExitHref(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "ref") return "/ref";
  if (segments[0] === "gallery") return "/gallery";
  return "/";
}
