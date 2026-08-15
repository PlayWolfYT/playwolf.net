import { createHmac, timingSafeEqual } from "node:crypto";

export const CACHE_REVALIDATION_PATH = "/api/cache/revalidate";

const TOKEN_PURPOSE = "playwolf-seed-cache-revalidation-v1";

/**
 * Derive a purpose-specific bearer token without sending PAYLOAD_SECRET over
 * HTTP. The seed CLI and revalidation route share this deterministic value.
 */
export function createCacheRevalidationToken(secret: string): string {
  return createHmac("sha256", secret).update(TOKEN_PURPOSE).digest("hex");
}

export function isCacheRevalidationAuthorized(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const supplied = Buffer.from(authorization.slice("Bearer ".length), "utf8");
  const expected = Buffer.from(createCacheRevalidationToken(secret), "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
