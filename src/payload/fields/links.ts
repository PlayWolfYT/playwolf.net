import type { Field, TextFieldSingleValidation } from "payload";

import { isEmailAddress, isHttpUrl } from "@/lib/safe-url";

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
 * The stored value goes straight into an `href` (see `LinkRow`), so the scheme
 * is the thing to pin down: `javascript:` here would be a stored XSS on every
 * page that renders the row. What counts as valid depends on `kind` — `email`
 * holds a bare address and gets its `mailto:` at render time, while every other
 * kind needs an absolute http(s) URL, since a bare `playwolf.net` would resolve
 * against the current page.
 */
const validateLinkUrl: TextFieldSingleValidation = (value, options) => {
  if (typeof value !== "string" || !value.trim()) return "A URL is required.";
  const url = value.trim();
  const kind = (options.siblingData as { kind?: unknown } | undefined)?.kind;

  if (kind === "email") {
    return isEmailAddress(url)
      ? true
      : "Email links store a bare address, e.g. `hi@playwolf.net` (no `mailto:`).";
  }

  return isHttpUrl(url)
    ? true
    : "Enter a full http(s) URL, e.g. `https://playwolf.net`.";
};

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
        validate: validateLinkUrl,
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
