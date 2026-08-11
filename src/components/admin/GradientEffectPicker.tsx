"use client";

import { Blend } from "lucide-react";
import { useId, useState } from "react";

import {
  DEFAULT_GRADIENT_COLORS,
  HEX_COLOR,
  normalizeGradientColors,
} from "@/lib/text-effects";

type GradientEffectPickerProps = {
  active: boolean;
  disabled?: boolean;
  /** Colours currently on the selection, if any. */
  currentColors?: string[] | null;
  onApply: (colors: string[]) => void;
  onClear: () => void;
};

function initialColors(currentColors?: string[] | null): string[] {
  return normalizeGradientColors(currentColors) ?? [...DEFAULT_GRADIENT_COLORS];
}

/**
 * Toolbar control for the custom gradient text effect — opens a small panel
 * to pick 2–8 hex stops, then applies them to the current TipTap selection.
 */
export function GradientEffectPicker({
  active,
  disabled,
  currentColors,
  onApply,
  onClear,
}: GradientEffectPickerProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<string[]>(() => initialColors(currentColors));

  function openPanel() {
    setColors(initialColors(currentColors));
    setOpen(true);
  }

  function updateColor(index: number, value: string) {
    setColors((prev) => prev.map((entry, i) => (i === index ? value : entry)));
  }

  function addStop() {
    setColors((prev) => (prev.length >= 8 ? prev : [...prev, "#ffffff"]));
  }

  function removeStop(index: number) {
    setColors((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  const valid = normalizeGradientColors(colors);

  return (
    <div className="relative">
      <button
        type="button"
        title="Gradient"
        aria-label="Gradient"
        aria-pressed={active}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm transition ${
          active || open
            ? "bg-sky-100 text-sky-800"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Blend className="h-4 w-4" />
      </button>

      {open ? (
        <div
          id={panelId}
<<<<<<< HEAD
          // Keep TipTap selection when clicking buttons; allow inputs to focus.
          onMouseDown={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, label")) return;
            event.preventDefault();
          }}
=======
>>>>>>> origin/main
          className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg"
        >
          <p className="text-xs font-medium text-zinc-800">Gradient colours</p>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-zinc-500">
            Pick at least two stops. Applied to the selected text.
          </p>

          <div
            className="mt-2 h-6 w-full rounded-md border border-zinc-200"
            style={{
              backgroundImage: `linear-gradient(90deg, ${(valid ?? colors).join(", ")})`,
            }}
            aria-hidden
          />

          <ul className="mt-2 flex flex-col gap-1.5">
            {colors.map((color, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={HEX_COLOR.test(color) ? color : "#ffffff"}
                  onChange={(event) => updateColor(index, event.target.value)}
                  className="h-8 w-9 shrink-0 cursor-pointer rounded border border-zinc-300 bg-white"
                  aria-label={`Stop ${index + 1} swatch`}
                />
                <input
                  type="text"
                  value={color}
                  onChange={(event) => updateColor(index, event.target.value)}
                  spellCheck={false}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 font-mono text-xs text-zinc-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeStop(index)}
                  disabled={colors.length <= 2}
                  className="shrink-0 rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-30"
                  aria-label={`Remove stop ${index + 1}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={addStop}
              disabled={colors.length >= 8}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
            >
              Add colour
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => {
                if (!valid) return;
                onApply(valid);
                setOpen(false);
              }}
              className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-40"
            >
              Apply
            </button>
            {active ? (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
