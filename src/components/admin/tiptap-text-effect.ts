import { Mark, mergeAttributes } from "@tiptap/core";

import {
  DEFAULT_GRADIENT_COLORS,
  TEXT_EFFECTS,
  gradientTextStyle,
  isTextEffect,
  normalizeGradientColors,
  parseGradientColorsFromAttr,
  parseGradientColorsFromStyle,
  type TextEffect,
} from "@/lib/text-effects";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textEffect: {
      setTextEffect: (effect: TextEffect, colors?: string[]) => ReturnType;
      unsetTextEffect: () => ReturnType;
      toggleTextEffect: (effect: TextEffect, colors?: string[]) => ReturnType;
    };
  }
}

function effectDomAttrs(
  effect: unknown,
  colors: unknown,
): Record<string, string> | null {
  if (!isTextEffect(effect)) return null;

  const attrs: Record<string, string> = {
    class: TEXT_EFFECTS[effect].className,
  };

  if (effect === "gradient") {
    const stops = normalizeGradientColors(colors) ?? [...DEFAULT_GRADIENT_COLORS];
    // Full inline CSS so the editor paints without CSS-variable fallbacks.
    attrs.style = gradientTextStyle(stops);
    attrs["data-gradient-colors"] = stops.join(",");
  }

  return attrs;
}

/**
 * TipTap mark that maps onto Payload's TextStateFeature `effect` keys via
 * the public `fx-*` class names. The `gradient` effect also carries colour
 * stops (`colors`) as full inline gradient CSS + data attribute for round-trips.
 *
 * Important: TipTap only puts an attribute into `HTMLAttributes` when that
 * attribute's own `renderHTML` returns keys. Reading `effect`/`colors` from
 * `HTMLAttributes` in the mark `renderHTML` therefore always missed — emit
 * the DOM attrs from the attribute `renderHTML` (or from `mark.attrs`).
 */
export const TextEffectMark = Mark.create({
  name: "textEffect",
  excludes: "textEffect",
  inclusive: true,

  addAttributes() {
    return {
      effect: {
        default: null,
        parseHTML: (element) => {
          const className = element.getAttribute("class") ?? "";
          const classes = className.split(/\s+/);
          for (const [key, def] of Object.entries(TEXT_EFFECTS)) {
            if (classes.includes(def.className)) return key;
          }
          return null;
        },
        // Emit class/style here so TipTap includes them in HTMLAttributes.
        renderHTML: (attributes) =>
          effectDomAttrs(attributes.effect, attributes.colors) ?? {},
      },
      colors: {
        default: null,
        parseHTML: (element) =>
          parseGradientColorsFromAttr(element.getAttribute("data-gradient-colors")) ??
          parseGradientColorsFromStyle(element.getAttribute("style")) ??
          null,
        // Handled together with `effect` above.
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return Object.values(TEXT_EFFECTS).map((effect) => ({
      tag: `span[class*="${effect.className}"]`,
      getAttrs: (el) => {
        if (typeof el === "string") return false;
        const className = el.getAttribute("class") ?? "";
        if (!className.split(/\s+/).includes(effect.className)) return false;
        return null;
      },
    }));
  },

  renderHTML({ mark, HTMLAttributes }) {
    // Prefer mark.attrs in case TipTap versions differ on HTMLAttributes merge.
    const fromMark = effectDomAttrs(mark.attrs.effect, mark.attrs.colors);
    const {
      effect: _e,
      colors: _c,
      ...rest
    } = HTMLAttributes as Record<string, unknown>;
    void _e;
    void _c;

    return ["span", mergeAttributes(rest, fromMark ?? {}), 0];
  },

  addCommands() {
    return {
      setTextEffect:
        (effect, colors) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            effect,
            colors:
              effect === "gradient"
                ? (normalizeGradientColors(colors) ?? [...DEFAULT_GRADIENT_COLORS])
                : null,
          }),
      unsetTextEffect:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
      toggleTextEffect:
        (effect, colors) =>
        ({ commands, editor }) => {
          const current = editor.getAttributes(this.name);
          if (current.effect === effect && effect !== "gradient") {
            return commands.unsetMark(this.name);
          }
          if (
            current.effect === "gradient" &&
            effect === "gradient" &&
            !colors &&
            editor.isActive(this.name, { effect: "gradient" })
          ) {
            // Plain toggle without new colours removes the mark.
            return commands.unsetMark(this.name);
          }
          return commands.setMark(this.name, {
            effect,
            colors:
              effect === "gradient"
                ? (normalizeGradientColors(colors) ??
                  normalizeGradientColors(current.colors) ?? [
                    ...DEFAULT_GRADIENT_COLORS,
                  ])
                : null,
          });
        },
    };
  },
});
