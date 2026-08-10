"use client";

import { useRef } from "react";

/**
 * Wraps a delete server action in a native `confirm()` before it submits.
 * A form rather than a button + fetch so it works the same as every other
 * mutation in the admin — a normal server-action POST with a redirect.
 */
export function DeleteButton({
  action,
  id,
  hiddenFields,
  confirmText = "Delete this? This cannot be undone.",
  label = "Delete",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** @deprecated Prefer `hiddenFields` — kept for any remaining call sites. */
  id?: number | string;
  hiddenFields?: Record<string, string>;
  confirmText?: string;
  label?: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const fields = {
    ...(id != null ? { id: String(id) } : {}),
    ...hiddenFields,
  };

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
        }
      >
        {label}
      </button>
    </form>
  );
}
