import { Crown, Flame, Gem, Moon, Pencil, Sparkles, Star } from "lucide-react";
import { artists } from "@/data/artists";
import { defineExamples, type Character } from "@/data/types";
import { NSFW_WIP_QUOTES } from "@/lib/sheet-wip";

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
      sheet: {
        title: "Refsheet",
        artist: artists.Deathlight,
        wip: {
          subtitle: "The mighty dragon is getting a refsheet... soon™",
          icons: [Flame, Crown, Gem, Sparkles, Star, Moon, Pencil],
          gradient: ["#7C3AED", "#B146EE", "#E879F9"],
          quotes: [
            ...NSFW_WIP_QUOTES,
            "Horns need more polish",
            "Royal proportions pending",
            "Measuring the dragon's hoard",
            "Dripping purple magic",
            "Steaming up the dragon's lair",
            "Preparing the tail for action",
            "Taming the white beast",
            "Unlocking the dragon's vault",
            "Getting pinned by the tail"
          ],
        },
      },
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
