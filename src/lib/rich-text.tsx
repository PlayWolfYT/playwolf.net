import {
  RichText,
  TextJSXConverter,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";

import type { RichTextValue } from "@/lib/content";
import {
  NODE_STATE_KEY,
  TEXT_EFFECT_STATE_KEY,
  textEffectClass,
} from "@/lib/text-effects";

/**
 * `TextStateFeature` keeps the effect out of the stored styles — the editor
 * renders it inline as a preview, and the published page is expected to map the
 * stored key onto its own CSS. That mapping is this converter: it defers to
 * Payload's own text handling for bold/italic/etc., then wraps the result when
 * an effect is set.
 */
const withTextEffects: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    // A converter entry may be a bare node rather than a function.
    const base = TextJSXConverter.text;
    const rendered = typeof base === "function" ? base(args) : args.node.text;

    const state = (args.node as { [NODE_STATE_KEY]?: Record<string, unknown> })[
      NODE_STATE_KEY
    ];
    const className = textEffectClass(state?.[TEXT_EFFECT_STATE_KEY]);

    return className ? <span className={className}>{rendered}</span> : rendered;
  },
});

/** Renders a stored Lexical document. */
export function RichTextContent({
  className,
  value,
}: {
  className?: string;
  value: RichTextValue;
}) {
  return <RichText className={className} converters={withTextEffects} data={value} />;
}

/**
 * Flattens a Lexical document to the text it renders, for meta and OG
 * descriptions. Replaces the old `reactNodeToText`, which had to walk a React
 * tree because descriptions used to be JSX in a `.tsx` file.
 */
export function richTextToPlainText(
  value: RichTextValue | undefined,
): string | undefined {
  if (!value) return undefined;
  const text = convertLexicalToPlaintext({ data: value }).replace(/\s+/g, " ").trim();
  return text || undefined;
}
