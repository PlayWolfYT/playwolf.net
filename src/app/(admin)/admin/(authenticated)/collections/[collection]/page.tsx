import Link from "next/link";
import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/admin/FlashMessage";
import { getCollectionSchema } from "@/lib/admin/registry";
import { getPayloadClient } from "@/lib/payload";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const schema = await getCollectionSchema(slug);
  return { title: schema?.label ?? "Collection" };
}

function cellValue(doc: Record<string, unknown>, key: string): string {
  const value = doc[key];
  if (value == null) return "—";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (typeof value === "object" && value && "name" in value) {
    return String((value as { name?: unknown }).name ?? "—");
  }
  if (typeof value === "object" && value && "email" in value) {
    return String((value as { email?: unknown }).email ?? "—");
  }
  if (typeof value === "object" && value && "filename" in value) {
    return String((value as { filename?: unknown }).filename ?? "—");
  }
  return "—";
}

export default async function CollectionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ flash?: string; error?: string }>;
}) {
  const { collection: slug } = await params;
  const { flash, error } = await searchParams;
  const schema = await getCollectionSchema(slug);
  if (!schema) notFound();

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: slug as "artworks",
    depth: 1,
    limit: 200,
    sort: "-updatedAt",
    overrideAccess: true,
  });

  const columns = schema.defaultColumns.filter((column) => column !== "id");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-glow-500">
            Collection
          </p>
          <h1 className="mt-2 font-display text-2xl font-light tracking-tight text-parchment">
            {schema.label}
          </h1>
        </div>
        <Link
          href={`/admin/collections/${slug}/new`}
          className="rounded-lg border border-glow-500/40 bg-glow-500/10 px-3 py-1.5 text-sm text-glow-300 transition hover:bg-glow-500/20"
        >
          New {schema.singularLabel}
        </Link>
      </header>

      <FlashMessage flash={flash} error={error} />

      {docs.length === 0 ? (
        <p className="text-sm text-parchment-dim">Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-void-lift/60 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-parchment-dim">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const record = doc as unknown as Record<string, unknown>;
                return (
                  <tr
                    key={String(doc.id)}
                    className="border-t border-white/[0.06] transition hover:bg-glow-500/5"
                  >
                    {columns.map((column, index) => (
                      <td key={column} className="px-3 py-2 text-parchment-muted">
                        {index === 0 ? (
                          <Link
                            href={`/admin/collections/${slug}/${doc.id}`}
                            className="text-parchment hover:text-glow-300"
                          >
                            {cellValue(record, column)}
                          </Link>
                        ) : (
                          cellValue(record, column)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
