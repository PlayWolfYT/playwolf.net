"use client";

import type { LexicalEditor } from "lexical";
import { Blend } from "lucide-react";
import { useId, useState } from "react";

import {
  DEFAULT_GRADIENT_COLORS,
  HEX_COLOR,
  normalizeGradientColors,
} from "@/lib/text-effects";
import {
  applyGradientColors,
  clearTextEffect,
  readSelectionTextEffect,
} from "@/payload/lexical/textEffects/state";

type GradientToolbarItemProps = {
  active?: boolean;
  editor: LexicalEditor;
  enabled?: boolean;
};

function initialColors(current?: string[] | null): string[] {
  return normalizeGradientColors(current) ?? [...DEFAULT_GRADIENT_COLORS];
}

/**
 * Inline-toolbar control for the custom gradient text effect — pick 2–8 hex
 * stops and apply them to the Lexical selection (stores `$effect`,
 * `$gradientColors`, and full inline CSS on `style`).
 */
export function GradientToolbarItem({
  active,
  editor,
  enabled = true,
}: GradientToolbarItemProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<string[]>(() => [...DEFAULT_GRADIENT_COLORS]);

  function togglePanel() {
    if (open) {
      setOpen(false);
      return;
    }
    const { colors: current } = readSelectionTextEffect(editor);
    setColors(initialColors(current));
    setOpen(true);
  }

  const valid = normalizeGradientColors(colors);

  return (
    <div className="text-effects-gradient">
      <button
        type="button"
        className="text-effects-gradient__toggle"
        title="Gradient"
        aria-label="Gradient"
        aria-pressed={Boolean(active)}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={!enabled}
        onClick={togglePanel}
      >
        <Blend size={16} strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          className="text-effects-gradient__panel"
          onMouseDown={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, label")) return;
            // Keep Lexical selection when clicking panel chrome / buttons.
            event.preventDefault();
          }}
        >
          <p className="text-effects-gradient__title">Gradient colours</p>
          <p className="text-effects-gradient__hint">
            Pick at least two stops. Applied to the selected text.
          </p>

          <div
            className="text-effects-gradient__preview"
            style={{
              backgroundImage: `linear-gradient(90deg, ${(valid ?? colors).join(", ")})`,
            }}
            aria-hidden
          />

          <ul className="text-effects-gradient__stops">
            {colors.map((color, index) => (
              <li key={index} className="text-effects-gradient__stop">
                <input
                  type="color"
                  value={HEX_COLOR.test(color) ? color : "#ffffff"}
                  onChange={(event) =>
                    setColors((prev) =>
                      prev.map((entry, i) =>
                        i === index ? event.target.value : entry,
                      ),
                    )
                  }
                  aria-label={`Stop ${index + 1} swatch`}
                />
                <input
                  type="text"
                  value={color}
                  spellCheck={false}
                  onChange={(event) =>
                    setColors((prev) =>
                      prev.map((entry, i) =>
                        i === index ? event.target.value : entry,
                      ),
                    )
                  }
                  aria-label={`Stop ${index + 1} hex`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setColors((prev) =>
                      prev.length <= 2 ? prev : prev.filter((_, i) => i !== index),
                    )
                  }
                  disabled={colors.length <= 2}
                  aria-label={`Remove stop ${index + 1}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="text-effects-gradient__actions">
            <button
              type="button"
              onClick={() =>
                setColors((prev) => (prev.length >= 8 ? prev : [...prev, "#ffffff"]))
              }
              disabled={colors.length >= 8}
            >
              Add colour
            </button>
            <button
              type="button"
              className="text-effects-gradient__apply"
              disabled={!valid}
              onClick={() => {
                if (!valid) return;
                applyGradientColors(editor, valid);
                setOpen(false);
              }}
            >
              Apply
            </button>
            {active ? (
              <button
                type="button"
                className="text-effects-gradient__clear"
                onClick={() => {
                  clearTextEffect(editor);
                  setOpen(false);
                }}
              >
                Clear
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
