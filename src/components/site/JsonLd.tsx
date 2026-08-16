const SCHEMA_CONTEXT = "https://schema.org";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

/**
 * JSON-LD needs absolute URLs of its own — `metadataBase` only resolves the
 * `metadata` object, not markup a page renders itself.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

/** One schema.org node. Properties left `undefined` are dropped. */
export type JsonLdNode = Record<string, unknown> & { "@type": string };

/**
 * `<`, `>` and `&` are never JSON structure, so every occurrence is inside a
 * string literal and can be escaped unconditionally. Without this, CMS copy
 * containing `</script>` would end the block early. U+2028/U+2029 are legal in
 * JSON but not in JavaScript string literals, and some consumers eval the body.
 */
const UNSAFE = /[<>&\u2028\u2029]/g;

const ESCAPED: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * Structured data for search engines. Emitted on 18+ pages as well, carrying
 * `contentRating: "adult"` rather than being left out — those pages are meant
 * to be indexed, and describing them honestly is what a rating field is for.
 *
 * A `type` other than a JavaScript MIME makes this a data block: browsers never
 * execute it, so no CSP `script-src` allowance is needed.
 */
export function JsonLd({ nodes }: { nodes: JsonLdNode | JsonLdNode[] }) {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  if (list.length === 0) return null;

  const document =
    list.length === 1
      ? { "@context": SCHEMA_CONTEXT, ...list[0] }
      : { "@context": SCHEMA_CONTEXT, "@graph": list };

  return (
    <script
      type="application/ld+json"
      // React escapes text children as HTML entities, which a raw-text element
      // like `script` never decodes — the JSON would arrive corrupted.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(document).replace(UNSAFE, (char) => ESCAPED[char]),
      }}
    />
  );
}
