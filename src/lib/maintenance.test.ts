import { describe, expect, test } from "bun:test";

import {
  DEFAULT_MAINTENANCE_EXCLUDED_PATHS,
  isPathExcludedFromMaintenance,
} from "@/lib/maintenance";

describe("isPathExcludedFromMaintenance", () => {
  test("matches an exact prefix and its subpaths", () => {
    expect(isPathExcludedFromMaintenance("/ref", ["/ref"])).toBe(true);
    expect(isPathExcludedFromMaintenance("/ref/", ["/ref"])).toBe(true);
    expect(isPathExcludedFromMaintenance("/ref/wuff", ["/ref"])).toBe(true);
    expect(isPathExcludedFromMaintenance("/ref/wuff/sfw/sheet", ["/ref"])).toBe(true);
  });

  test("does not match sibling prefixes", () => {
    expect(isPathExcludedFromMaintenance("/reference", ["/ref"])).toBe(false);
    expect(isPathExcludedFromMaintenance("/refs", ["/ref"])).toBe(false);
    expect(isPathExcludedFromMaintenance("/", ["/ref"])).toBe(false);
    expect(isPathExcludedFromMaintenance("/projects", ["/ref"])).toBe(false);
  });

  test("normalizes missing leading slashes and trailing slashes on prefixes", () => {
    expect(isPathExcludedFromMaintenance("/links", ["links"])).toBe(true);
    expect(isPathExcludedFromMaintenance("/links/extra", ["links/"])).toBe(true);
  });

  test("treats an empty exclusion list as no exceptions", () => {
    expect(isPathExcludedFromMaintenance("/ref", [])).toBe(false);
  });

  test("ignores blank entries", () => {
    expect(isPathExcludedFromMaintenance("/ref", ["", "  "])).toBe(false);
  });

  test("default exclusions cover /ref", () => {
    expect(
      isPathExcludedFromMaintenance("/ref/wuff", DEFAULT_MAINTENANCE_EXCLUDED_PATHS),
    ).toBe(true);
  });
});
