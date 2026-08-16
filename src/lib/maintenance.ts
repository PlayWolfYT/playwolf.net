/**
 * Path prefixes that stay reachable when maintenance mode is on, unless the
 * admin clears the list. `/ref` is the product default so character sheets
 * remain shareable while the rest of the site is parked.
 */
export const DEFAULT_MAINTENANCE_EXCLUDED_PATHS = ["/ref"] as const;

/**
 * Header set by `src/proxy.ts` so the root layout can see the request path.
 * App Router layouts do not receive the pathname otherwise.
 *
 * Maintenance mode is a *presentation* state, not access control. Everything it
 * parks stays reachable: the REST and GraphQL APIs answer normally, and so do
 * the upload file routes, which is deliberate — an embedded image must not go
 * dark because the site is being worked on. Nothing here may be relied on to
 * keep content private; that is what collection `access` is for.
 */
export const PATHNAME_HEADER = "x-pathname";

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 && withSlash.endsWith("/")
    ? withSlash.slice(0, -1)
    : withSlash;
}

/**
 * True when `pathname` is exactly an excluded prefix or under one
 * (`/ref` matches `/ref` and `/ref/wuff`, but not `/reference`).
 */
export function isPathExcludedFromMaintenance(
  pathname: string,
  excludedPaths: readonly string[],
): boolean {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return false;

  return excludedPaths.some((raw) => {
    const prefix = normalizePath(raw);
    if (!prefix) return false;
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  });
}
