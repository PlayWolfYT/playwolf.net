import { afterEach, describe, expect, test } from "bun:test";
import { isMaintenanceMode } from "./maintenance";

afterEach(() => {
  delete process.env.MAINTENANCE_MODE;
});

describe("isMaintenanceMode", () => {
  test("returns false when unset", () => {
    delete process.env.MAINTENANCE_MODE;
    expect(isMaintenanceMode()).toBe(false);
  });

  test("returns true for true, 1, yes (case-insensitive)", () => {
    process.env.MAINTENANCE_MODE = "true";
    expect(isMaintenanceMode()).toBe(true);
    process.env.MAINTENANCE_MODE = "TRUE";
    expect(isMaintenanceMode()).toBe(true);
    process.env.MAINTENANCE_MODE = "1";
    expect(isMaintenanceMode()).toBe(true);
    process.env.MAINTENANCE_MODE = "yes";
    expect(isMaintenanceMode()).toBe(true);
    process.env.MAINTENANCE_MODE = "Yes";
    expect(isMaintenanceMode()).toBe(true);
  });

  test("returns false for other values", () => {
    process.env.MAINTENANCE_MODE = "false";
    expect(isMaintenanceMode()).toBe(false);
    process.env.MAINTENANCE_MODE = "0";
    expect(isMaintenanceMode()).toBe(false);
    process.env.MAINTENANCE_MODE = "maybe";
    expect(isMaintenanceMode()).toBe(false);
  });

  test("trims whitespace", () => {
    process.env.MAINTENANCE_MODE = "  true  ";
    expect(isMaintenanceMode()).toBe(true);
  });
});
