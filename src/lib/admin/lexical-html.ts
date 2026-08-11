/**
 * Bridge between Payload Lexical JSON and HTML for TipTap editors.
 * Uses a tiny tag tokenizer so conversion works on the server (no DOM).
 *
 * Text effects (rainbow / shake / glow / gradient) round-trip as
 * `<span class="fx-*">` and Lexical `$` state (`{ effect: "rainbow" }`).
 * Gradient colour stops live under `$gradientColors`, the Lexical text
 * node's `style` field (full inline gradient CSS), and
 * `data-gradient-colors` in HTML. Extra span classes/styles ride along as
 * `$htmlClass` / `$htmlStyle`.
 */

import type { RichTextValue } from "@/lib/content";
import {
  GRADIENT_COLORS_STATE_KEY,
  NODE_STATE_KEY,
  TEXT_EFFECT_STATE_KEY,
  TEXT_EFFECTS,
  gradientTextStyle,
  isTextEffect,
  normalizeGradientColors,
  parseGradientColorsFromAttr,
  parseGradientColorsFromStyle,
  textEffectClass,
  type TextEffect,
} from "@/lib/text-effects";

/** Marker stored in form state for rich-text fields edited as HTML. */
export type StudioRichText = {
  __studioHtml: string;
  __studioOriginal: RichTextValue | null;
};

export function isStudioRichText(value: unknown): value is StudioRichText {
  return (
    typeof value === "object" &&
    value !== null &&
    "__studioHtml" in value &&
    "__studioOriginal" in value
  );
}

type LexNode = {
  type: string;
  text?: string;
  format?: number | string;
  tag?: string;
  listType?: string;
  url?: string;
  fields?: { url?: string; linkType?: string; newTab?: boolean };
  children?: LexNode[];
  [key: string]: unknown;
};

const EMPTY_LEXICAL = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [],
        direction: "ltr" as const,
        format: "" as const,
        indent: 0,
        version: 1,
      },
    ],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  },
} as RichTextValue;

const EFFECT_CLASS_TO_KEY = Object.fromEntries(
  Object.entries(TEXT_EFFECTS).map(([key, effect]) => [effect.className, key]),
) as Record<string, TextEffect>;

function blockMeta() {
  return {
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  };
}

