"use client";

import { $isRangeSelection } from "lexical";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import {
  DEFAULT_GRADIENT_COLORS,
  HEX_COLOR,
  normalizeGradientColors,
} from "@/lib/text-effects";
import {
  closeGradientPanel,
  subscribeGradientPanel,
  updateGradientPanelColors,
  type GradientPanelSession,
} from "@/payload/lexical/textEffects/gradientPanelStore";
import {
  applyGradientColors,
  clearTextEffect,
} from "@/payload/lexical/textEffects/state";

/**
 * Portaled gradient colour panel. Hosted by `TextEffectsPlugin` (always
 * mounted) so focusing hex/swatch inputs — which collapses the native
 * selection and unmounts the floating toolbar — does not close the picker.
 */
export function GradientPanel() {
  const panelId = useId();
  const [session, setSession] = useState<GradientPanelSession | null>(null);

  useEffect(() => subscribeGradientPanel(setSession), []);

  useEffect(() => {
    if (!session) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeGradientPanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session]);

  if (!session || typeof document === "undefined") return null;

  const { colors, active, editor, selection, anchor } = session;
  const valid = normalizeGradientColors(colors);
  const selectionSnapshot =
    selection && $isRangeSelection(selection) ? selection : null;

  const style: CSSProperties = anchor
    ? {
        position: "fixed",
        left: Math.min(anchor.left, window.innerWidth - 276),
        top: Math.max(8, anchor.top - 8),
        transform: "translateY(-100%)",
      }
    : {
        position: "fixed",
        left: "50%",
        top: "30%",
        transform: "translateX(-50%)",
      };

  return createPortal(
    <div
      id={panelId}
      className="text-effects-gradient__panel text-effects-gradient__panel--portal"
      style={style}
      role="dialog"
      aria-label="Gradient colours"
      onMouseDown={(event) => {
        // Don't let mousedown bubble into the editor document.
        event.stopPropagation();
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
                updateGradientPanelColors(
                  colors.map((entry, i) =>
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
                updateGradientPanelColors(
                  colors.map((entry, i) =>
                    i === index ? event.target.value : entry,
                  ),
                )
              }
              aria-label={`Stop ${index + 1} hex`}
            />
            <button
              type="button"
              onClick={() =>
                updateGradientPanelColors(
                  colors.length <= 2
                    ? colors
                    : colors.filter((_, i) => i !== index),
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
            updateGradientPanelColors(
              colors.length >= 8
                ? colors
                : [...colors, DEFAULT_GRADIENT_COLORS[0] ?? "#ffffff"],
            )
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
            applyGradientColors(editor, valid, selectionSnapshot);
            closeGradientPanel();
          }}
        >
          Apply
        </button>
        {active ? (
          <button
            type="button"
            className="text-effects-gradient__clear"
            onClick={() => {
              clearTextEffect(editor, selectionSnapshot);
              closeGradientPanel();
            }}
          >
            Clear
          </button>
        ) : null}
        <button type="button" onClick={() => closeGradientPanel()}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
