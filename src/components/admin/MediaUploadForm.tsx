import { uploadMediaFormAction } from "@/lib/admin/actions/media";
import { Field, SubmitButton, TextInput } from "@/components/admin/AdminForm";

/** Multipart create form for the `media` upload collection. */
export function MediaUploadForm() {
  return (
    <form action={uploadMediaFormAction} className="flex flex-col gap-4">
      <Field label="Image" htmlFor="file" required>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          required
          className="block w-full text-sm text-parchment-muted file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-void-lift file:px-3 file:py-1.5 file:text-xs file:text-parchment"
        />
      </Field>
      <Field label="Alt text" htmlFor="alt" description="Defaults to the filename.">
        <TextInput id="alt" name="alt" />
      </Field>
      <SubmitButton>Upload</SubmitButton>
    </form>
  );
}
