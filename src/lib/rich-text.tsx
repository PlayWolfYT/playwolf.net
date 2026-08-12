import {
  RichText,
  TextJSXConverter,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import type { CSSProperties } from "react";

import type { RichTextValue } from "@/lib/content";
import {
  GRADIENT_COLORS_STATE_KEY,
  NODE_STATE_KEY,
  TEXT_EFFECT_STATE_KEY,
  gradientTextStyleObject,
  normalizeGradientColors,
  parseGradientColorsFromStyle,
  textEffectClass,
} from "@/lib/text-effects";

function inlineStyleObject(css: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const part of css.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const prop = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    // Preserve CSS custom properties as-is; camelCase the rest.
    if (prop.startsWith("--")) {
      style[prop] = value;
      continue;
    }
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[camel] = value;
  }
  return style as CSSProperties;
}

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

    const node = args.node as {
      style?: string;
      [NODE_STATE_KEY]?: Record<string, unknown>;
    };
    const state = node[NODE_STATE_KEY];
    const effect = state?.[TEXT_EFFECT_STATE_KEY];
    const effectClass = textEffectClass(effect);
    const extraClass =
      typeof state?.htmlClass === "string" ? state.htmlClass.trim() : "";
    const className = [effectClass, extraClass].filter(Boolean).join(" ") || undefined;

    const style: CSSProperties = {
      ...(typeof state?.htmlStyle === "string" && state.htmlStyle.trim()
        ? inlineStyleObject(state.htmlStyle)
        : {}),
    };

    if (effect === "gradient") {
      const colors =
        normalizeGradientColors(state?.[GRADIENT_COLORS_STATE_KEY]) ??
        parseGradientColorsFromStyle(node.style);
      if (colors) {
        Object.assign(style, gradientTextStyleObject(colors));
      } else if (typeof node.style === "string" && node.style.trim()) {
        // Fall back to whatever full CSS was parked on the Lexical style field.
        Object.assign(style, inlineStyleObject(node.style));
      }
    }

    const hasStyle = Object.keys(style).length > 0;
    if (!className && !hasStyle) return rendered;
    return (
      <span className={className} style={hasStyle ? style : undefined}>
        {rendered}
      </span>
    );
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
  // `break-words` + `overflow-wrap` keep long CMS URLs / tokens from pushing
  // the page sideways on narrow viewports; `[&_*]:max-w-full` clamps embeds.
  const classes = [
    "break-words [overflow-wrap:anywhere] [&_img]:max-w-full [&_video]:max-w-full [&_iframe]:max-w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <RichText className={classes} converters={withTextEffects} data={value} />;
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
