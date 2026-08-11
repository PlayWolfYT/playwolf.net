import type { ExampleCommission } from "@/lib/content";

/** Admin-only bookkeeping panel on public artwork pages. */
export function CommissionStatus({ commission }: { commission: ExampleCommission }) {
  return (
    <aside className="mx-auto mt-8 max-w-xl rounded-2xl border border-glow-500/25 bg-glow-500/10 px-5 py-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-glow-400">
        Commission status · admin
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-parchment-dim">Paid</dt>
          <dd className="text-parchment">{commission.paid ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-parchment-dim">Artist started</dt>
          <dd className="text-parchment">{commission.artistStarted ? "Yes" : "No"}</dd>
        </div>
        {commission.lastArtistUpdateAt ? (
          <div className="col-span-2">
            <dt className="text-parchment-dim">Last artist update</dt>
            <dd className="text-parchment">
              {new Date(commission.lastArtistUpdateAt).toLocaleString()}
              {commission.lastArtistUpdateNote
                ? ` — ${commission.lastArtistUpdateNote}`
                : ""}
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
