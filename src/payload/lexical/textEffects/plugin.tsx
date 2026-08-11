"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, $getState, TextNode } from "lexical";
import { useEffect, useId, useState } from "react";

import { TEXT_EFFECT_STATE_KEY } from "@/lib/text-effects";
import { GradientPanel } from "@/payload/lexical/textEffects/GradientPanel";
import { cssForEffect, textEffectsState } from "@/payload/lexical/textEffects/state";

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** Only one Lexical field should portal the gradient dialog. */
const gradientPanelHosts = new Set<string>();
const gradientPanelHostListeners = new Set<() => void>();

function primaryGradientPanelHost(): string | undefined {
  return gradientPanelHosts.values().next().value;
}

/**
 * Mirrors Payload's TextStateFeature StatePlugin: push stored effect CSS onto
 * the text-node DOM for live preview. Gradient prefers custom stops when set.
 *
 * Also hosts the portaled gradient colour panel (once per page) so it survives
 * floating-toolbar unmount when picker inputs take focus.
 */
export function TextEffectsPlugin() {
  const [editor] = useLexicalComposerContext();
  const hostId = useId();
  const [isPanelHost, setIsPanelHost] = useState(false);

  useEffect(() => {
    gradientPanelHosts.add(hostId);
    const sync = () => setIsPanelHost(primaryGradientPanelHost() === hostId);
    gradientPanelHostListeners.add(sync);
    sync();
    for (const listener of gradientPanelHostListeners) listener();
    return () => {
      gradientPanelHosts.delete(hostId);
      gradientPanelHostListeners.delete(sync);
      for (const listener of gradientPanelHostListeners) listener();
    };
  }, [hostId]);

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

  return isPanelHost ? <GradientPanel /> : null;
}
