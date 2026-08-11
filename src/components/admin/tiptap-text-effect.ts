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

/**
 * TipTap mark that maps onto Payload's TextStateFeature `effect` keys via
 * the public `fx-*` class names. The `gradient` effect also carries colour
 * stops (`colors`) as full inline gradient CSS + data attribute for round-trips.
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
        renderHTML: () => ({}),
      },
      colors: {
        default: null,
        parseHTML: (element) =>
          parseGradientColorsFromAttr(element.getAttribute("data-gradient-colors")) ??
          parseGradientColorsFromStyle(element.getAttribute("style")) ??
          null,
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

  renderHTML({ HTMLAttributes }) {
    const effect = HTMLAttributes.effect as TextEffect | null;
    if (!isTextEffect(effect)) {
      return ["span", mergeAttributes(HTMLAttributes), 0];
    }

    const attrs: Record<string, string> = {
      class: TEXT_EFFECTS[effect].className,
    };

    if (effect === "gradient") {
      const colors = normalizeGradientColors(HTMLAttributes.colors) ?? [
        ...DEFAULT_GRADIENT_COLORS,
      ];
      // Full inline CSS so the editor paints without CSS-variable fallbacks.
      attrs.style = gradientTextStyle(colors);
      attrs["data-gradient-colors"] = colors.join(",");
    }

    // Drop TipTap's raw attribute names from the DOM output.
    const {
      effect: _e,
      colors: _c,
      ...rest
    } = HTMLAttributes as Record<string, unknown>;
    void _e;
    void _c;

    return ["span", mergeAttributes(rest, attrs), 0];
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
