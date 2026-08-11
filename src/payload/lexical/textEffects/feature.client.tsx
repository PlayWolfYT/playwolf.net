"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import type { BaseSelection, LexicalEditor } from "lexical";

import { TEXT_EFFECTS, type TextEffect } from "@/lib/text-effects";
import { GradientToolbarItem } from "@/payload/lexical/textEffects/GradientToolbarItem";
import { TextEffectsPlugin } from "@/payload/lexical/textEffects/plugin";
import {
  FIXED_TEXT_EFFECTS,
  clearTextEffect,
  cssForEffect,
  effectFromSelection,
  setTextEffect,
} from "@/payload/lexical/textEffects/state";

function EffectSwatch({ effect }: { effect?: TextEffect }) {
  const css = cssForEffect(effect);
  const style = Object.fromEntries(
    Object.entries(css).map(([key, value]) => [
      key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
      value,
    ]),
  );

  return (
    <span
      style={{
        ...style,
        alignItems: "center",
        borderRadius: 4,
        display: "flex",
        fontSize: 16,
        height: 20,
        justifyContent: "center",
        width: 20,
      }}
    >
      A
    </span>
  );
}

function toolbarGroups() {
  const effectItems = FIXED_TEXT_EFFECTS.map((effect) => ({
    ChildComponent: () => <EffectSwatch effect={effect} />,
    key: effect,
    label: TEXT_EFFECTS[effect].label,
    isActive: ({ selection }: { selection: BaseSelection }) =>
      effectFromSelection(selection).effect === effect,
    onSelect: ({ editor }: { editor: LexicalEditor }) => setTextEffect(editor, effect),
  }));

  return [
    {
      type: "dropdown" as const,
      ChildComponent: () => <EffectSwatch />,
      key: "textEffects",
      order: 30,
      items: [
        {
          ChildComponent: () => <EffectSwatch />,
          key: "clear-text-effect",
          label: "Default style",
          order: 1,
          onSelect: ({ editor }: { editor: LexicalEditor }) => clearTextEffect(editor),
        },
        ...effectItems,
      ],
    },
    {
      type: "buttons" as const,
      key: "textEffectsGradient",
      order: 31,
      items: [
        {
          key: "gradient",
          label: "Gradient",
          isActive: ({ selection }: { selection: BaseSelection }) =>
            effectFromSelection(selection).effect === "gradient",
          Component: ({
            active,
            editor,
            enabled,
          }: {
            active?: boolean;
            editor: LexicalEditor;
            enabled?: boolean;
          }) => (
            <GradientToolbarItem active={active} editor={editor} enabled={enabled} />
          ),
        },
      ],
    },
  ];
}

export const TextEffectsFeatureClient = createClientFeature(() => {
  const groups = toolbarGroups();
  return {
    plugins: [
      {
        Component: TextEffectsPlugin,
        position: "normal",
      },
    ],
    toolbarFixed: { groups },
    toolbarInline: { groups },
  };
});
