import { $forEachSelectedTextNode } from "@lexical/selection";
import {
  $getSelection,
  $getState,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  $setState,
  createState,
  type BaseSelection,
  type LexicalEditor,
  type StateConfig,
  TextNode,
} from "lexical";

import {
  GRADIENT_COLORS_STATE_KEY,
  TEXT_EFFECT_STATE_KEY,
  TEXT_EFFECTS,
  gradientTextStyle,
  isTextEffect,
  normalizeGradientColors,
  type TextEffect,
} from "@/lib/text-effects";

export const FIXED_TEXT_EFFECTS = [
  "rainbow",
  "shake",
  "glow",
  "shimmer",
  "float",
  "pulse",
] as const satisfies readonly TextEffect[];

export type FixedTextEffect = (typeof FIXED_TEXT_EFFECTS)[number];

const effectState = createState(TEXT_EFFECT_STATE_KEY, {
  parse: (value) => (isTextEffect(value) ? value : undefined),
});

const gradientColorsState = createState(GRADIENT_COLORS_STATE_KEY, {
  parse: (value) => normalizeGradientColors(value),
  unparse: (value) => value,
  isEqual: (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.every((color, index) => color === b[index]);
  },
});

export type TextEffectsState = {
  effect: StateConfig<typeof TEXT_EFFECT_STATE_KEY, TextEffect | undefined>;
  gradientColors: StateConfig<typeof GRADIENT_COLORS_STATE_KEY, string[] | undefined>;
};

export const textEffectsState: TextEffectsState = {
  effect: effectState,
  gradientColors: gradientColorsState,
};

function $applyEffectToNode(
  textNode: TextNode,
  effect: TextEffect | undefined,
  colors?: string[] | undefined,
) {
  $setState(textNode, effectState, effect);
  if (effect === "gradient") {
    const stops = normalizeGradientColors(colors) ?? undefined;
    $setState(textNode, gradientColorsState, stops);
    textNode.setStyle(stops ? gradientTextStyle(stops) : "");
    return;
  }

  $setState(textNode, gradientColorsState, undefined);
  textNode.setStyle("");
}

export function setTextEffect(
  editor: LexicalEditor,
  effect: TextEffect | undefined,
  colors?: string[],
  /**
   * Optional selection snapshot. Used by the portaled gradient panel after
   * focusing inputs has collapsed the live native/Lexical selection.
   */
  selection?: BaseSelection | null,
) {
  editor.update(() => {
    if (selection && $isRangeSelection(selection)) {
      $setSelection(selection.clone());
    }
    $forEachSelectedTextNode((textNode) => {
      $applyEffectToNode(textNode, effect, colors);
    });
  });
}

export function clearTextEffect(
  editor: LexicalEditor,
  selection?: BaseSelection | null,
) {
  setTextEffect(editor, undefined, undefined, selection);
}

export function applyGradientColors(
  editor: LexicalEditor,
  colors: string[],
  selection?: BaseSelection | null,
) {
  const stops = normalizeGradientColors(colors);
  if (!stops) return;
  setTextEffect(editor, "gradient", stops, selection);
}

/**
 * Read effect / gradient stops from a selection already active in a Lexical
 * read/update callback (e.g. toolbar `isActive`). Do not wrap this in
 * `editorState.read` — Payload already provides the selection in that context.
 */
export function effectFromSelection(selection: BaseSelection | null | undefined): {
  effect: TextEffect | undefined;
  colors: string[] | undefined;
} {
  if (!$isRangeSelection(selection)) {
    return { effect: undefined, colors: undefined };
  }

  for (const node of selection.getNodes()) {
    if (!$isTextNode(node)) continue;
    return {
      effect: $getState(node, effectState),
      colors: $getState(node, gradientColorsState),
    };
  }

  return { effect: undefined, colors: undefined };
}

/** Read effect / gradient stops from the current editor selection. */
export function readSelectionTextEffect(editor: LexicalEditor): {
  effect: TextEffect | undefined;
  colors: string[] | undefined;
} {
  return editor.read(() => effectFromSelection($getSelection()));
}

export function cssForEffect(
  effect: TextEffect | undefined,
  colors?: string[] | undefined,
): Record<string, string> {
  if (!effect) return {};
  if (effect === "gradient") {
    const stops = normalizeGradientColors(colors);
    if (stops) {
      return {
        "background-image": `linear-gradient(90deg, ${stops.join(", ")})`,
        "-webkit-background-clip": "text",
        "background-clip": "text",
        color: "transparent",
      };
    }
  }
  return { ...TEXT_EFFECTS[effect].css };
}
