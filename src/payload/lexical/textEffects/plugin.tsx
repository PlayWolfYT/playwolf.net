"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getState, TextNode } from "lexical";
import { useEffect } from "react";

import { TEXT_EFFECT_STATE_KEY } from "@/lib/text-effects";
import { cssForEffect, textEffectsState } from "@/payload/lexical/textEffects/state";

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Mirrors Payload's TextStateFeature StatePlugin: push stored effect CSS onto
 * the text-node DOM for live preview. Gradient prefers custom stops when set.
 */
export function TextEffectsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerMutationListener(TextNode, (mutatedNodes) => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === "destroyed") continue;

          const node = $getNodeByKey(nodeKey);
          const dom = editor.getElementByKey(nodeKey);
          if (!node || !dom) continue;

          const effect = $getState(node, textEffectsState.effect);
          const colors = $getState(node, textEffectsState.gradientColors);

          if (!effect) {
            delete dom.dataset[TEXT_EFFECT_STATE_KEY];
            dom.style.cssText = "";
            continue;
          }

          dom.dataset[TEXT_EFFECT_STATE_KEY] = effect;
          const css = cssForEffect(effect, colors);
          const camel = Object.fromEntries(
            Object.entries(css).map(([key, value]) => [kebabToCamelCase(key), value]),
          );
          dom.style.cssText = "";
          Object.assign(dom.style, camel);
        }
      });
    });
  }, [editor]);

  return null;
}
