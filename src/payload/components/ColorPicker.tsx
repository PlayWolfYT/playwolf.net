"use client";

import { FieldLabel, useField } from "@payloadcms/ui";
import { HexColorPicker } from "react-colorful";
import { useId } from "react";
import type { TextFieldClientComponent } from "payload";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Accent colour input. The stored value is a plain hex string because that is
 * what `accentVars()` in `src/lib/accent.ts` expands into the five-step glow
 * ramp — the swatch row below previews that ramp so a colour can be judged
 * against the theme it actually produces.
 */
export const ColorPicker: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { setValue, value } = useField<string>({ path });
  const inputId = useId();

  const current = typeof value === "string" ? value : "";
  const valid = HEX.test(current);

  return (
    <div className="field-type color-picker">
      <FieldLabel label={field?.label} localized={field?.localized} path={path} />

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {readOnly ? null : (
          <HexColorPicker
            color={valid ? current : "#3abef9"}
            onChange={(next) => setValue(next)}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            disabled={readOnly}
            id={inputId}
            onChange={(event) => setValue(event.target.value)}
            placeholder="#3abef9"
            spellCheck={false}
            style={{ fontFamily: "monospace", maxWidth: 160 }}
            type="text"
            value={current}
          />
          <div style={{ display: "flex", gap: "4px" }}>
            {[0.4, 0.2, 0, -0.14, -0.32].map((step) => (
              <span
                key={step}
                style={{
                  background: valid ? current : "transparent",
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "3px",
                  display: "block",
                  filter: valid
                    ? `brightness(${(1 + step).toFixed(2)}) saturate(${step > 0 ? 0.85 : 1})`
                    : undefined,
                  height: 22,
                  width: 22,
                }}
              />
            ))}
          </div>
          {current && !valid ? (
            <p className="field-error">Enter a hex colour such as #3abef9.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
