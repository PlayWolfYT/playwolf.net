import { notFound } from "next/navigation";

import { FlashMessage } from "@/components/admin/FlashMessage";
import { SchemaForm } from "@/components/admin/SchemaForm";
import { buildSchemaFormContext } from "@/lib/admin/form-context";
import { getGlobalSchema } from "@/lib/admin/registry";
import { getPayloadClient } from "@/lib/payload";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ global: string }>;
}) {
  const { global: slug } = await params;
  const schema = await getGlobalSchema(slug);
  return { title: schema?.label ?? "Settings" };
}

export default async function GlobalEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ global: string }>;
  searchParams: Promise<{ flash?: string; error?: string }>;
}) {
  const { global: slug } = await params;
  const { flash, error } = await searchParams;
  const schema = await getGlobalSchema(slug);
  if (!schema) notFound();

  const payload = await getPayloadClient();
  const doc = (await payload.findGlobal({
    slug: slug as "siteSettings",
    depth: 1,
    overrideAccess: true,
  })) as unknown as Record<string, unknown>;

  const ctx = await buildSchemaFormContext(schema.fields, doc);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Global
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {schema.label}
        </h1>
      </header>

      <FlashMessage flash={flash} error={error} />

      <SchemaForm
        kind="global"
        slug={slug}
        fields={schema.fields}
        initialValues={ctx.initialValues}
        relationOptions={ctx.relationOptions}
        mediaOptions={ctx.mediaOptions}
        mediaById={ctx.mediaById}
        submitLabel="Save settings"
      />
    </div>
  );
}
