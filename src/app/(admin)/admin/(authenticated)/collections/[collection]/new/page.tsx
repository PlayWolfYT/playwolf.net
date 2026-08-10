import Link from "next/link";
import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/admin/FlashMessage";
import { MediaUploadForm } from "@/components/admin/MediaUploadForm";
import { SchemaForm } from "@/components/admin/SchemaForm";
import { buildSchemaFormContext } from "@/lib/admin/form-context";
import { getCollectionSchema } from "@/lib/admin/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const schema = await getCollectionSchema(slug);
  return { title: schema ? `New ${schema.singularLabel}` : "New" };
}

export default async function NewCollectionDocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { collection: slug } = await params;
  const { error } = await searchParams;
  const schema = await getCollectionSchema(slug);
  if (!schema) notFound();

  // Uploads need a multipart file on create — keep a dedicated form for media.
  if (schema.upload) {
    return (
      <div className="flex flex-col gap-6">
        <Header schema={schema} />
        <FlashMessage error={error} />
        <MediaUploadForm />
      </div>
    );
  }

  const ctx = await buildSchemaFormContext(schema.fields, null);

  return (
    <div className="flex flex-col gap-6">
      <Header schema={schema} />
      <FlashMessage error={error} />
      <SchemaForm
        kind="collection"
        slug={slug}
        fields={schema.fields}
        initialValues={ctx.initialValues}
        relationOptions={ctx.relationOptions}
        mediaOptions={ctx.mediaOptions}
        mediaById={ctx.mediaById}
        submitLabel={`Create ${schema.singularLabel}`}
      />
    </div>
  );
}

function Header({
  schema,
}: {
  schema: { slug: string; singularLabel: string; label: string };
}) {
  return (
    <header>
      <Link
        href={`/admin/collections/${schema.slug}`}
        className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-glow-500 hover:text-glow-300"
      >
        ← {schema.label}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-light tracking-tight text-parchment">
        New {schema.singularLabel}
      </h1>
    </header>
  );
}
