import { describe, expect, test } from "bun:test";

import {
  equalsHtml,
  htmlHasContent,
  htmlToLexical,
  lexicalToHtml,
} from "@/lib/admin/lexical-html";
import { plaintextToLexical } from "@/lib/admin/lexical";
import { NODE_STATE_KEY, TEXT_EFFECT_STATE_KEY } from "@/lib/text-effects";

describe("lexicalToHtml / htmlToLexical", () => {
  test("round-trips a simple paragraph", () => {
    const html = "<p>Hello there</p>";
    const lexical = htmlToLexical(html);
    expect(lexicalToHtml(lexical)).toContain("Hello there");
    expect(htmlHasContent(lexicalToHtml(lexical))).toBe(true);
  });

  test("preserves bold and italic marks", () => {
    const html = "<p><strong>Bold</strong> and <em>italic</em></p>";
    const lexical = htmlToLexical(html);
    const out = lexicalToHtml(lexical);
    expect(out).toContain("<strong>Bold</strong>");
    expect(out).toContain("<em>italic</em>");
  });

  test("preserves headings and lists", () => {
    const html = "<h2>Title</h2><ul><li>One</li><li>Two</li></ul>";
    const lexical = htmlToLexical(html);
    const out = lexicalToHtml(lexical);
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>One</li>");
  });

  test("empty html yields an empty document", () => {
    expect(htmlHasContent(lexicalToHtml(htmlToLexical("")))).toBe(false);
    expect(htmlHasContent(lexicalToHtml(htmlToLexical("<p></p>")))).toBe(false);
  });

  test("equalsHtml is true when HTML matches the stored Lexical render", () => {
    const value = plaintextToLexical("Same text");
    // plaintextToLexical produces paragraphs; equalsHtml compares via lexicalToHtml
    const html = lexicalToHtml(value);
    expect(equalsHtml(value, html)).toBe(true);
    expect(equalsHtml(value, "<p>Edited</p>")).toBe(false);
  });

  test("round-trips fx-* text effects into Lexical $ state", () => {
    const html = '<p><span class="fx-rainbow">Wow</span></p>';
    const lexical = htmlToLexical(html);
    const paragraph = (lexical.root.children as Array<{ children?: unknown[] }>)[0];
    const text = paragraph?.children?.[0] as {
      text?: string;
      [key: string]: unknown;
    };
    expect(text?.text).toBe("Wow");
    expect(
      (text?.[NODE_STATE_KEY] as Record<string, unknown> | undefined)?.[
        TEXT_EFFECT_STATE_KEY
      ],
    ).toBe("rainbow");
    expect(lexicalToHtml(lexical)).toContain('class="fx-rainbow"');
  });

  test("preserves horizontal rules", () => {
    const html = "<p>Above</p><hr><p>Below</p>";
    const lexical = htmlToLexical(html);
    const types = (lexical.root.children as Array<{ type: string }>).map((n) => n.type);
    expect(types).toContain("horizontalrule");
    expect(lexicalToHtml(lexical)).toContain("<hr>");
  });
});
