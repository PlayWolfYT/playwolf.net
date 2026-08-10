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
          ? "mb-4 rounded-lg border border-glow-500/30 bg-glow-500/10 px-4 py-2.5 text-sm text-glow-300"
          : "mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
      }
    >
      {text}
    </div>
  );
}
