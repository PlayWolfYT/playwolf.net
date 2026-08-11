const MESSAGES: Record<string, { tone: "success" | "error"; text: string }> = {
  created: { tone: "success", text: "Created." },
  updated: { tone: "success", text: "Saved." },
  deleted: { tone: "success", text: "Deleted." },
  uploaded: { tone: "success", text: "Uploaded." },
};

/**
 * Renders a banner for the `?flash=` query param a redirecting server action
 * leaves behind, or an arbitrary error string passed straight through.
 */
export function FlashMessage({ flash, error }: { flash?: string; error?: string }) {
  const known = flash ? MESSAGES[flash] : undefined;
  const text = error ?? known?.text ?? (flash ? flash : undefined);
  if (!text) return null;

  const tone = error ? "error" : (known?.tone ?? "success");

  return (
    <div
      role="status"
      className={
        tone === "success"
          ? "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
          : "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
      }
    >
      {text}
    </div>
  );
}
