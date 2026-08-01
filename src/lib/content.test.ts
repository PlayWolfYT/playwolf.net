import { describe, expect, test } from "bun:test";

import {
  facetOptions,
  getSheetImage,
  isProfileKey,
  matchesFilter,
  placeholderFor,
  type Character,
  type Example,
  type GalleryItem,
  type ImageRef,
  type ProfileKey,
} from "@/lib/content";

const image: ImageRef = {
  src: "/media/art-display.png",
  width: 800,
  height: 600,
  objectPosition: "50% 50%",
  original: { url: "/media/art.png", width: 4000, height: 3000 },
};

function character(slug: string, name: string): Character {
  return { slug, name, profiles: {} };
}

function item(
  characterSlug: string,
  profile: ProfileKey,
  { slug, ...rest }: Partial<Example> & { slug: string },
): GalleryItem {
  return {
    character: character(characterSlug, characterSlug.toUpperCase()),
    profile,
    example: { slug, title: slug, src: image, featuring: [], tags: [], ...rest },
  };
}

const artist = (slug: string) => ({ name: slug, slug, links: [] });

const gallery: GalleryItem[] = [
  item("wuff", "sfw", {
    slug: "one",
    artist: artist("nib"),
    tags: [{ slug: "hug", label: "Hugs" }],
    featuring: [{ kind: "friend", name: "Vex", slug: "vex" }],
  }),
  item("wuff", "sfw", {
    slug: "two",
    artist: artist("quill"),
    tags: [{ slug: "hug", label: "Hugs" }],
  }),
  item("fang", "sfw", {
    slug: "three",
    artist: artist("nib"),
    tags: [{ slug: "ref", label: "Reference" }],
  }),
  item("wuff", "nsfw", {
    slug: "four",
    artist: artist("nib"),
    featuring: [{ kind: "friend", name: "Vex", slug: "vex" }],
  }),
];

describe("placeholderFor", () => {
  test("only asks next/image to blur when there is data to blur with", () => {
    expect(placeholderFor(image)).toBe("empty");
    expect(placeholderFor({ ...image, blurDataURL: "data:image/png;base64,x" })).toBe(
      "blur",
    );
  });
});

describe("isProfileKey", () => {
  test("accepts exactly the two URL segments", () => {
    expect(isProfileKey("sfw")).toBe(true);
    expect(isProfileKey("nsfw")).toBe(true);
    expect(isProfileKey("SFW")).toBe(false);
    expect(isProfileKey("")).toBe(false);
    expect(isProfileKey("toString")).toBe(false);
  });
});

describe("getSheetImage", () => {
  test("returns nothing for a placeholder or a missing sheet", () => {
    expect(getSheetImage(undefined)).toBeUndefined();
    expect(
      getSheetImage({
        kind: "wip",
        title: "Soon",
        wip: {
          badge: "WIP",
          subtitle: "",
          quotes: [],
          icons: [],
          iconCount: 0,
          gradient: [],
          interval: 5000,
          aspect: "4/3",
        },
      }),
    ).toBeUndefined();
  });

  test("uses the sheet title as the alt text", () => {
    expect(getSheetImage({ kind: "image", title: "Full ref", src: image })).toEqual({
      src: image,
      alt: "Full ref",
    });
  });
});

describe("matchesFilter", () => {
  test("hides After Dark work unless it is asked for", () => {
    const nsfw = gallery[3];
    expect(matchesFilter(nsfw, {})).toBe(false);
    expect(matchesFilter(nsfw, { includeNsfw: true })).toBe(true);
  });

  test("an empty filter keeps every SFW piece", () => {
    expect(gallery.filter((entry) => matchesFilter(entry, {})).length).toBe(3);
  });

  test("combines facets as AND, not OR", () => {
    const both = gallery.filter((entry) =>
      matchesFilter(entry, { character: "wuff", artist: "nib" }),
    );
    expect(both.map((entry) => entry.example.slug)).toEqual(["one"]);
  });

  test("matches any one of a piece's multiple values for a facet", () => {
    const tagged = gallery.filter((entry) => matchesFilter(entry, { tag: "hug" }));
    expect(tagged.length).toBe(2);
  });

  test("a facet a piece has no value for excludes it", () => {
    const untagged = item("wuff", "sfw", { slug: "bare" });
    expect(matchesFilter(untagged, { tag: "hug" })).toBe(false);
    expect(matchesFilter(untagged, { artist: "nib" })).toBe(false);
  });
});

describe("facetOptions", () => {
  test("counts against the other filters, not its own", () => {
    // Narrowing to one artist must not collapse the artist list to that
    // artist — otherwise there is no way to switch to a different one.
    const artists = facetOptions(gallery, "artist", { artist: "nib" });
    expect(artists.map((option) => option.slug).sort()).toEqual(["nib", "quill"]);
  });

  test("reflects the other filters in its counts", () => {
    const [hugs] = facetOptions(gallery, "tag", { character: "wuff" });
    expect(hugs).toEqual({ slug: "hug", label: "Hugs", count: 2 });
  });

  test("leaves out After Dark values until they are included", () => {
    expect(facetOptions(gallery, "friend", {})).toEqual([
      { slug: "vex", label: "Vex", count: 1 },
    ]);
    expect(facetOptions(gallery, "friend", { includeNsfw: true })).toEqual([
      { slug: "vex", label: "Vex", count: 2 },
    ]);
  });

  test("sorts by label so the chip order is stable", () => {
    const characters = facetOptions(gallery, "character", {});
    expect(characters.map((option) => option.label)).toEqual(["FANG", "WUFF"]);
  });
});
