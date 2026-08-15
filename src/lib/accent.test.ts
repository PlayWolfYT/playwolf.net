import { describe, expect, test } from "bun:test";

import { accentVars, hexToRgb, profileThemeVars } from "@/lib/accent";

describe("hexToRgb", () => {
  test("reads six-digit hex with or without the hash", () => {
    expect(hexToRgb("#3abef9")).toEqual([58, 190, 249]);
    expect(hexToRgb("3abef9")).toEqual([58, 190, 249]);
  });

  test("expands three-digit shorthand", () => {
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
  });

  test("handles the extremes without wrapping", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });
});

describe("accentVars", () => {
  test("keeps the given colour at the 500 step", () => {
    expect(accentVars("#3abef9")["--accent-500"]).toBe("58 190 249");
  });

  test("lightens above the midpoint and darkens below it", () => {
    expect(accentVars("#3abef9")).toEqual({
      "--accent-300": "137 216 251",
      "--accent-400": "97 203 250",
      "--accent-500": "58 190 249",
      "--accent-600": "50 163 214",
      "--accent-700": "39 129 169",
    });
  });

  test("stays in range at both ends of the scale", () => {
    const channels = (vars: Record<string, string>) =>
      Object.values(vars).flatMap((triplet) => triplet.split(" ").map(Number));

    for (const hex of ["#000000", "#ffffff"]) {
      for (const channel of channels(accentVars(hex))) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  test("mixing towards black cannot brighten a colour", () => {
    const vars = accentVars("#808080");
    const step = (key: keyof typeof vars) => Number(vars[key].split(" ")[0]);

    expect(step("--accent-300")).toBeGreaterThan(step("--accent-400"));
    expect(step("--accent-400")).toBeGreaterThan(step("--accent-500"));
    expect(step("--accent-500")).toBeGreaterThan(step("--accent-600"));
    expect(step("--accent-600")).toBeGreaterThan(step("--accent-700"));
  });
});

describe("profileThemeVars", () => {
  test("maps Tailwind and semantic UI tokens to the profile ramp", () => {
    const vars = profileThemeVars("#dc2626");

    expect(vars["--accent-500"]).toBe("220 38 38");
    expect(vars["--color-glow-500"]).toBe("rgb(220 38 38)");
    expect(vars["--primary"]).toBe("rgb(220 38 38)");
    expect(vars["--ring"]).toBe("rgb(227 81 81)");
    expect(vars["--border"]).toBe("rgb(227 81 81 / 0.2)");
    expect(vars["--background-image-rim-cyan"]).toContain("rgb(220 38 38 / 0.2)");
  });
});
