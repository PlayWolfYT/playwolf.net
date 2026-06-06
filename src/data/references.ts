import type { StaticImageData } from "next/image";

import nsfwRefSheet from "@/assets/art/nsfw/reference-sheet.jpg";
import backshots from "@/assets/art/nsfw/examples/backshots.png";
import cocoBackview from "@/assets/art/nsfw/examples/coco_backview.png";
import originalCharacterArt from "@/assets/art/nsfw/examples/original-character-art.png";
import steppiesDeastratit from "@/assets/art/nsfw/examples/steppies_deastratit.PNG";
import wybeHalloween from "@/assets/art/nsfw/examples/wybe_halloween.png";
import ychFriendHand from "@/assets/art/nsfw/examples/ych_friend_hand.jpg";
import sfwRefSheet from "@/assets/art/sfw/reference-sheet.jpg";
import kissCamTaire from "@/assets/art/sfw/examples/kiss_cam_taire.png";
import maw from "@/assets/art/sfw/examples/maw.jpg";
import playwolfPawbsYch from "@/assets/art/sfw/examples/playwolf_pawbs_ych.png";
import sillyPlay from "@/assets/art/sfw/examples/silly_play.png";
import velvetTaire from "@/assets/art/sfw/examples/velvet_taire.PNG";

/**
 * Reference / art data. Edit this file directly to add reference sheets or
 * examples — TypeScript provides type-checking and autocomplete for every
 * field.
 *
 * Image `src` values are static imports from `src/assets/art/` — add the file,
 * import it at the top of this file, and reference the binding below.
 * `next build` fails if the import path is wrong or the file is missing.
 *
 * Full example entry (every field is optional except slug/title/src/nsfw):
 *
 *   {
 *     slug: "fluffy-by-someartist",
 *     title: "Fluffy",
 *     src: fluffyImage,
 *     nsfw: false,
 *     artist: {
 *       name: "SomeArtist",
 *       socials: {
 *         // A plain URL: the handle is inferred from it (-> "X (Twitter) (@someartist)").
 *         twitter: "https://x.com/someartist",
 *         bluesky: "https://bsky.app/profile/someartist.bsky.social",
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
 *         website: [
 *           { url: "https://someartist.carrd.co", description: "Link Directory" },
 *           { url: "https://someartist.com", description: "Portfolio" },
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
 * `telegram` and `website` may list multiple entries.
 */
export type ArtistSocials = {
  twitter?: SocialEntry;
  bluesky?: SocialEntry;
  instagram?: SocialEntry;
  furaffinity?: SocialEntry;
  vgen?: SocialEntry;
  linktree?: SocialEntry;
  kofi?: SocialEntry;
  trello?: SocialEntry;
  telegram?: SocialEntry[];
  email?: SocialEntry;
  website?: SocialEntry | SocialEntry[];
};

export type Artist = {
  name: string;
  socials?: ArtistSocials;
};

type AlphabetLower =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";
type Digits = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type ValidSlugChar = AlphabetLower | Digits | "-";

/**
 * Recursively checks if a string contains only lowercase letters, digits, or hyphens.
 */
type ValidateSlug<S extends string, Original extends string = S> = S extends ""
  ? Original
  : S extends `${infer Char}${infer Rest}`
    ? Char extends ValidSlugChar
      ? ValidateSlug<Rest, Original>
      : never // Fails validation if an invalid character (like a space or uppercase) is found
    : never;

export type Example<T extends string = string> = {
  /** URL-safe identifier used in `/ref/examples/[slug]` routes */
  slug: ValidateSlug<T>;
  /** Human-friendly title shown in the UI and embeds */
  title: string;
  /** Static import from `src/assets/art/` */
  src: StaticImageData;
  /** When true, hidden from the SFW grid and gated behind the blur reveal */
  nsfw: boolean;
  /** Optional crediting info shown in a bar below the full image */
  artist?: Artist;
};

export type RefSheetKey = "sfw" | "nsfw";

export type RefSheet = {
  title: string;
  src: StaticImageData;
  description?: string;
  /** When true, the sheet is gated behind the blur reveal */
  nsfw: boolean;
  /** Optional crediting info shown in a bar below the sheet */
  artist?: Artist;
};

