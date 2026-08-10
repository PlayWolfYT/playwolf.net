"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { CollectionSlug, DataFromCollectionSlug, GlobalSlug } from "payload";

import { requireAdminUser } from "@/lib/admin/auth";
import { formValuesToDocument } from "@/lib/admin/document";
import { flashUrl } from "@/lib/admin/form-utils";
import { getCollectionSchema, getGlobalSchema } from "@/lib/admin/registry";
import { getPayloadClient } from "@/lib/payload";

export type DocumentActionResult =
  { ok: true; id?: number | string } | { ok: false; error: string };

async function authedPayload() {
  await requireAdminUser();
  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });
  return { payload, user };
}

export async function saveCollectionDocumentAction(input: {
  collection: string;
  id?: number | string;
  values: Record<string, unknown>;
}): Promise<DocumentActionResult> {
  const schema = await getCollectionSchema(input.collection);
  if (!schema) return { ok: false, error: `Unknown collection “${input.collection}”.` };

  const { payload, user } = await authedPayload();
  const data = formValuesToDocument(input.values, schema.fields);

  try {
    if (input.id != null && input.id !== "") {
      await payload.update({
        collection: input.collection as CollectionSlug,
        id: input.id,
        // Schema-driven forms submit a partial document shaped by field names.
        data: data as unknown as DataFromCollectionSlug<CollectionSlug>,
        user: user ?? undefined,
        overrideAccess: false,
      });
      return { ok: true, id: input.id };
    }

    const created = await payload.create({
      collection: input.collection as CollectionSlug,
      data: data as unknown as DataFromCollectionSlug<CollectionSlug>,
      user: user ?? undefined,
      overrideAccess: false,
    });
    return { ok: true, id: created.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save the document.",
    };
  }
}

export async function deleteCollectionDocumentAction(input: {
  collection: string;
  id: number | string;
}): Promise<DocumentActionResult> {
  const schema = await getCollectionSchema(input.collection);
  if (!schema) return { ok: false, error: `Unknown collection “${input.collection}”.` };

  const { payload, user } = await authedPayload();

  try {
    await payload.delete({
      collection: input.collection as CollectionSlug,
      id: input.id,
      user: user ?? undefined,
      overrideAccess: false,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not delete — it may still be referenced.",
    };
  }
}

export async function saveGlobalDocumentAction(input: {
  global: string;
  values: Record<string, unknown>;
}): Promise<DocumentActionResult> {
  const schema = await getGlobalSchema(input.global);
  if (!schema) return { ok: false, error: `Unknown global “${input.global}”.` };

  const { payload, user } = await authedPayload();
  const data = formValuesToDocument(input.values, schema.fields);

  try {
    await payload.updateGlobal({
      slug: input.global as GlobalSlug,
      data,
      user: user ?? undefined,
      overrideAccess: false,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save settings.",
    };
  }
}

/** Form-action wrappers that redirect with flash messages (for delete buttons). */
export async function deleteCollectionFormAction(formData: FormData): Promise<void> {
  const collection = String(formData.get("collection") ?? "");
  const id = String(formData.get("id") ?? "");
  const result = await deleteCollectionDocumentAction({ collection, id });
  if (!result.ok) {
    redirect(
      `/admin/collections/${collection}/${id}?error=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(flashUrl(`/admin/collections/${collection}`, "deleted"));
}
