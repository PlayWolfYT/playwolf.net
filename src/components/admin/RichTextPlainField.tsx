import { Field, TextArea } from "@/components/admin/AdminForm";
import { richTextToPlain } from "@/lib/admin/lexical";
import type { RichTextValue } from "@/lib/content";

/**
 * Edits a Lexical rich-text field as plain text. Blank lines separate
 * paragraphs. The matching server action compares the submission against
 * `richTextToPlain(existingValue)`: unchanged keeps the original Lexical
 * document (preserving anything plaintext can't show, like bold spans or
 * text effects); changed rebuilds it from the new plain text.
 */
export function RichTextPlainField({
  name,
  label,
  value,
  description = "Plain text. Leave a blank line between paragraphs.",
}: {
  name: string;
  label?: string;
  value?: RichTextValue | null;
  description?: string;
}) {
  return (
    <Field label={label} htmlFor={name} description={description}>
      <TextArea id={name} name={name} defaultValue={richTextToPlain(value)} rows={5} />
    </Field>
  );
}
