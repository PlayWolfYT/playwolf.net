import {
  RichText,
  TextJSXConverter,
  type JSXConverter,
  type JSXConvertersFunction,
  type SerializedLexicalNodeWithParent,
} from "@payloadcms/richtext-lexical/react";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import type { CSSProperties } from "react";

import type { RichTextValue } from "@/lib/content";
import { safeHref } from "@/lib/safe-url";
import {
  GRADIENT_COLORS_STATE_KEY,
  NODE_STATE_KEY,
  TEXT_EFFECT_STATE_KEY,
  gradientTextStyleObject,
  normalizeGradientColors,
  parseGradientColorsFromStyle,
  textEffectClass,
} from "@/lib/text-effects";

/**
 * CSS properties the gradient fallback below may set, as React's camelCased
 * names. This codebase's editor only ever parks `gradientTextStyle`'s four
 * declarations on a text node's `style`, but the stored document is JSON, so the
 * fallback has to assume arbitrary CSS and narrow it to the paint properties the
 * effects actually use.
 *
 * The set is the union of what `gradientTextStyleObject` emits and what the
 * `TEXT_EFFECTS` definitions declare; `rich-text.test.ts` pins it against both
 * so the two cannot drift apart and silently stop rendering gradients.
 */
export const ALLOWED_STYLE_PROPERTIES: ReadonlySet<string> = new Set([
  "animation",
  "backgroundClip",
  "backgroundImage",
  "backgroundSize",
  "color",
  "display",
  "textShadow",
  "WebkitBackgroundClip",
]);

/**
 * The property allow-list already excludes positioning and overflow, so what is
 * left to reject is external references: `url()` — including its `image-set()`
 * wrapper — would let a stored document report a page view to another host
 * through `background-image`.
 *
 * Backslashes go too, because a CSS escape is another spelling of the same token
 * (`\75 rl(…)` parses as `url(…)`), and nothing the effects emit needs one.
 */
const UNSAFE_VALUE = /url\(|image-set\(|expression\(|\\/i;

/**
 * Parses an inline CSS declaration list into a React style object, keeping only
 * allow-listed properties. Custom properties are dropped: `.fx-gradient` in
 * `globals.css` carries its own default stops, so nothing on the page needs a
 * `--fx-*` value to arrive from the document.
 */
export function allowedStyleDeclarations(
  css: string | null | undefined,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (!css) return style;
  for (const part of css.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const prop = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!value || UNSAFE_VALUE.test(value)) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    if (!ALLOWED_STYLE_PROPERTIES.has(camel)) continue;
    style[camel] = value;
  }
  return style;
}

type LinkNodeLike = {
  children: SerializedLexicalNodeWithParent[];
  fields?: {
    linkType?: string | null;
    newTab?: boolean | null;
    url?: string | null;
  };
  type?: string;
};

/**
 * Anchors from stored Lexical JSON. `fields.url` arrives as data, so the scheme
 * is allow-listed; an href that fails renders its text unlinked rather than as a
 * live `javascript:`.
 *
 * `LinkFeature` runs without `enabledCollections`, so `fields.url` is the only
 * href source. Enabling internal links means resolving `linkType: "internal"`
 * here as well — until then such a node has no `url` and renders unlinked.
 */
const safeLinkConverter: JSXConverter<LinkNodeLike> = ({ node, nodesToJSX }) => {
  const children = nodesToJSX({ nodes: node.children });
  const href = safeHref(node.fields?.url);
  if (!href) return <>{children}</>;
  const newTab = Boolean(node.fields?.newTab);
  return (
    <a
      href={href}
      rel={newTab ? "noopener noreferrer" : undefined}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </a>
  );
};

/**
 * `TextStateFeature` keeps the effect out of the stored styles — the editor
 * renders it inline as a preview, and the published page is expected to map the
 * stored key onto its own CSS. That mapping is this converter: it defers to
 * Payload's own text handling for bold/italic/etc., then wraps the result when
 * an effect is set.
 */
const withTextEffects: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  autolink: safeLinkConverter,
  link: safeLinkConverter,
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
    const className = textEffectClass(effect);

    const style: Record<string, string> = {};
    if (effect === "gradient") {
      const colors =
        normalizeGradientColors(state?.[GRADIENT_COLORS_STATE_KEY]) ??
        parseGradientColorsFromStyle(node.style);
      Object.assign(
        style,
        colors
          ? gradientTextStyleObject(colors)
          : // Fall back to the CSS parked on the Lexical style field, minus
            // anything outside the allow-list above.
            allowedStyleDeclarations(node.style),
      );
    }

    const hasStyle = Object.keys(style).length > 0;
    if (!className && !hasStyle) return rendered;
    return (
      <span
        className={className}
        style={hasStyle ? (style as CSSProperties) : undefined}
      >
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
 *
 * Untruncated: JSON-LD wants the whole thing. Use
 * `richTextToMetaDescription` for `<meta name="description">` and OG tags.
 */
export function richTextToPlainText(
  value: RichTextValue | undefined,
): string | undefined {
  if (!value) return undefined;
  const text = convertLexicalToPlaintext({ data: value }).replace(/\s+/g, " ").trim();
  return text || undefined;
}

/** Roughly where search engines stop showing a description. */
export const META_DESCRIPTION_MAX_LENGTH = 160;

/**
 * Clips text to `maxLength` on a word boundary, adding an ellipsis only when
 * something was actually dropped. The ellipsis counts towards the budget, so the
 * result never exceeds `maxLength`.
 */
export function truncateForMetaDescription(
  text: string | null | undefined,
  maxLength: number = META_DESCRIPTION_MAX_LENGTH,
): string | undefined {
  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= maxLength) return trimmed;

  const head = trimmed.slice(0, maxLength - 1);
  const lastSpace = head.lastIndexOf(" ");
  const clipped = (lastSpace > 0 ? head.slice(0, lastSpace) : head).replace(
    /[\s.,;:!?—–-]+$/,
    "",
  );
  return `${clipped || head}…`;
}

/** `richTextToPlainText`, clipped for `<meta name="description">` / OG tags. */
export function richTextToMetaDescription(
  value: RichTextValue | undefined,
  maxLength: number = META_DESCRIPTION_MAX_LENGTH,
): string | undefined {
  return truncateForMetaDescription(richTextToPlainText(value), maxLength);
}
