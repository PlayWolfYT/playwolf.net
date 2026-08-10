"use client";

import { useMemo, useState } from "react";

export type RelationshipOption = {
  /** Encodes the stored value — a bare id for a single-collection field, or `relationTo:id` for a polymorphic one. */
  value: string;
  label: string;
  hint?: string;
};

/**
 * A search-select over a small preloaded option list. The admin's datasets
 * (characters, artists, friends, tags) are all a handful to a few dozen
 * documents, so the whole list is fetched once by the page (a server
 * component) and filtered here client-side — no per-keystroke round trip to
 * search.
 */
export function RelationshipPicker({
  name,
  label,
  options,
  defaultValue = [],
  value,
  onChange,
  multiple = false,
  placeholder = "Search…",
  description,
  polymorphic = false,
}: {
  name?: string;
  label?: string;
  options: RelationshipOption[];
  defaultValue?: string[];
  /** Controlled selection — preferred by the schema-driven form. */
  value?: string[];
  onChange?: (next: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  description?: string;
  /**
   * When the option value is `relationTo:id` (see `listFeaturingOptions`),
   * encode the hidden input as `{ relationTo, value }[]` instead of a bare
   * value list — the shape `parsePolymorphicList` expects.
   */
  polymorphic?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
  const selected = value ?? uncontrolled;
  const setSelected = (next: string[] | ((prev: string[]) => string[])) => {
    const resolved = typeof next === "function" ? next(selected) : next;
    if (value === undefined) setUncontrolled(resolved);
    onChange?.(resolved);
  };
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const encoded = polymorphic
    ? JSON.stringify(
        selected.flatMap((entry) => {
          const [relationTo, rawId] = entry.split(":");
          const id = Number(rawId);
          return relationTo && Number.isFinite(id) ? [{ relationTo, value: id }] : [];
        }),
      )
    : JSON.stringify(selected);

  const byValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? options.filter((option) => option.label.toLowerCase().includes(q))
      : options;
    return pool.filter((option) => !selected.includes(option.value)).slice(0, 30);
  }, [options, query, selected]);

  function add(entry: string) {
    setSelected((prev) => (multiple ? [...prev, entry] : [entry]));
    setQuery("");
    setOpen(false);
  }

  function remove(entry: string) {
    setSelected((prev) => prev.filter((item) => item !== entry));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="font-display text-xs font-medium uppercase tracking-[0.14em] text-parchment-muted">
          {label}
        </span>
      ) : null}

      {name ? <input type="hidden" name={name} value={encoded} /> : null}

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <li
              key={value}
              className="flex items-center gap-1.5 rounded-full border border-glow-500/30 bg-glow-500/10 px-2.5 py-1 text-xs text-glow-300"
            >
              {byValue.get(value)?.label ?? value}
              <button
                type="button"
                onClick={() => remove(value)}
                aria-label={`Remove ${byValue.get(value)?.label ?? value}`}
                className="text-glow-400/70 hover:text-glow-200"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {multiple || selected.length === 0 ? (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-white/10 bg-void-lift/70 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/60 outline-none focus:border-glow-500/60 focus:ring-1 focus:ring-glow-500/40"
          />
          {open && filtered.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-white/10 bg-void-panel shadow-glow-md">
              {filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      add(option.value);
                    }}
                    className="flex w-full flex-col px-3 py-2 text-left text-sm text-parchment-muted transition hover:bg-glow-500/10 hover:text-parchment"
                  >
                    <span>{option.label}</span>
                    {option.hint ? (
                      <span className="text-xs text-parchment-dim">{option.hint}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {description ? <p className="text-xs text-parchment-dim">{description}</p> : null}
    </div>
  );
}
