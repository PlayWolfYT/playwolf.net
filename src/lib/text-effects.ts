/**
 * Bounded set of rich-text effects. One entry here plus one CSS rule in
 * `globals.css` (and its twin in the admin's `custom.scss`) is the whole cost
 * of adding another, and the toolbar can only ever offer what is listed.
 *
 * The editor stores the *key* on the text node under `TEXT_EFFECT_STATE_KEY`;
 * `css` is what the admin renders inline as a live preview, and `className` is
 * what the frontend converter emits instead.
 */

export const TEXT_EFFECT_STATE_KEY = "effect";

/**
 * Where Lexical parks node state in the serialized JSON. Exported so the
 * frontend converter reads the same place the editor writes to.
 */
export const NODE_STATE_KEY = "$";

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
} as const satisfies Record<string, TextEffectDefinition>;

export type TextEffect = keyof typeof TEXT_EFFECTS;

export function isTextEffect(value: unknown): value is TextEffect {
  return typeof value === "string" && value in TEXT_EFFECTS;
}

/** CSS class for a stored effect key, or `undefined` for anything unknown. */
export function textEffectClass(value: unknown): string | undefined {
  return isTextEffect(value) ? TEXT_EFFECTS[value].className : undefined;
}
