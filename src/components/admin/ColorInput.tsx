"use client";

import { useId, useState } from "react";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * A hex text input paired with a native colour swatch.
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
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-800">
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#3abef9"}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-zinc-300 bg-white"
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
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
    </div>
  );
}
