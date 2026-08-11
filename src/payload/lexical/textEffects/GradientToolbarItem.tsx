"use client";

import {
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { Blend } from "lucide-react";
import { useEffect, useId, useState, type MouseEvent } from "react";

import {
  DEFAULT_GRADIENT_COLORS,
  normalizeGradientColors,
} from "@/lib/text-effects";
import {
  closeGradientPanel,
  getGradientPanelSession,
  openGradientPanel,
  subscribeGradientPanel,
} from "@/payload/lexical/textEffects/gradientPanelStore";
import { readSelectionTextEffect } from "@/payload/lexical/textEffects/state";

type GradientToolbarItemProps = {
  active?: boolean;
  editor: LexicalEditor;
  enabled?: boolean;
};

function initialColors(current?: string[] | null): string[] {
  return normalizeGradientColors(current) ?? [...DEFAULT_GRADIENT_COLORS];
}

/**
 * Inline-toolbar toggle for the gradient text effect. The colour panel itself
 * is portaled from `TextEffectsPlugin` so it survives the floating toolbar
 * unmounting when inputs take focus.
 */
export function GradientToolbarItem({
  active,
  editor,
  enabled = true,
}: GradientToolbarItemProps) {
  const panelId = useId();
  const [open, setOpen] = useState(() => getGradientPanelSession() !== null);

  useEffect(() => subscribeGradientPanel((session) => setOpen(session !== null)), []);

  function togglePanel(event: MouseEvent<HTMLButtonElement>) {
    if (open) {
      closeGradientPanel();
      return;
    }

    const { effect, colors: current } = readSelectionTextEffect(editor);
    const selection = editor.read(() => {
      const sel = $getSelection();
      return $isRangeSelection(sel) ? sel.clone() : null;
    });
    const rect = event.currentTarget.getBoundingClientRect();

    openGradientPanel({
      editor,
      selection,
      colors: initialColors(current),
      active: effect === "gradient" || Boolean(active),
      anchor: {
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
        right: rect.right,
      },
    });
  }

  return (
    <div className="text-effects-gradient">
      <button
        type="button"
        className="text-effects-gradient__toggle"
        data-text-effects-gradient-toggle="true"
        title="Gradient"
        aria-label="Gradient"
        aria-pressed={Boolean(active) || open}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        disabled={!enabled}
        onMouseDown={(event) => {
          // Keep Lexical/native selection when opening the panel.
          event.preventDefault();
        }}
        onClick={togglePanel}
      >
        <Blend size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
