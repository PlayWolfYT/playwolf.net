import { describe, expect, test } from "bun:test";

import {
  bool,
  flashUrl,
  id,
  idOrNull,
  num,
  parseIdList,
  parseJSON,
  parseLinks,
  parsePolymorphicList,
  parseSingleId,
  parseStringList,
  str,
} from "@/lib/admin/form-utils";

function form(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

describe("str", () => {
  test("trims and returns undefined for blank input", () => {
    expect(str(form({ title: "  Hello  " }), "title")).toBe("Hello");
    expect(str(form({ title: "   " }), "title")).toBeUndefined();
    expect(str(form({}), "title")).toBeUndefined();
  });
});

describe("bool", () => {
  test("reads native checkbox presence", () => {
    expect(bool(form({ paid: "on" }), "paid")).toBe(true);
    expect(bool(form({}), "paid")).toBe(false);
  });
});

describe("num / id", () => {
  test("parses valid numbers and rejects blanks", () => {
    expect(num(form({ order: "3" }), "order")).toBe(3);
    expect(num(form({ order: "" }), "order")).toBeUndefined();
    expect(num(form({ order: "not-a-number" }), "order")).toBeUndefined();
  });

  test("id() requires a positive integer", () => {
    expect(id(form({ character: "12" }), "character")).toBe(12);
    expect(id(form({ character: "0" }), "character")).toBeUndefined();
    expect(id(form({ character: "-1" }), "character")).toBeUndefined();
    expect(id(form({ character: "3.7" }), "character")).toBe(3);
  });
});

describe("parseJSON", () => {
  test("falls back on missing or invalid JSON rather than throwing", () => {
    expect(parseJSON(form({}), "data", { a: 1 })).toEqual({ a: 1 });
    expect(parseJSON(form({ data: "{not json" }), "data", [])).toEqual([]);
    expect(parseJSON(form({ data: "[1,2,3]" }), "data", [] as number[])).toEqual([
      1, 2, 3,
    ]);
  });
});

describe("parseIdList", () => {
  test("keeps only positive finite numbers", () => {
    expect(parseIdList(form({ tags: '[1, 2, -3, "x", 4]' }), "tags")).toEqual([
      1, 2, 4,
    ]);
    expect(parseIdList(form({}), "tags")).toEqual([]);
  });
});

describe("parseSingleId / idOrNull", () => {
  test("parseSingleId reads the first entry of a JSON-encoded selection", () => {
    expect(parseSingleId(form({ artist: '["7"]' }), "artist")).toBe(7);
    expect(parseSingleId(form({ artist: "[]" }), "artist")).toBeNull();
    expect(parseSingleId(form({}), "artist")).toBeNull();
  });

  test("idOrNull reads a bare numeric field, defaulting to null when blank", () => {
    expect(idOrNull(form({ image: "12" }), "image")).toBe(12);
    expect(idOrNull(form({ image: "" }), "image")).toBeNull();
    expect(idOrNull(form({}), "image")).toBeNull();
  });
});

describe("parseStringList", () => {
  test("trims and drops empty entries", () => {
    expect(
      parseStringList(form({ icons: '["pencil", "  ", "star"]' }), "icons"),
    ).toEqual(["pencil", "star"]);
  });
});

describe("parseLinks", () => {
  test("keeps only entries with a known kind and a url", () => {
    const links = parseLinks(
      form({
        links: JSON.stringify([
          { kind: "website", url: "https://example.com", description: "  " },
          { kind: "not-a-kind", url: "https://bad.example" },
          { kind: "twitter", url: "" },
          { kind: "telegram", url: "https://t.me/x", description: "private" },
        ]),
      }),
      "links",
    );

    expect(links).toEqual([
      { kind: "website", url: "https://example.com", description: undefined },
      { kind: "telegram", url: "https://t.me/x", description: "private" },
    ]);
  });
});

describe("parsePolymorphicList", () => {
  test("restricts relationTo to the allowed collections", () => {
    const parsed = parsePolymorphicList(
      form({
        featuring: JSON.stringify([
          { relationTo: "characters", value: 3 },
          { relationTo: "friends", value: 7 },
          { relationTo: "artworks", value: 9 },
          { relationTo: "friends", value: "not-a-number" },
        ]),
      }),
      "featuring",
      ["characters", "friends"],
    );

    expect(parsed).toEqual([
      { relationTo: "characters", value: 3 },
      { relationTo: "friends", value: 7 },
    ]);
  });
});

describe("flashUrl", () => {
  test("appends the flash param, using & when a query already exists", () => {
    expect(flashUrl("/admin/artists", "created")).toBe("/admin/artists?flash=created");
    expect(flashUrl("/admin/artists?page=2", "created")).toBe(
      "/admin/artists?page=2&flash=created",
    );
  });
});
