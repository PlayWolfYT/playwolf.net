import { defineExamples, type Character } from "@/data/types";
import { artists } from "@/data/artists";

import cover from "@/assets/art/playwuff/cover.png";

// SFW
import sfwRefSheet from "@/assets/art/playwuff/sfw/reference-sheet.jpg";
import kissCamTaire from "@/assets/art/playwuff/sfw/examples/kiss_cam_taire.png";
import maw from "@/assets/art/playwuff/sfw/examples/maw.jpg";
import playwolfPawbsYch from "@/assets/art/playwuff/sfw/examples/playwolf_pawbs_ych.png";
import sillyPlay from "@/assets/art/playwuff/sfw/examples/silly_play.png";
import velvetTaire from "@/assets/art/playwuff/sfw/examples/velvet_taire.PNG";
import hugTaire from "@/assets/art/playwuff/sfw/examples/hug_taire.png";
import sillyPan from "@/assets/art/playwuff/sfw/examples/silly_pan.jpg";

// NSFW
import nsfwRefSheet from "@/assets/art/playwuff/nsfw/reference-sheet.jpg";
import backshots from "@/assets/art/playwuff/nsfw/examples/backshots.png";
import cocoBackview from "@/assets/art/playwuff/nsfw/examples/coco_backview.png";
import originalCharacterArt from "@/assets/art/playwuff/nsfw/examples/original-character-art.png";
import steppiesDeastratit from "@/assets/art/playwuff/nsfw/examples/steppies_deastratit.PNG";
import wybeHalloween from "@/assets/art/playwuff/nsfw/examples/wybe_halloween.png";
import ychFriendHand from "@/assets/art/playwuff/nsfw/examples/ych_friend_hand.jpg";
import beachBlowie from "@/assets/art/playwuff/nsfw/examples/beach_blowie.png";
import pawLick from "@/assets/art/playwuff/nsfw/examples/paw_lick.png";
import serviceTopVex from "@/assets/art/playwuff/nsfw/examples/service_top_vex.jpg";

/**
 * Reference / art data for PlayWuff. Each profile (`sfw` / `nsfw`) is a full
 * standalone view: its own description, reference sheet and example gallery.
 * Edit this file to add pieces — TypeScript provides type-checking and
 * autocomplete for every field.
 *
 * Image `src` values are static imports from `src/assets/art/playwuff/` — add
 * the file, import it at the top, and reference the binding below.
 * `next build` fails if the import path is wrong or the file is missing.
 *
 * Full example entry (every field is optional except slug/title/src):
 *
 *   {
 *     slug: "fluffy-by-someartist",
 *     title: "Fluffy",
 *     src: fluffyImage,
 *     artist: {
 *       name: "SomeArtist",
 *       socials: {
 *         twitter: "https://x.com/someartist",
 *         telegram: [
 *           { url: "https://t.me/abc", description: "private" },
 *         ],
 *       },
 *     },
 *   }
 */

export const playwuff = {
  slug: "playwuff",
  name: "PlayWuff",
  species: "Husky/Shepherd-Mix",
  mainArt: {
    src: cover,
    alt: "PlayWuff",
    artist: artists.Deathlight,
  },
  profiles: {
    sfw: {
      label: "SFW",
      accentColor: "#68C3EF",
      description: (
        <>
          <p>Wruff!</p>
          <p>I&apos;m PlayWuff, im a cute but shy Doggo!</p>
          <p>Always up for cuddles, feel free to approach me! :3</p>
        </>
      ),
      sheet: {
        title: "SFW Reference Sheet",
        src: sfwRefSheet,
        description: "Official SFW reference sheet.",
        artist: artists.Deathlight,
      },
      examples: defineExamples([
        {
          slug: "maw",
          title: "Maw Shot",
          src: maw,
          artist: artists.Deathlight,
        },
        {
          slug: "pawbs-ych",
          title: "Pawbs YCH",
          src: playwolfPawbsYch,
          artist: artists.HaruClearing,
        },
        {
          slug: "silly",
          title: "Silly",
          src: sillyPlay,
        },
        {
          slug: "hug-taire",
          title: "Hug (with Taire)",
          src: hugTaire,
          artist: artists.Sir_Burnt,
        },
        {
          slug: "lifted-w-taire",
          title: "Lifted (with Taire)",
          src: velvetTaire,
          artist: artists.Velvet,
        },
        {
          slug: "kiss-cam-w-taire",
          title: "Kiss Cam (With Taire)",
          src: kissCamTaire,
          artist: artists.meteormutt,
        },
        {
          slug: "silly-pan",
          title: "Silly Pan",
          src: sillyPan,
          artist: artists.Deathlight,
        },
      ]),
    },
    nsfw: {
      label: "After Dark",
      accentColor: "#ff543a",
      description: (
        <>
          <p>P..Paws~?</p>
          <p>Yea...you could say I like those~</p>
          <p>You wanna trade paw pics~...? &gt;.&lt;</p>
        </>
      ),
      sheet: {
        title: "NSFW Reference Sheet",
        src: nsfwRefSheet,
        description: "Official NSFW reference sheet (18+).",
        artist: artists.Deathlight,
      },
      examples: defineExamples([
        {
          slug: "original-character-art",
          title: "Original Character Art",
          src: originalCharacterArt,
          artist: artists.Deathlight,
        },
        {
          slug: "backview",
          title: "Back View",
          src: cocoBackview,
          artist: artists.CocoStinks,
        },
        {
          slug: "steppies",
          title: "Steppies~",
          src: steppiesDeastratit,
          artist: artists.Deastratit,
        },
        {
          slug: "backshots",
          title: "Backshots",
          src: backshots,
          artist: artists.masitadearte,
        },
        {
          slug: "halloween",
          title: "Halloween Mummie",
          src: wybeHalloween,
          artist: artists.Wybe,
        },
        {
          slug: "friendly-hands",
          title: "Friendly Hands YCH",
          src: ychFriendHand,
          artist: artists.LapSnep,
        },
        {
          slug: "beach-blowie",
          title: "Beach Blowie",
          src: beachBlowie,
          artist: artists.Ishinn,
        },
        {
          slug: "paw-lick",
          title: "Paw Lick",
          src: pawLick,
          artist: artists.InkO,
        },
        {
          slug: "service-top-vex",
          title: "Service Top (with VexWusky)",
          src: serviceTopVex,
          artist: artists.Deathlight,
        },
      ]),
    },
  },
} satisfies Character<"playwuff">;
