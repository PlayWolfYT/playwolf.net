import type { MaintenanceExcludedPath } from "@/lib/content";

/**
 * Path prefixes that stay reachable when maintenance mode is on, unless the
 * admin clears the list. `/ref` is the product default so character sheets
 * remain shareable while the rest of the site is parked.
 */
export const DEFAULT_MAINTENANCE_EXCLUDED_PATHS: readonly MaintenanceExcludedPath[] = [
  { path: "/ref", label: "Character References" },
] as const;

/**
 * Maintenance mode is a *presentation* state, not access control. Everything it
 * parks stays reachable: the REST and GraphQL APIs answer normally, and so do
 * the upload file routes, which is deliberate — an embedded image must not go
 * dark because the site is being worked on. Nothing here may be relied on to
 * keep content private; that is what collection `access` is for.
 *
 * Which page is parked is decided in the client path gate from the live URL.
 * The server template always renders the page slot, so a soft navigation can
 * leave the maintenance screen without a second document load.
 */

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
  excludedPaths: readonly MaintenanceExcludedPath[] | readonly string[],
): boolean {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return false;

  return excludedPaths.some((entry) => {
    const raw = typeof entry === "string" ? entry : entry.path;
    const prefix = normalizePath(raw);
    if (!prefix) return false;
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  });
}