/*
===================== ARTISTS =====================
*/
const artists = {
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
  Sir_Burnt: {
    name: "Sir Burnt",
    socials: {
      instagram: "https://www.instagram.com/Sir_burnt",
      twitter: "https://x.com/Sir_Burnt",
      bluesky: "https://bsky.app/profile/sirburnt.bsky.social",
      telegram: ["https://t.me/sirburnt"],
      vgen: "https://vgen.co/Sir_Burnt",
      website: {
        url: "https://sirburnt.carrd.co",
        description: "Link Directory",
      },
    },
  },
  HaruClearing: {
    name: "Haru Clearing (Narwillt)",
    socials: {
      telegram: ["https://t.me/HaruClearingNarwillt"],
      twitter: "https://x.com/Narwillt",
      bluesky: "https://bsky.app/profile/narwilltharu.bsky.social",
      trello: {
        url: "https://trello.com/b/bI07yJNY/harus-queue",
        description: "Commission Queue",
      },
      furaffinity: "https://www.furaffinity.net/user/narwillt",
      website: {
        url: "https://harusclearing.carrd.co",
        description: "Link Directory",
      },
    },
  },
  Velvet: {
    name: "Velvet",
    socials: {
      twitter: "https://x.com/Velvetbun16",
      telegram: [
        {
          url: "https://t.me/Velvetbun16",
          description: "Velvetbun16",
        },
        {
          url: "https://t.me/Velvetbunart",
          description: "Art Channel",
        },
      ],
    },
  },
  masitadearte: {
    name: "masitadearte",
    socials: {
      vgen: "https://vgen.co/masitadearte",
      instagram: "https://www.instagram.com/masita_arts/",
      twitter: "https://x.com/masitadearte",
      website: {
        url: "https://www.deviantart.com/masitadearte",
        description: "DeviantArt",
      },
    },
  },
  CocoStinks: {
    name: "CocoStinks",
    socials: {
      twitter: "https://x.com/CocoStinks",
      telegram: [
        {
          url: "https://t.me/CocoSkunk",
          description: "@CocoSkunk",
        },
        {
          url: "https://t.me/CocoStinks",
          description: "Art Channel",
        },
      ],
      website: [
        {
          url: "https://cocostinks.carrd.co",
          description: "Link Directory",
        },
        {
          url: "https://dsc.gg/cocostinks",
          description: "Discord Server",
        },
      ],
    },
  },
  Deastratit: {
    name: "Deastratit",
    socials: {
      twitter: "https://x.com/deastratit",
      bluesky: "https://bsky.app/profile/deastratit.bsky.social",
      telegram: [
        {
          url: "https://t.me/deastratitUwU",
          description: "Art Channel",
        },
      ],
      furaffinity: "https://www.furaffinity.net/user/deastratit/",
      website: {
        url: "https://www.deviantart.com/deastratit",
        description: "DeviantArt",
      },
    },
  },
  Wybe: {
    name: "Wybe",
    socials: {
      instagram: "https://www.instagram.com/wybeborne/",
      twitter: "https://x.com/wybe_borne",
      website: {
        url: "https://wybeborne.carrd.co",
        description: "Link Directory",
      },
    },
  },
  LapSnep: {
    name: "Emmy / LapSnep",
    socials: {
      vgen: "https://vgen.co/LapSnep",
      twitter: "https://x.com/Jeff_artsk",
      telegram: ["https://t.me/jeff_artsk"],
    },
  },
} satisfies Record<string, Artist>;

/*
===================== REFERENCES =====================
*/

/** The two reference sheets surfaced at `/ref/sfw` and `/ref/nsfw`. */
export const refSheets: Record<RefSheetKey, RefSheet> = {
  sfw: {
    title: "SFW Reference Sheet",
    src: sfwRefSheet,
    description: "Official SFW reference sheet.",
    nsfw: false,
    artist: artists.Deathlight,
  },
  nsfw: {
    title: "NSFW Reference Sheet",
    src: nsfwRefSheet,
    description: "Official NSFW reference sheet (18+).",
    nsfw: true,
    artist: artists.Deathlight,
  },
};

/*
===================== EXAMPLES =====================
*/

// Helper function to enforce inline slug validation
const defineExamples = <const T extends Example<any>[]>(
  arr: T & { [K in keyof T]: Example<T[K]["slug"]> },
) => arr;

/** Art examples surfaced at `/ref/examples` (SFW) and `/ref/examples/nsfw`. */
export const examples: Example[] = defineExamples([
  // SFW Examples
  {
    slug: "maw",
    title: "Maw Shot",
    src: maw,
    nsfw: false,
    artist: artists.Deathlight,
  },
  {
    slug: "pawbs-ych",
    title: "Pawbs YCH",
    src: playwolfPawbsYch,
    nsfw: false,
    artist: artists.HaruClearing,
  },
  {
    slug: "silly",
    title: "Silly",
    src: sillyPlay,
    nsfw: false,
  },
  {
    slug: "lifted-w-taire",
    title: "Lifted (with Taire)",
    src: velvetTaire,
    nsfw: false,
    artist: artists.Velvet,
  },
  {
    slug: "kiss-cam-w-taire",
    title: "Kiss Cam (With Taire)",
    src: kissCamTaire,
    nsfw: false,
    artist: artists.Sir_Burnt,
  },

  // NSFW Examples
  {
    slug: "original-character-art",
    title: "Original Character Art",
    src: originalCharacterArt,
    nsfw: true,
    artist: artists.Deathlight,
  },
  {
    slug: "backview",
    title: "Back View",
    src: cocoBackview,
    nsfw: true,
    artist: artists.CocoStinks,
  },
  {
    slug: "steppies",
    title: "Steppies~",
    src: steppiesDeastratit,
    nsfw: true,
    artist: artists.Deastratit,
  },
  {
    slug: "backshots",
    title: "Backshots",
    src: backshots,
    nsfw: true,
    artist: artists.masitadearte,
  },
  {
    slug: "halloween",
    title: "Halloween Mummie",
    src: wybeHalloween,
    nsfw: true,
    artist: artists.Wybe,
  },
  {
    slug: "friendly-hands",
    title: "Friendly Hands YCH",
    src: ychFriendHand,
    nsfw: true,
    artist: artists.LapSnep,
  },
]);
