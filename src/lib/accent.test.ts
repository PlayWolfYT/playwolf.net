import { describe, expect, test } from "bun:test";

import {
  accentVars,
  contrastRatio,
  hexToRgb,
  MIN_TEXT_CONTRAST,
  MIN_UI_CONTRAST,
  profileThemeVars,
  relativeLuminance,
  validateAccentColor,
  VOID_RGB,
  type Rgb,
} from "@/lib/accent";

/** Read one "R G B" ramp value back as its contrast against the void backdrop. */
function ratioOf(triplet: string): number {
  const [r, g, b] = triplet.split(" ").map(Number);
  return contrastRatio([r, g, b] as Rgb, VOID_RGB);
}

function channels(triplet: string): Rgb {
  return triplet.split(" ").map(Number) as Rgb;
}

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

describe("contrast maths", () => {
  test("matches the WCAG anchors", () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBe(1);
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([58, 190, 249], [58, 190, 249])).toBe(1);
  });

  test("is symmetric in its arguments", () => {
    const cyan = hexToRgb("#3abef9");
    expect(contrastRatio(cyan, VOID_RGB)).toBe(contrastRatio(VOID_RGB, cyan));
  });
});

describe("accent contrast floor", () => {
  /** 300–500 land on text, 600–700 only on borders and shadows. */
  const FLOORS: Record<keyof ReturnType<typeof accentVars>, number> = {
    "--accent-300": MIN_TEXT_CONTRAST,
    "--accent-400": MIN_TEXT_CONTRAST,
    "--accent-500": MIN_TEXT_CONTRAST,
    "--accent-600": MIN_UI_CONTRAST,
    "--accent-700": MIN_UI_CONTRAST,
  };

  const expectFloorsMet = (hex: string) => {
    const vars = accentVars(hex);
    for (const [key, floor] of Object.entries(FLOORS)) {
      expect(ratioOf(vars[key as keyof typeof vars])).toBeGreaterThanOrEqual(floor);
    }
  };

  test("the default cyan already clears every floor, so it is not touched", () => {
    expect(ratioOf(accentVars("#3abef9")["--accent-500"])).toBeCloseTo(9.23, 1);
    expect(accentVars("#3abef9")["--accent-500"]).toBe("58 190 249");
    expectFloorsMet("#3abef9");
  });

  test("the seeded character accents are left alone as well", () => {
    for (const hex of ["#8EEDFF", "#FF5F6D"]) {
      expect(accentVars(hex)["--accent-500"]).toBe(hexToRgb(hex).join(" "));
      expectFloorsMet(hex);
    }
  });

  test("a deep navy is lifted above the text floor but stays blue", () => {
    // 1.4:1 against #0d0c0b — unreadable as chip or eyebrow copy.
    expect(contrastRatio(hexToRgb("#1b2a5e"), VOID_RGB)).toBeLessThan(
      MIN_TEXT_CONTRAST,
    );

    expectFloorsMet("#1b2a5e");

    const [r, g, b] = channels(accentVars("#1b2a5e")["--accent-500"]);
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
  });

  test("a deep burgundy is lifted too, and stays red", () => {
    expect(contrastRatio(hexToRgb("#5c1a2b"), VOID_RGB)).toBeLessThan(MIN_UI_CONTRAST);

    expectFloorsMet("#5c1a2b");

    const [r, g, b] = channels(accentVars("#5c1a2b")["--accent-500"]);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  test("the lift keeps the ramp ordered darkest-last", () => {
    // Lifting each step on its own would push 700 past 600; the whole ramp has
    // to move together.
    for (const hex of ["#1b2a5e", "#5c1a2b", "#0a0a1e", "#000000"]) {
      const vars = accentVars(hex);
      const luminance = (key: keyof typeof vars) =>
        relativeLuminance(channels(vars[key]));

      expect(luminance("--accent-300")).toBeGreaterThan(luminance("--accent-400"));
      expect(luminance("--accent-400")).toBeGreaterThan(luminance("--accent-500"));
      expect(luminance("--accent-500")).toBeGreaterThan(luminance("--accent-600"));
      expect(luminance("--accent-600")).toBeGreaterThan(luminance("--accent-700"));
    }
  });

  test("an unparseable hex degrades to a visible grey, not invisible black", () => {
    // `hexToRgb` coerces garbage to [0, 0, 0] via the bitwise shifts, which
    // used to mean accent text rendered black on a near-black stage.
    expect(hexToRgb("#zzzzzz")).toEqual([0, 0, 0]);
    expectFloorsMet("#zzzzzz");
  });
});

describe("validateAccentColor", () => {
  test("accepts an empty value so the stored default can apply", () => {
    expect(validateAccentColor(undefined)).toBe(true);
    expect(validateAccentColor(null)).toBe(true);
    expect(validateAccentColor("")).toBe(true);
  });

  test("accepts hex colours that clear the non-text floor", () => {
    for (const hex of ["#3abef9", "#fff", "#8EEDFF", "#FF5F6D", "#808080"]) {
      expect(validateAccentColor(hex)).toBe(true);
    }
  });

  test("rejects anything that is not a 3- or 6-digit hex", () => {
    expect(validateAccentColor("cyan")).toContain("#3abef9");
    expect(validateAccentColor("#12345")).toContain("#3abef9");
    expect(validateAccentColor("rgb(58 190 249)")).toContain("#3abef9");
  });

  test("rejects a colour too dark to render as chosen, quoting the ratio", () => {
    const message = validateAccentColor("#1b2a5e");
    expect(message).toContain("1.4:1");
    expect(message).toContain("#0d0c0b");
  });
});

describe("profileThemeVars", () => {
  /**
   * Expectations are read off `accentVars` rather than hard-coded, because the
   * ramp lifts an accent that misses the contrast floor — `#dc2626` is one such
   * colour. Pinning literals here would assert the unlifted ramp and quietly
   * turn into a second, contradictory source of truth for the maths.
   */
  test("maps Tailwind and semantic UI tokens to the profile ramp", () => {
    const ramp = accentVars("#dc2626");
    const vars = profileThemeVars("#dc2626");

    expect(vars["--accent-500"]).toBe(ramp["--accent-500"]);
    expect(vars["--color-glow-500"]).toBe(`rgb(${ramp["--accent-500"]})`);
    expect(vars["--primary"]).toBe(`rgb(${ramp["--accent-500"]})`);
    expect(vars["--ring"]).toBe(`rgb(${ramp["--accent-400"]})`);
    expect(vars["--border"]).toBe(`rgb(${ramp["--accent-400"]} / 0.2)`);
    expect(vars["--background-image-rim-cyan"]).toContain(
      `rgb(${ramp["--accent-500"]} / 0.2)`,
    );
  });

  test("carries the contrast floor into every derived theme token", () => {
    // Dark enough to be lifted, so the semantic tokens must not echo the input.
    expect(profileThemeVars("#dc2626")["--primary"]).not.toBe("rgb(220 38 38)");
    expect(ratioOf(profileThemeVars("#dc2626")["--accent-500"])).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});
