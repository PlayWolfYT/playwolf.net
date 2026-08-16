import { describe, expect, test } from "bun:test";

import {
  castWithSubject,
  exampleThumb,
  facetOptions,
  getSheetImage,
  isProfileKey,
  matchesFilter,
  placeholderFor,
  sortExamples,
  type Character,
  type Example,
  type Featured,
  type FeaturedCharacter,
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

const stamp = "2026-08-01T00:00:00.000Z";

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
    example: {
      slug,
      title: slug,
      updatedAt: stamp,
      src: image,
      isWip: false,
      overviewDisplay: "generated",
      wipImages: [],
      showWipHistory: false,
      featuring: [],
      tags: [],
      ...rest,
    },
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

describe("castWithSubject", () => {
  const wuff: FeaturedCharacter = { kind: "character", name: "Wuff", slug: "wuff" };
  const vex: Featured = { kind: "friend", name: "Vex", slug: "vex", links: [] };

  test("puts the subject first, ahead of everyone else", () => {
    expect(castWithSubject(wuff, [vex])).toEqual([wuff, vex]);
  });

  test("adds the subject to a picture that lists nobody", () => {
    expect(castWithSubject(wuff, [])).toEqual([wuff]);
  });

  test("does not repeat a subject that is still stored alongside the others", () => {
    expect(castWithSubject(wuff, [wuff, vex])).toEqual([wuff, vex]);
  });

  test("a friend sharing the subject's slug is a different person", () => {
    const namesake: Featured = {
      kind: "friend",
      name: "Wuff",
      slug: "wuff",
      links: [],
    };
    expect(castWithSubject(wuff, [namesake])).toEqual([wuff, namesake]);
  });

  test("without a resolved subject the stored cast is left as it is", () => {
    expect(castWithSubject(undefined, [vex])).toEqual([vex]);
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

  test("hides in-progress work unless it is asked for", () => {
    const wip = item("wuff", "sfw", { slug: "cooking", isWip: true });
    expect(matchesFilter(wip, {})).toBe(false);
    expect(matchesFilter(wip, { includeWip: true })).toBe(true);
  });
});

describe("sortExamples", () => {
  test("keeps finished work ahead of WIP while preserving relative order", () => {
    const examples: Example[] = [
      {
        slug: "a",
        title: "a",
        updatedAt: stamp,
        src: image,
        isWip: false,
        overviewDisplay: "generated",
        wipImages: [],
        showWipHistory: false,
        featuring: [],
        tags: [],
      },
      {
        slug: "b",
        title: "b",
        updatedAt: stamp,
        isWip: true,
        overviewDisplay: "generated",
        wipImages: [],
        showWipHistory: false,
        featuring: [],
        tags: [],
      },
      {
        slug: "c",
        title: "c",
        updatedAt: stamp,
        src: image,
        isWip: false,
        overviewDisplay: "generated",
        wipImages: [],
        showWipHistory: false,
        featuring: [],
        tags: [],
      },
    ];
    expect(sortExamples(examples).map((entry) => entry.slug)).toEqual(["a", "c", "b"]);
  });
});

describe("exampleThumb", () => {
  test("prefers the final image, then overview, then the first WIP sketch", () => {
    const overview = { ...image, src: "/media/overview.png" };
    const sketch = { ...image, src: "/media/sketch.png" };
    expect(
      exampleThumb({
        slug: "x",
        title: "x",
        updatedAt: stamp,
        src: image,
        overviewImage: overview,
        isWip: true,
        overviewDisplay: "wipImage",
        wipImages: [{ src: sketch }],
        showWipHistory: false,
        featuring: [],
        tags: [],
      }),
    ).toBe(image);
    expect(
      exampleThumb({
        slug: "x",
        title: "x",
        updatedAt: stamp,
        overviewImage: overview,
        isWip: true,
        overviewDisplay: "wipImage",
        wipImages: [{ src: sketch }],
        showWipHistory: false,
        featuring: [],
        tags: [],
      }),
    ).toBe(overview);
    expect(
      exampleThumb({
        slug: "x",
        title: "x",
        updatedAt: stamp,
        isWip: true,
        overviewDisplay: "generated",
        wipImages: [{ src: sketch }],
        showWipHistory: false,
        featuring: [],
        tags: [],
      }),
    ).toBe(sketch);
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
