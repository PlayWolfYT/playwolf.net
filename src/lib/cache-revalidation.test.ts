import { describe, expect, test } from "bun:test";

import {
  createCacheRevalidationToken,
  isCacheRevalidationAuthorized,
} from "@/lib/cache-revalidation";

describe("cache revalidation authorization", () => {
  test("accepts only the purpose-derived bearer token", () => {
    const secret = "payload-secret-for-test";
    const token = createCacheRevalidationToken(secret);

    expect(isCacheRevalidationAuthorized(`Bearer ${token}`, secret)).toBe(true);
    expect(isCacheRevalidationAuthorized(`Bearer ${secret}`, secret)).toBe(false);
    expect(isCacheRevalidationAuthorized("Bearer wrong-token", secret)).toBe(false);
  });

  test("rejects missing configuration and malformed headers", () => {
    expect(isCacheRevalidationAuthorized(null, "secret")).toBe(false);
    expect(isCacheRevalidationAuthorized("Basic token", "secret")).toBe(false);
    expect(isCacheRevalidationAuthorized("Bearer token", undefined)).toBe(false);
  });
});
