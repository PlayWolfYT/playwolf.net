import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";

import type { RichTextValue } from "@/lib/content";

/**
 * The custom admin edits rich text as plain text — paragraphs separated by a
 * blank line — rather than embedding the Lexical editor. This keeps a saved
 * document's exact Lexical JSON (and anything the plaintext view can't show,
 * such as bold spans or text effects) untouched when a field is left alone,
 * and only re-derives it from scratch when the plain text actually changed.
 */

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function paragraphNode(text: string) {
  return {
    children: text ? [textNode(text)] : [],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    type: "paragraph",
    version: 1,
  };
}

/** Flattens a Lexical document to the text it renders. Empty/missing → "". */
export function richTextToPlain(value: RichTextValue | null | undefined): string {
  if (!value) return "";
  try {
    return convertLexicalToPlaintext({ data: value });
  } catch {
    return "";
  }
}

/** Newline handling normalized so trailing whitespace never registers as a change. */
function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

/**
 * True when `plain` is exactly what `value` already renders as — the signal
 * a save uses to decide whether to keep the stored Lexical JSON as-is.
 */
export function equalsPlain(
  value: RichTextValue | null | undefined,
  plain: string,
): boolean {
  return normalize(richTextToPlain(value)) === normalize(plain);
}

/**
 * Builds a fresh Lexical document from plain text. Blank lines split
 * paragraphs; anything else is a single text node, so bold/italic/etc. from a
 * previous edit are not something this can (or needs to) reconstruct — those
 * only survive while the plain text stays unchanged, per `equalsPlain`.
 */
export function plaintextToLexical(plain: string): RichTextValue {
  const normalized = plain.replace(/\r\n/g, "\n").trim();
  const paragraphs = normalized.length > 0 ? normalized.split(/\n{2,}/) : [""];

  return {
    root: {
      children: paragraphs.map((paragraph) =>
        paragraphNode(paragraph.replace(/\n+/g, " ").trim()),
      ),
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as RichTextValue;
}