function textNode(
  text: string,
  format = 0,
  extras?: {
    effect?: TextEffect;
    gradientColors?: string[];
    htmlClass?: string;
    htmlStyle?: string;
  },
) {
  const node: LexNode = {
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
  const state: Record<string, unknown> = {};
  if (extras?.effect) state[TEXT_EFFECT_STATE_KEY] = extras.effect;
  if (extras?.gradientColors?.length) {
    state[GRADIENT_COLORS_STATE_KEY] = extras.gradientColors;
    // Also park the full CSS on Lexical's native `style` field so colour
    // stops survive if unknown `$` keys are stripped on save.
    node.style = gradientTextStyle(extras.gradientColors);
  }
  if (extras?.htmlClass) state.htmlClass = extras.htmlClass;
  if (extras?.htmlStyle) state.htmlStyle = extras.htmlStyle;
  if (Object.keys(state).length > 0) node[NODE_STATE_KEY] = state;
  return node;
}

export function lexicalToHtml(state: RichTextValue | null | undefined): string {
  if (!state?.root?.children?.length) return "";
  return (state.root.children as LexNode[]).map(nodeToHtml).join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function nodeToHtml(node: LexNode): string {
  switch (node.type) {
    case "paragraph": {
      const inner = (node.children ?? []).map(nodeToHtml).join("");
      return `<p>${inner || "<br>"}</p>`;
    }
    case "heading": {
      const tag =
        node.tag === "h2" || node.tag === "h3" || node.tag === "h4" ? node.tag : "h3";
      const inner = (node.children ?? []).map(nodeToHtml).join("");
      return `<${tag}>${inner}</${tag}>`;
    }
    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      const items = (node.children ?? [])
        .filter((c) => c.type === "listitem")
        .map((item) => `<li>${(item.children ?? []).map(nodeToHtml).join("")}</li>`)
        .join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "listitem":
      return (node.children ?? []).map(nodeToHtml).join("");
    case "quote": {
      const inner = (node.children ?? []).map(nodeToHtml).join("");
      return `<blockquote>${inner}</blockquote>`;
    }
    case "link": {
      const href = escapeAttr(String(node.fields?.url ?? node.url ?? "#"));
      const inner = (node.children ?? []).map(nodeToHtml).join("");
      return `<a href="${href}">${inner}</a>`;
    }
    case "horizontalrule":
      return "<hr>";
    case "linebreak":
      return "<br>";
    case "text": {
      let t = escapeHtml(node.text ?? "");
      const format = typeof node.format === "number" ? node.format : 0;
      if (format & 1) t = `<strong>${t}</strong>`;
      if (format & 2) t = `<em>${t}</em>`;
      if (format & 8) t = `<u>${t}</u>`;
      if (format & 16) t = `<s>${t}</s>`;
      if (format & 32) t = `<code>${t}</code>`;

      const state = (node[NODE_STATE_KEY] as Record<string, unknown> | undefined) ?? {};
      const classes: string[] = [];
      const effect = state[TEXT_EFFECT_STATE_KEY];
      const effectClass = textEffectClass(effect);
      if (effectClass) classes.push(effectClass);
      if (typeof state.htmlClass === "string" && state.htmlClass.trim()) {
        classes.push(...state.htmlClass.trim().split(/\s+/));
      }

      const gradientColors =
        normalizeGradientColors(state[GRADIENT_COLORS_STATE_KEY]) ??
        parseGradientColorsFromStyle(
          typeof node.style === "string" ? node.style : undefined,
        );
      const styleParts: string[] = [];
      if (effect === "gradient" && gradientColors) {
        styleParts.push(gradientTextStyle(gradientColors));
      } else if (typeof node.style === "string" && node.style.trim()) {
        styleParts.push(node.style.trim());
      }
      if (typeof state.htmlStyle === "string" && state.htmlStyle.trim()) {
        styleParts.push(state.htmlStyle.trim());
      }
      const style = styleParts.length > 0 ? styleParts.join("; ") : undefined;
      const dataAttr =
        effect === "gradient" && gradientColors
          ? ` data-gradient-colors="${escapeAttr(gradientColors.join(","))}"`
          : "";

      if (classes.length > 0 || style || dataAttr) {
        const classAttr = classes.length
          ? ` class="${escapeAttr(classes.join(" "))}"`
          : "";
        const styleAttr = style ? ` style="${escapeAttr(style)}"` : "";
        t = `<span${classAttr}${styleAttr}${dataAttr}>${t}</span>`;
      }
      return t;
    }
    default:
      return (node.children ?? []).map(nodeToHtml).join("");
  }
}

type Token =
  | { kind: "open"; name: string; attrs: Record<string, string> }
  | { kind: "close"; name: string }
  | { kind: "text"; value: string }
  | { kind: "br" }
  | { kind: "hr" };

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)>|<([a-zA-Z0-9]+)([^>]*)\/?>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    if (m[1]) {
      tokens.push({ kind: "close", name: m[1].toLowerCase() });
      continue;
    }
    if (m[2]) {
      const name = m[2].toLowerCase();
      const selfClosing = m[0].endsWith("/>") || name === "br" || name === "hr";
      const attrs: Record<string, string> = {};
      const attrRe =
        /([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][\w:.-]*)\s*=\s*'([^']*)'/g;
      let am: RegExpExecArray | null;
      const attrSrc = m[3] ?? "";
      while ((am = attrRe.exec(attrSrc))) {
        const key = (am[1] || am[3] || "").toLowerCase();
        const val = am[2] ?? am[4] ?? "";
        if (key) attrs[key] = val;
      }
      if (name === "br") {
        tokens.push({ kind: "br" });
      } else if (name === "hr") {
        tokens.push({ kind: "hr" });
      } else if (selfClosing) {
        // Ignore other void tags.
      } else {
        tokens.push({ kind: "open", name, attrs });
      }
      continue;
    }
    if (m[4] != null) {
      const value = m[4]
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
      if (value) tokens.push({ kind: "text", value });
    }
  }
  return tokens;
}

type Frame = { name: string; node: LexNode };
type SpanFrame = {
  effect?: TextEffect;
  gradientColors?: string[];
  htmlClass?: string;
  htmlStyle?: string;
};

