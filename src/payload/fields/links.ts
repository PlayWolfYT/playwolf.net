import type { Field } from "payload";

/**
 * Link kinds the frontend knows how to render an icon for. Mirrors the keys of
 * the old `ArtistSocials` type, but as an ordered array so a person can hold
 * two Telegrams (Velvet, CocoStinks) without the shape changing.
 */
export const LINK_KINDS = [
  "website",
  "twitter",
  "bluesky",
  "instagram",
  "twitch",
  "youtube",
  "furaffinity",
  "vgen",
  "linktree",
  "kofi",
  "patreon",
  "boosty",
  "trello",
  "telegram",
  "discord",
  "email",
] as const;

export type LinkKind = (typeof LINK_KINDS)[number];

const LINK_KIND_LABELS: Record<LinkKind, string> = {
  website: "Website",
  twitter: "Twitter / X",
  bluesky: "Bluesky",
  instagram: "Instagram",
  twitch: "Twitch",
  youtube: "YouTube",
  furaffinity: "FurAffinity",
  vgen: "VGen",
  linktree: "Linktree",
  kofi: "Ko-fi",
  patreon: "Patreon",
  boosty: "Boosty",
  trello: "Trello",
  telegram: "Telegram",
  discord: "Discord",
  email: "Email",
};

const LINK_URL_FIELD = "@/payload/components/LinkUrlField#LinkUrlField";

/**
 * Ordered social/contact links. `description` fills the tooltip for entries
 * that need one ("private", "Art Channel"); newlines are allowed.
 *
 * URL comes first so pasting one can auto-select `kind` (see LinkUrlField).
 */
export function linksField(label?: string): Field {
  return {
    name: "links",
    type: "array",
    label,
    labels: { singular: "Link", plural: "Links" },
    admin: {
      initCollapsed: true,
      components: {
        RowLabel: "@/payload/components/LinkRowLabel#LinkRowLabel",
      },
    },
    fields: [
      {
        name: "url",
        type: "text",
        required: true,
        admin: {
          description: "Full URL, or a bare address when the kind is Email.",
          components: {
            Field: LINK_URL_FIELD,
          },
        },
      },
      {
        name: "kind",
        type: "select",
        required: true,
        defaultValue: "website",
        options: LINK_KINDS.map((kind) => ({
          label: LINK_KIND_LABELS[kind],
          value: kind,
        })),
        admin: {
          description:
            "Chosen from the URL when you paste one; change it if the guess is wrong.",
        },
      },
      {
        name: "description",
        type: "textarea",
        admin: {
          description: "Optional tooltip text, e.g. “private” or “Art Channel”.",
        },
      },
    ],
  };
}
