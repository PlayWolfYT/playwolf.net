import { describe, expect, test } from "bun:test";

import {
  gradientStopsStyle,
  normalizeGradientColors,
  parseGradientColorsFromAttr,
  parseGradientColorsFromStyle,
  textEffectClass,
} from "@/lib/text-effects";

describe("normalizeGradientColors", () => {
  test("keeps two or more valid hex stops", () => {
    expect(normalizeGradientColors(["#ff0000", "#00ff00"])).toEqual([
      "#ff0000",
      "#00ff00",
    ]);
    expect(normalizeGradientColors("#abc, #def")).toEqual(["#abc", "#def"]);
  });

  test("rejects fewer than two colours", () => {
    expect(normalizeGradientColors(["#ff0000"])).toBeUndefined();
    expect(normalizeGradientColors([])).toBeUndefined();
  });

  test("filters invalid entries", () => {
    expect(normalizeGradientColors(["#ff0000", "red", "#00ff00"])).toEqual([
      "#ff0000",
      "#00ff00",
    ]);
  });
});

describe("gradient helpers", () => {
  test("builds the CSS variable style", () => {
    expect(gradientStopsStyle(["#ff0000", "#0000ff"])).toBe(
      "--fx-gradient-stops: #ff0000, #0000ff",
    );
  });

  test("parses stops from style and data attributes", () => {
    expect(
      parseGradientColorsFromStyle("--fx-gradient-stops: #aaa, #bbb; color: red"),
    ).toEqual(["#aaa", "#bbb"]);
    expect(parseGradientColorsFromAttr("#aaa,#bbb")).toEqual(["#aaa", "#bbb"]);
  });

  test("gradient maps to fx-gradient", () => {
    expect(textEffectClass("gradient")).toBe("fx-gradient");
  });
});