export function htmlToLexical(html: string): RichTextValue {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") {
    return EMPTY_LEXICAL;
  }

  const tokens = tokenize(trimmed);
  const rootChildren: LexNode[] = [];
  const stack: Frame[] = [];
  const spanStack: SpanFrame[] = [];
  let format = 0;

  const activeSpan = (): SpanFrame => {
    let effect: TextEffect | undefined;
    let gradientColors: string[] | undefined;
    let htmlClass: string | undefined;
    let htmlStyle: string | undefined;
    for (const frame of spanStack) {
      if (frame.effect) effect = frame.effect;
      if (frame.gradientColors) gradientColors = frame.gradientColors;
      if (frame.htmlClass) {
        htmlClass = htmlClass ? `${htmlClass} ${frame.htmlClass}` : frame.htmlClass;
      }
      if (frame.htmlStyle) {
        htmlStyle = htmlStyle ? `${htmlStyle};${frame.htmlStyle}` : frame.htmlStyle;
      }
    }
    return { effect, gradientColors, htmlClass, htmlStyle };
  };

  const currentChildren = (): LexNode[] => {
    if (stack.length === 0) return rootChildren;
    const top = stack[stack.length - 1]!;
    if (!top.node.children) top.node.children = [];
    return top.node.children;
  };

  const ensureBlock = (): LexNode[] => {
    if (stack.length > 0) return currentChildren();
    const p: LexNode = { type: "paragraph", children: [], ...blockMeta() };
    rootChildren.push(p);
    return p.children!;
  };

  for (const token of tokens) {
    if (token.kind === "text") {
      const target = stack.length ? currentChildren() : ensureBlock();
      target.push(textNode(token.value, format, activeSpan()));
      continue;
    }
    if (token.kind === "br") {
      const target = stack.length ? currentChildren() : ensureBlock();
      target.push({ type: "linebreak", version: 1 });
      continue;
    }
    if (token.kind === "hr") {
      // HR is a block-level sibling under root (or current block parent).
      if (stack.length === 0) {
        rootChildren.push({ type: "horizontalrule", version: 1 });
      } else {
        currentChildren().push({ type: "horizontalrule", version: 1 });
      }
      continue;
    }
    if (token.kind === "open") {
      const { name, attrs } = token;
      if (name === "strong" || name === "b") {
        format |= 1;
        continue;
      }
      if (name === "em" || name === "i") {
        format |= 2;
        continue;
      }
      if (name === "u") {
        format |= 8;
        continue;
      }
      if (name === "s" || name === "strike" || name === "del") {
        format |= 16;
        continue;
      }
      if (name === "code") {
        format |= 32;
        continue;
      }

      if (name === "span") {
        const classes = (attrs.class ?? "").split(/\s+/).filter(Boolean);
        const effectKeys = classes
          .map((cls) => EFFECT_CLASS_TO_KEY[cls])
          .filter((key): key is TextEffect => Boolean(key));
        const otherClasses = classes.filter((cls) => !EFFECT_CLASS_TO_KEY[cls]);
        const effect = effectKeys[0];
        const gradientColors =
          parseGradientColorsFromAttr(attrs["data-gradient-colors"]) ??
          parseGradientColorsFromStyle(attrs.style);
        // Drop gradient CSS from leftover style — it lives in $gradientColors
        // / the Lexical text `style` field.
        const leftoverStyle = (attrs.style ?? "")
          .replace(/--fx-gradient-stops\s*:\s*[^;]+;?/gi, "")
          .replace(/background-image\s*:\s*linear-gradient\([^)]*\)\s*;?/gi, "")
          .replace(/-webkit-background-clip\s*:\s*[^;]+;?/gi, "")
          .replace(/background-clip\s*:\s*[^;]+;?/gi, "")
          .replace(/color\s*:\s*transparent\s*;?/gi, "")
          .replace(/;\s*;/g, ";")
          .replace(/^;|;$/g, "")
          .trim();
        spanStack.push({
          effect,
          gradientColors: effect === "gradient" ? gradientColors : undefined,
          htmlClass: otherClasses.length ? otherClasses.join(" ") : undefined,
          htmlStyle: leftoverStyle || undefined,
        });
        continue;
      }

      let node: LexNode | null = null;
      if (name === "p") node = { type: "paragraph", children: [], ...blockMeta() };
      else if (name === "h1" || name === "h2" || name === "h3" || name === "h4") {
        node = {
          type: "heading",
          tag: name === "h1" ? "h2" : name,
          children: [],
          ...blockMeta(),
        };
      } else if (name === "ul") {
        node = { type: "list", listType: "bullet", children: [], ...blockMeta() };
      } else if (name === "ol") {
        node = { type: "list", listType: "number", children: [], ...blockMeta() };
      } else if (name === "li") {
        node = { type: "listitem", children: [], ...blockMeta() };
      } else if (name === "blockquote") {
        node = { type: "quote", children: [], ...blockMeta() };
      } else if (name === "a") {
        node = {
          type: "link",
          fields: { url: attrs.href || "#", linkType: "custom", newTab: false },
          children: [],
          ...blockMeta(),
        };
      } else if (name === "div") {
        if (stack.length === 0) {
          node = { type: "paragraph", children: [], ...blockMeta() };
        }
      }

      if (node) {
        currentChildren().push(node);
        stack.push({ name, node });
      }
      continue;
    }

    const { name } = token;
    if (name === "strong" || name === "b") {
      format &= ~1;
      continue;
    }
    if (name === "em" || name === "i") {
      format &= ~2;
      continue;
    }
    if (name === "u") {
      format &= ~8;
      continue;
    }
    if (name === "s" || name === "strike" || name === "del") {
      format &= ~16;
      continue;
    }
    if (name === "code") {
      format &= ~32;
      continue;
    }

    if (name === "span") {
      spanStack.pop();
      continue;
    }

    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i]!.name === name) {
        stack.splice(i);
        break;
      }
    }
  }

  if (rootChildren.length === 0) return EMPTY_LEXICAL;
  return {
    root: {
      type: "root",
      children: rootChildren,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  } as RichTextValue;
}

export function htmlHasContent(html: string): boolean {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<hr\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

export function equalsHtml(
  value: RichTextValue | null | undefined,
  html: string,
): boolean {
  const norm = (s: string) =>
    s
      .replace(/\s+/g, " ")
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "")
      .replace(/<p>\s*<\/p>/gi, "")
      .trim();
  return norm(lexicalToHtml(value)) === norm(html);
}

/** Exported for tests — map a class list to a known effect key. */
export function effectFromClassName(className: string): TextEffect | undefined {
  for (const cls of className.split(/\s+/)) {
    const key = EFFECT_CLASS_TO_KEY[cls];
    if (key && isTextEffect(key)) return key;
  }
  return undefined;
}
