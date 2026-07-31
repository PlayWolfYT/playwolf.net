"use client";

import { FieldLabel, useField } from "@payloadcms/ui";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { TextFieldClientComponent } from "payload";

const RESULT_LIMIT = 90;

/**
 * Searchable lucide picker. `iconNames` ships with the package and is derived
 * from it, so the catalogue grows on every lucide bump with nothing to
 * maintain here. The stored value is the kebab-case name, which is exactly
 * what `<DynamicIcon name>` takes on the frontend.
 */
export const IconPicker: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { setValue, value } = useField<string>({ path });
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const searchId = useId();

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const matches = needle
      ? iconNames.filter((name) => name.includes(needle))
      : iconNames;
    return matches.slice(0, RESULT_LIMIT);
  }, [deferredQuery]);

  const selected =
    value && iconNames.includes(value as IconName) ? (value as IconName) : null;

  return (
    <div className="field-type icon-picker">
      <FieldLabel label={field?.label} localized={field?.localized} path={path} />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          aria-hidden
          style={{
            alignItems: "center",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            display: "flex",
            height: 34,
            justifyContent: "center",
            width: 34,
          }}
        >
          {selected ? <DynamicIcon name={selected} size={20} /> : null}
        </span>
        <input
          aria-describedby={searchId}
          disabled={readOnly}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={selected ?? "Search icons…"}
          style={{ flex: 1 }}
          type="search"
          value={query}
        />
        {selected ? (
          <button
            className="btn btn--style-secondary btn--size-small"
            disabled={readOnly}
            onClick={() => setValue(null)}
            style={{ margin: 0 }}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="field-description" id={searchId}>
        {selected ? `Selected: ${selected}` : "No icon selected."}
      </p>

      <div
        style={{
          border: "1px solid var(--theme-elevation-100)",
          borderRadius: "4px",
          display: "grid",
          gap: "2px",
          gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))",
          maxHeight: 220,
          overflowY: "auto",
          padding: "4px",
        }}
      >
        {results.map((name) => (
          <button
            aria-label={name}
            aria-pressed={name === selected}
            disabled={readOnly}
            key={name}
            onClick={() => setValue(name)}
            style={{
              alignItems: "center",
              background:
                name === selected ? "var(--theme-elevation-150)" : "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: readOnly ? "default" : "pointer",
              display: "flex",
              justifyContent: "center",
              padding: "8px 0",
            }}
            title={name}
            type="button"
          >
            <DynamicIcon name={name} size={18} />
          </button>
        ))}
        {results.length === 0 ? (
          <p style={{ gridColumn: "1 / -1", margin: 0, padding: "0.5rem" }}>
            No icons match “{deferredQuery}”.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default IconPicker;
