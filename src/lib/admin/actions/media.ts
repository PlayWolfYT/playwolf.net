"use server";

import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/admin/auth";
import { flashUrl, str } from "@/lib/admin/form-utils";
import { getPayloadClient } from "@/lib/payload";

export type UploadedMedia = {
  id: number;
  url: string;
  alt: string;
  thumbnailURL?: string;
};

export type UploadMediaResult =
  { ok: true; media: UploadedMedia } | { ok: false; error: string };

/**
 * Called directly from `MediaPicker` (a client component) rather than bound
 * to a `<form action>` — uploads happen the moment a file is chosen, so the
 * picker can show the new thumbnail immediately instead of waiting on a full
 * page's form submission.
 */
export async function uploadMediaAction(
  formData: FormData,
): Promise<UploadMediaResult> {
  await requireAdminUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const payload = await getPayloadClient();
  const alt = str(formData, "alt") ?? file.name;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await payload.create({
      collection: "media",
      data: { alt },
      file: {
        data: buffer,
        mimetype: file.type || "application/octet-stream",
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    });

    return {
      ok: true,
      media: {
        id: doc.id,
        url: doc.url ?? "",
        alt: doc.alt ?? alt,
        thumbnailURL: doc.thumbnailURL ?? doc.sizes?.thumbnail?.url ?? undefined,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}

/** Plain `<form action>` counterpart of `uploadMediaAction`, for media create. */
export async function uploadMediaFormAction(formData: FormData): Promise<void> {
  const result = await uploadMediaAction(formData);
  if (!result.ok) {
    redirect(`/admin/collections/media/new?error=${encodeURIComponent(result.error)}`);
  }
  redirect(flashUrl(`/admin/collections/media/${result.media.id}`, "uploaded"));
}
