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
 * are a handful to a few dozen documents, so the whole list is fetched once
 * by the page and filtered here client-side.
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
  value?: string[];
  onChange?: (next: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  description?: string;
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
        <span className="text-sm font-medium text-zinc-800">{label}</span>
      ) : null}

      {name ? <input type="hidden" name={name} value={encoded} /> : null}

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((entry) => (
            <li
              key={entry}
              className="flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"
            >
              {byValue.get(entry)?.label ?? entry}
              <button
                type="button"
                onClick={() => remove(entry)}
                aria-label={`Remove ${byValue.get(entry)?.label ?? entry}`}
                className="text-sky-600/70 hover:text-sky-900"
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
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          {open && filtered.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
              {filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      add(option.value);
                    }}
                    className="flex w-full flex-col px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-sky-50"
                  >
                    <span>{option.label}</span>
                    {option.hint ? (
                      <span className="text-xs text-zinc-500">{option.hint}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
    </div>
  );
}
