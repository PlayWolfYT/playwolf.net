"use client";

import { useRef } from "react";

/**
 * Wraps a delete server action in a native `confirm()` before it submits.
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
          "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
