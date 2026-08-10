import { describe, expect, test } from "bun:test";

import { equalsPlain, plaintextToLexical, richTextToPlain } from "@/lib/admin/lexical";

describe("richTextToPlain", () => {
  test("returns an empty string for a missing value", () => {
    expect(richTextToPlain(undefined)).toBe("");
    expect(richTextToPlain(null)).toBe("");
  });

  test("flattens a single paragraph", () => {
    const value = plaintextToLexical("Hello there");
    expect(richTextToPlain(value)).toBe("Hello there");
  });

  test("joins multiple paragraphs with a blank line", () => {
    const value = plaintextToLexical("First paragraph\n\nSecond paragraph");
    expect(richTextToPlain(value)).toBe("First paragraph\n\nSecond paragraph");
  });
});

describe("plaintextToLexical", () => {
  test("produces a root with one paragraph per blank-line-separated block", () => {
    const value = plaintextToLexical("One\n\nTwo\n\nThree");
    expect(value.root.children).toHaveLength(3);
    expect(value.root.type).toBe("root");
  });

  test("collapses single newlines within a paragraph into spaces", () => {
    const value = plaintextToLexical("Line one\nLine two");
    expect(richTextToPlain(value)).toBe("Line one Line two");
  });

  test("empty text still produces a valid document with one empty paragraph", () => {
    const value = plaintextToLexical("");
    expect(value.root.children).toHaveLength(1);
    expect(richTextToPlain(value)).toBe("");
  });

  test("round-trips through richTextToPlain", () => {
    const original = "Paragraph one.\n\nParagraph two, with more words.";
    const value = plaintextToLexical(original);
    expect(richTextToPlain(value)).toBe(original);
  });
});

describe("equalsPlain", () => {
  test("is true when the value renders to the same text", () => {
    const value = plaintextToLexical("Same text");
    expect(equalsPlain(value, "Same text")).toBe(true);
  });

  test("ignores surrounding whitespace and CRLF differences", () => {
    const value = plaintextToLexical("Same text");
    expect(equalsPlain(value, "  Same text\r\n  ")).toBe(true);
  });

  test("is false once the plain text actually changes", () => {
    const value = plaintextToLexical("Original");
    expect(equalsPlain(value, "Edited")).toBe(false);
  });

  test("a missing value equals only an empty plain text", () => {
    expect(equalsPlain(undefined, "")).toBe(true);
    expect(equalsPlain(undefined, "something")).toBe(false);
  });
});
