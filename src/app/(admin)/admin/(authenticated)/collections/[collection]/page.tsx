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
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Collection
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {schema.label}
          </h1>
        </div>
        <Link
          href={`/admin/collections/${slug}/new`}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          New {schema.singularLabel}
        </Link>
      </header>

      <FlashMessage flash={flash} error={error} />

      {docs.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2.5 font-semibold">
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
                    className="border-t border-zinc-100 transition hover:bg-sky-50/40"
                  >
                    {columns.map((column, index) => (
                      <td key={column} className="px-3 py-2.5 text-zinc-600">
                        {index === 0 ? (
                          <Link
                            href={`/admin/collections/${slug}/${doc.id}`}
                            className="font-medium text-zinc-900 hover:text-sky-700"
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
