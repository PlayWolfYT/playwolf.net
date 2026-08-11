import { describe, expect, test } from "bun:test";

import {
  gradientTextStyle,
  gradientTextStyleObject,
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
  test("builds full inline text-gradient CSS", () => {
    const css = gradientTextStyle(["#ff0000", "#0000ff"]);
    expect(css).toContain("linear-gradient(90deg, #ff0000, #0000ff)");
    expect(css).toContain("background-clip: text");
    expect(css).toContain("color: transparent");
  });

  test("builds a React style object", () => {
    expect(gradientTextStyleObject(["#ff0000", "#0000ff"])).toEqual({
      backgroundImage: "linear-gradient(90deg, #ff0000, #0000ff)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    });
  });

  test("parses stops from style and data attributes", () => {
    expect(
      parseGradientColorsFromStyle("--fx-gradient-stops: #aaa, #bbb; color: red"),
    ).toEqual(["#aaa", "#bbb"]);
    expect(
      parseGradientColorsFromStyle(
        "background-image: linear-gradient(90deg, #ff0000, #00ff00); color: transparent",
      ),
    ).toEqual(["#ff0000", "#00ff00"]);
    expect(parseGradientColorsFromAttr("#aaa,#bbb")).toEqual(["#aaa", "#bbb"]);
  });

  test("maps every editor effect to its public class", () => {
    expect(textEffectClass("rainbow")).toBe("fx-rainbow");
    expect(textEffectClass("shake")).toBe("fx-shake");
    expect(textEffectClass("glow")).toBe("fx-glow");
    expect(textEffectClass("shimmer")).toBe("fx-shimmer");
    expect(textEffectClass("float")).toBe("fx-float");
    expect(textEffectClass("pulse")).toBe("fx-pulse");
    expect(textEffectClass("gradient")).toBe("fx-gradient");
    expect(textEffectClass("unknown")).toBeUndefined();
  });
});
