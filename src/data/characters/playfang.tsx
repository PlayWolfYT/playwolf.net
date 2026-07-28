import { artists } from "@/data/artists";
import { defineExamples, type Character } from "@/data/types";

import cover from "@/assets/art/playfang/cover.png";

import originalCharacterArt from "@/assets/art/playfang/nsfw/examples/original-character-art.png";

export const playfang: Character = {
  slug: "playfang",
  name: "PlayFang",
  species: "Dragon",
  mainArt: {
    src: cover,
    alt: "PlayFang",
    artist: artists.Deathlight,
  },
  profiles: {
    nsfw: {
      label: "After Dark",
      accentColor: "#B146EE",
      description: (
        <>
          <p>Hey you! What are you doing in my land?!</p>
          <p>
            You&apos;re not looking to get in trouble with the{" "}
            <b>Royal Family</b>, are you?
          </p>
          <p>
            <b>HEY!</b> Don- dont... dont touch my horns like that! They&apos;re
            sensitive~...
          </p>
        </>
      ),
      examples: defineExamples([
        {
          slug: "original-character-art",
          title: "Original Character Art",
          src: originalCharacterArt,
          artist: artists.Deathlight,
        },
      ]),
    },
  },
};
