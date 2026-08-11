/**
 * Bounded set of rich-text effects. One entry here plus one CSS rule in
 * `globals.css` is the whole cost of adding another fixed effect.
 *
 * The editor stores the *key* on the text node under `TEXT_EFFECT_STATE_KEY`;
 * `css` is what Payload's TextStateFeature uses as a live preview, and
 * `className` is what the frontend converter emits. The `gradient` effect
 * additionally stores colour stops under `GRADIENT_COLORS_STATE_KEY` and as
 * full inline CSS on the Lexical text node's `style` field (so stops survive
 * even if unknown `$` keys are stripped).
 */

export const TEXT_EFFECT_STATE_KEY = "effect";

/** Lexical `$` key for custom gradient colour stops (`string[]` of hex colours). */
export const GRADIENT_COLORS_STATE_KEY = "gradientColors";

/**
 * Where Lexical parks node state in the serialized JSON. Exported so the
 * frontend converter reads the same place the editor writes to.
 */
export const NODE_STATE_KEY = "$";

export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const DEFAULT_GRADIENT_COLORS = ["#ff5f6d", "#5cccff", "#b47cff"] as const;

type TextEffectDefinition = {
  label: string;
  className: string;
  /** Hyphenated CSS properties — the shape Lexical's TextStateFeature wants. */
  css: Record<string, string>;
};

export const TEXT_EFFECTS = {
  rainbow: {
    label: "Rainbow",
    className: "fx-rainbow",
    css: {
      "background-image":
        "linear-gradient(90deg, #ff5f6d, #ffc371, #47e891, #5cccff, #b47cff, #ff5f6d)",
      "background-size": "200% 100%",
      "-webkit-background-clip": "text",
      "background-clip": "text",
      color: "transparent",
      animation: "fx-rainbow 6s linear infinite",
    },
  },
  shake: {
    label: "Shake",
    className: "fx-shake",
    css: {
      display: "inline-block",
      animation: "fx-shake 0.5s ease-in-out infinite",
    },
  },
  glow: {
    label: "Glow",
    className: "fx-glow",
    css: {
      color: "#8ad9ff",
      "text-shadow":
        "0 0 6px rgba(92, 204, 255, 0.75), 0 0 18px rgba(58, 190, 249, 0.45)",
    },
  },
  shimmer: {
    label: "Shimmer",
    className: "fx-shimmer",
    css: {
      "background-image":
        "linear-gradient(105deg, #8a847a 20%, #f7f4ec 45%, #8ad9ff 50%, #f7f4ec 55%, #8a847a 80%)",
      "background-size": "240% 100%",
      "-webkit-background-clip": "text",
      "background-clip": "text",
      color: "transparent",
      animation: "fx-shimmer 2.8s ease-in-out infinite",
    },
  },
  float: {
    label: "Float",
    className: "fx-float",
    css: {
      display: "inline-block",
      animation: "fx-float 2.4s ease-in-out infinite",
    },
  },
  pulse: {
    label: "Pulse",
    className: "fx-pulse",
    css: {
      color: "#8ad9ff",
      animation: "fx-pulse 2s ease-in-out infinite",
    },
  },
  gradient: {
    label: "Gradient",
    className: "fx-gradient",
    // Default preview stops — real colours are applied as full inline CSS.
    css: {
      "background-image": `linear-gradient(90deg, ${DEFAULT_GRADIENT_COLORS.join(", ")})`,
      "-webkit-background-clip": "text",
      "background-clip": "text",
      color: "transparent",
    },
  },
} as const satisfies Record<string, TextEffectDefinition>;

export type TextEffect = keyof typeof TEXT_EFFECTS;

export function isTextEffect(value: unknown): value is TextEffect {
  return typeof value === "string" && value in TEXT_EFFECTS;
}

/** CSS class for a stored effect key, or `undefined` for anything unknown. */
export function textEffectClass(value: unknown): string | undefined {
  return isTextEffect(value) ? TEXT_EFFECTS[value].className : undefined;
}

/** Keep 2–8 valid hex stops; returns `undefined` when fewer than two survive. */
export function normalizeGradientColors(value: unknown): string[] | undefined {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\s]+/)
      : [];
  const colors = list
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => HEX_COLOR.test(entry))
    .slice(0, 8);
  return colors.length >= 2 ? colors : undefined;
}

/**
 * Full inline CSS that paints a text gradient without relying on CSS variables
 * (custom-property fallbacks can't contain commas, so var()-based gradients
 * were silently invalid whenever stops weren't applied).
 */
export function gradientTextStyle(colors: string[]): string {
  const stops = colors.join(", ");
  return [
    `background-image: linear-gradient(90deg, ${stops})`,
    "-webkit-background-clip: text",
    "background-clip: text",
    "color: transparent",
  ].join("; ");
}

/** @deprecated Use `gradientTextStyle` — kept for older HTML that only set the var. */
export function gradientStopsStyle(colors: string[]): string {
  return `--fx-gradient-stops: ${colors.join(", ")}`;
}

/** React style object for the same full text-gradient CSS. */
export function gradientTextStyleObject(colors: string[]): Record<string, string> {
  return {
    backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

/** Read stops from an inline style (CSS var or linear-gradient). */
export function parseGradientColorsFromStyle(
  style: string | null | undefined,
): string[] | undefined {
  if (!style) return undefined;
  const fromVar = /--fx-gradient-stops\s*:\s*([^;]+)/i.exec(style);
  if (fromVar) {
    const colors = normalizeGradientColors(fromVar[1]);
    if (colors) return colors;
  }
  const fromGradient =
    /linear-gradient\(\s*90deg\s*,\s*([^)]+)\)/i.exec(style) ??
    /linear-gradient\(\s*([^)]+)\)/i.exec(style);
  if (fromGradient) {
    // Drop an optional leading angle token if present without 90deg match.
    const body = fromGradient[1] ?? "";
    const withoutAngle = body.replace(/^(?:to\s+\w+|[-\d.]+deg)\s*,\s*/i, "");
    return normalizeGradientColors(withoutAngle);
  }
  return undefined;
}

/** Read stops from `data-gradient-colors="#a,#b"`. */
export function parseGradientColorsFromAttr(
  value: string | null | undefined,
): string[] | undefined {
  return normalizeGradientColors(value);
}
