import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/admin/DeleteButton";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { SchemaForm } from "@/components/admin/SchemaForm";
import { deleteCollectionFormAction } from "@/lib/admin/actions/documents";
import { buildSchemaFormContext } from "@/lib/admin/form-context";
import { getCollectionSchema } from "@/lib/admin/registry";
import { getPayloadClient } from "@/lib/payload";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection: slug } = await params;
  const schema = await getCollectionSchema(slug);
  return { title: schema ? `Edit ${schema.singularLabel}` : "Edit" };
}

export default async function EditCollectionDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string; id: string }>;
  searchParams: Promise<{ flash?: string; error?: string }>;
}) {
  const { collection: slug, id } = await params;
  const { flash, error } = await searchParams;
  const schema = await getCollectionSchema(slug);
  if (!schema) notFound();

  const payload = await getPayloadClient();
  let doc: Record<string, unknown>;
  try {
    doc = (await payload.findByID({
      collection: slug as "artworks",
      id,
      depth: 1,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>;
  } catch {
    notFound();
  }

  const ctx = await buildSchemaFormContext(schema.fields, doc);
  const title = String(doc[schema.useAsTitle] ?? `#${id}`);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/admin/collections/${slug}`}
            className="text-xs font-medium text-sky-700 hover:text-sky-800"
          >
            ← {schema.label}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
        </div>
        <DeleteButton
          action={deleteCollectionFormAction}
          hiddenFields={{ collection: slug, id: String(id) }}
          label={`Delete ${schema.singularLabel}`}
        />
      </header>

      <FlashMessage flash={flash} error={error} />

      <SchemaForm
        kind="collection"
        slug={slug}
        id={id}
        fields={schema.fields}
        initialValues={ctx.initialValues}
        relationOptions={ctx.relationOptions}
        mediaOptions={ctx.mediaOptions}
        mediaById={ctx.mediaById}
      />
    </div>
  );
}
