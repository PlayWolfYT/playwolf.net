import { Mark, mergeAttributes } from "@tiptap/core";

import { TEXT_EFFECTS, isTextEffect, type TextEffect } from "@/lib/text-effects";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textEffect: {
      setTextEffect: (effect: TextEffect) => ReturnType;
      unsetTextEffect: () => ReturnType;
      toggleTextEffect: (effect: TextEffect) => ReturnType;
    };
  }
}

/**
 * TipTap mark that maps onto Payload's TextStateFeature `effect` keys via
 * the public `fx-*` class names. Round-trips through `lexical-html.ts`.
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
        renderHTML: (attributes) => {
          if (!isTextEffect(attributes.effect)) return {};
          return { class: TEXT_EFFECTS[attributes.effect].className };
        },
      },
    };
  },

  parseHTML() {
    return Object.values(TEXT_EFFECTS).map((effect) => ({
      tag: `span[class*="${effect.className}"]`,
      getAttrs: (el) => {
        if (typeof el === "string") return false;
        const className = el.getAttribute("class") ?? "";
        return className.split(/\s+/).includes(effect.className) ? null : false;
      },
    }));
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextEffect:
        (effect) =>
        ({ commands }) =>
          commands.setMark(this.name, { effect }),
      unsetTextEffect:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
      toggleTextEffect:
        (effect) =>
        ({ commands, editor }) => {
          const current = editor.getAttributes(this.name).effect;
          if (current === effect) return commands.unsetMark(this.name);
          return commands.setMark(this.name, { effect });
        },
    };
  },
});
