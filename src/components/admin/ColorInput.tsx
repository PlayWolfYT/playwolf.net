"use client";

import { useId, useState } from "react";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * A hex text input paired with a native colour swatch. Simpler than the
 * Payload admin's `react-colorful` picker — this is a small ancillary field
 * (accent colours, gradient stops), not worth a client bundle for a picker
 * widget when `<input type="color">` already does the job.
 */
export function ColorInput({
  name,
  defaultValue,
  value: controlled,
  onChange,
  label,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (next: string) => void;
  label?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(
    defaultValue && HEX.test(defaultValue) ? defaultValue : "#3abef9",
  );
  const value = controlled ?? uncontrolled;
  const setValue = (next: string) => {
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
  };
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="font-display text-xs font-medium uppercase tracking-[0.14em] text-parchment-muted"
        >
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#3abef9"}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-white/10 bg-void-lift"
          aria-label={label ? `${label} swatch` : "Colour swatch"}
        />
        <input
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="#3abef9"
          spellCheck={false}
          className="w-full rounded-lg border border-white/10 bg-void-lift/70 px-3 py-2 font-mono text-sm text-parchment outline-none focus:border-glow-500/60 focus:ring-1 focus:ring-glow-500/40"
        />
      </div>
    </div>
  );
}
