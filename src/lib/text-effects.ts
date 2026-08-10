/**
 * Bounded set of rich-text effects. One entry here plus one CSS rule in
 * `globals.css` is the whole cost of adding another fixed effect.
 *
 * The editor stores the *key* on the text node under `TEXT_EFFECT_STATE_KEY`;
 * `css` is what Payload's TextStateFeature uses as a live preview, and
 * `className` is what the frontend converter emits. The `gradient` effect
 * additionally stores colour stops under `GRADIENT_COLORS_STATE_KEY`.
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
  gradient: {
    label: "Gradient",
    className: "fx-gradient",
    css: {
      "background-image": `linear-gradient(90deg, var(--fx-gradient-stops, ${DEFAULT_GRADIENT_COLORS.join(", ")}))`,
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

/** Inline style assigning the CSS variable consumed by `.fx-gradient`. */
export function gradientStopsStyle(colors: string[]): string {
  return `--fx-gradient-stops: ${colors.join(", ")}`;
}

/** Read stops from an inline style that sets `--fx-gradient-stops`. */
export function parseGradientColorsFromStyle(
  style: string | null | undefined,
): string[] | undefined {
  if (!style) return undefined;
  const match = /--fx-gradient-stops\s*:\s*([^;]+)/i.exec(style);
  return match ? normalizeGradientColors(match[1]) : undefined;
}

/** Read stops from `data-gradient-colors="#a,#b"`. */
export function parseGradientColorsFromAttr(
  value: string | null | undefined,
): string[] | undefined {
  return normalizeGradientColors(value);
}
