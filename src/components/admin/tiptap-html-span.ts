import { Mark, mergeAttributes } from "@tiptap/core";

import { TEXT_EFFECTS } from "@/lib/text-effects";

const EFFECT_CLASSES = new Set<string>(
  Object.values(TEXT_EFFECTS).map((effect) => effect.className),
);

function nonEffectClasses(className: string | null): string | null {
  if (!className) return null;
  const kept = className
    .split(/\s+/)
    .filter((entry) => entry && !EFFECT_CLASSES.has(entry));
  return kept.length > 0 ? kept.join(" ") : null;
}

/**
 * Preserves arbitrary `<span class="…">` / `style` wrappers that aren't one
 * of the bounded text effects — "HTML shenanigans" that still round-trip
 * through the Lexical bridge via `$htmlClass` / `$htmlStyle`.
 */
export const HtmlSpanMark = Mark.create({
  name: "htmlSpan",
  excludes: "",
  inclusive: true,
  priority: 50,

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => nonEffectClasses(element.getAttribute("class")),
        renderHTML: (attributes) =>
          attributes.class ? { class: attributes.class } : {},
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) =>
          attributes.style ? { style: attributes.style } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (el) => {
          if (typeof el === "string") return false;
          const className = nonEffectClasses(el.getAttribute("class"));
          const style = el.getAttribute("style");
          // Effect-only spans are handled by TextEffectMark.
          if (!className && !style) return false;
          // If the span also carries an effect class, still capture extras.
          return { class: className, style };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
