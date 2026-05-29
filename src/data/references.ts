/**
 * Reference / art data. Edit this file directly to add reference sheets or
 * examples — TypeScript provides type-checking and autocomplete for every
 * field.
 *
 * Image `src` values are paths under `public/` (e.g. `/examples/foo.png`).
 *
 * Full example entry (every field is optional except slug/title/src/nsfw):
 *
 *   {
 *     slug: "fluffy-by-someartist",
 *     title: "Fluffy",
 *     src: "/examples/fluffy.png",
 *     nsfw: false,
 *     artist: {
 *       name: "SomeArtist",
 *       socials: {
 *         // A plain URL: the handle is inferred from it (-> "X (Twitter) (@someartist)").
 *         twitter: "https://x.com/someartist",
 *         // ...or { url, description } to label it explicitly in the tooltip.
 *         instagram: { url: "https://instagram.com/someartist", description: "main" },
 *         furaffinity: "https://www.furaffinity.net/user/someartist",
 *         vgen: "https://vgen.co/someartist",
 *         linktree: "https://linktr.ee/someartist",
 *         kofi: "https://ko-fi.com/someartist",
 *         trello: "https://trello.com/someartist",
 *         telegram: [
 *           { url: "https://t.me/abc", description: "private" },
 *           { url: "https://t.me/abc_art", description: "Art Channel" },
 *         ],
 *         email: "someartist@example.com",
 *       },
 *     },
 *   }
 */

/**
 * A single social link: either a plain URL (the handle is inferred from it),
 * or `{ url, description }` where `description` is shown in the tooltip (e.g.
 * "private", "Art Channel"). Descriptions may contain `\n` for multi-line
 * tooltips. For `email`, `url` is the bare address.
 */
export type SocialEntry = string | { url: string; description?: string };

/**
 * Artist social links. Every field is optional — only provided ones render.
 * `telegram` may list multiple entries.
 */
export type ArtistSocials = {
  twitter?: SocialEntry;
  instagram?: SocialEntry;
  furaffinity?: SocialEntry;
  vgen?: SocialEntry;
  linktree?: SocialEntry;
  kofi?: SocialEntry;
  trello?: SocialEntry;
  telegram?: SocialEntry[];
  email?: SocialEntry;
  website?: SocialEntry;
};

export type Artist = {
  name: string;
  socials?: ArtistSocials;
};

export type Example = {
  /** URL-safe identifier used in `/ref/examples/[slug]` routes */
  slug: string;
  /** Human-friendly title shown in the UI and embeds */
  title: string;
  /** Path under `public/`, e.g. `/nsfw-reference.png` */
  src: string;
  /** When true, hidden from the SFW grid and gated behind the blur reveal */
  nsfw: boolean;
  /** Optional crediting info shown in a bar below the full image */
  artist?: Artist;
};

export type RefSheetKey = "sfw" | "nsfw";

export type RefSheet = {
  title: string;
  src: string;
  description?: string;
  /** When true, the sheet is gated behind the blur reveal */
  nsfw: boolean;
  /** Optional crediting info shown in a bar below the sheet */
  artist?: Artist;
};

/*
===================== ARTISTS =====================
*/
const artists: Record<string, Artist> = {
  Deathlight: {
    name: "Deathlight_K",
    socials: {
      trello: {
        url: "https://trello.com/b/yy9Znbcb",
        description: "Commission Queue",
      },
      telegram: ["https://t.me/Deathlight_k"],
      twitter: "https://x.com/deathlight_k",
      furaffinity: "https://www.furaffinity.net/user/deathlightk/",
      instagram: "https://www.instagram.com/deathlight_k/",
      kofi: "https://ko-fi.com/deathlightk",
      website: {
        url: "https://deathkcommprices.carrd.co/",
        description: "Commission Prices",
      },
    },
  },
} as const;

/*
===================== REFERENCES =====================
*/

/** The two reference sheets surfaced at `/ref/sfw` and `/ref/nsfw`. */
export const refSheets: Record<RefSheetKey, RefSheet> = {
  sfw: {
    title: "SFW Reference Sheet",
    src: "/art/sfw/reference-sheet.jpg",
    description: "Official SFW reference sheet.",
    nsfw: false,
    artist: artists.Deathlight,
  },
  nsfw: {
    title: "NSFW Reference Sheet",
    src: "/art/nsfw/reference-sheet.jpg",
    description: "Official NSFW reference sheet (18+).",
    nsfw: true,
    artist: artists.Deathlight,
  },
};

/*
===================== EXAMPLES =====================
*/

/** Art examples surfaced at `/ref/examples` (SFW) and `/ref/examples/nsfw`. */
export const examples: Example[] = [
  {
    slug: "original-character-art",
    title: "Original Character Art",
    src: "/art/nsfw/examples/original-character-art.png",
    nsfw: true,
    artist: artists.Deathlight,
  },
];
