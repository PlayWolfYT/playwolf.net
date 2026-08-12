import type { CollectionConfig, FieldAccess } from "payload";
import { ValidationError } from "payload";

import { addInterval, type ReminderUnit } from "@/lib/reminders";
import { anyone, authenticated } from "../access";
import { wipFields } from "../fields/profile";
import { slugField } from "../fields/slug";
import { withAdminCondition } from "../fields/adminCondition";
import { bySlug, revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("artworks", {
  extraTags: bySlug,
});

/** Field-level gate: public/local reads without a user never see these. */
const authenticatedField: FieldAccess = ({ req }) => Boolean(req.user);

/**
 * A relationship reaches a hook either as a bare id or as the resolved
 * document, depending on the depth of the operation that triggered it.
 */
function idOf(value: unknown): number | undefined {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return value.trim() === "" || Number.isNaN(parsed) ? undefined : parsed;
  }

  if (value && typeof value === "object" && "id" in value) {
    return idOf((value as { id: unknown }).id);
  }

  return undefined;
}

/** One entry of a polymorphic `hasMany` relationship, as Payload stores it. */
function isPolymorphicValue(
  entry: unknown,
): entry is { relationTo: string; value: unknown } {
  return typeof entry === "object" && entry !== null && "relationTo" in entry;
}

function lifecycleOf(
  data: { lifecycle?: string | null } | null | undefined,
  originalDoc: { lifecycle?: string | null } | null | undefined,
): "complete" | "in_progress" {
  const value = data?.lifecycle ?? originalDoc?.lifecycle ?? "complete";
  return value === "in_progress" ? "in_progress" : "complete";
}

function hasImage(
  data: { image?: unknown } | null | undefined,
  originalDoc: { image?: unknown } | null | undefined,
): boolean {
  const image = data?.image !== undefined ? data.image : originalDoc?.image;
  if (image === null || image === undefined || image === "") return false;
  return true;
}

/**
 * A single piece of art. Its own collection because it is what gets added most
 * often — one form per upload rather than editing a growing array inside a
 * character.
 */
export const Artworks: CollectionConfig = {
  slug: "artworks",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: [
      "title",
      "lifecycle",
      "character",
      "profile",
      "artist",
      "updatedAt",
    ],
    group: "Content",
    useAsTitle: "title",
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        if (!data) return data;

        const lifecycle = lifecycleOf(data, originalDoc);
        if (lifecycle === "complete" && !hasImage(data, originalDoc)) {
          throw new ValidationError({
            collection: "artworks",
            errors: [
              {
                message: "Final image is required when lifecycle is complete.",
                path: "image",
              },
            ],
            req,
          });
        }

        return data;
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data;

        const reminder = data.reminder ?? originalDoc?.reminder;
        if (!reminder?.enabled) return data;

        const nextAt = data.reminder?.nextAt ?? originalDoc?.reminder?.nextAt;
        if (nextAt) return data;

        const interval =
          data.reminder?.interval ?? originalDoc?.reminder?.interval ?? 1;
        const unit = (data.reminder?.unit ??
          originalDoc?.reminder?.unit ??
          "weeks") as ReminderUnit;

        data.reminder = {
          ...(typeof reminder === "object" && reminder !== null ? reminder : {}),
          ...data.reminder,
          enabled: true,
          interval,
          unit,
          nextAt: addInterval(new Date(), interval, unit).toISOString(),
        };

        return data;
      },
    ],
    afterChange,
    afterDelete,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description:
          "Just the subject. Who else is in the picture belongs in “Also featuring”, not the title.",
      },
    },
    // Two characters may each have a "hug", so uniqueness is scoped by the
    // character + profile pair in the URL rather than enforced site-wide.
    slugField({ from: "title", unique: false }),
    {
      type: "row",
      fields: [
        {
          name: "character",
          type: "relationship",
          relationTo: "characters",
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "profile",
          type: "select",
          required: true,
          defaultValue: "sfw",
          options: [
            { label: "SFW", value: "sfw" },
            { label: "After Dark", value: "nsfw" },
          ],
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "lifecycle",
      type: "select",
      defaultValue: "complete",
      options: [
        { label: "Complete", value: "complete" },
        { label: "In progress", value: "in_progress" },
      ],
      admin: {
        description:
          "In-progress commissions can ship without a final image and show WIP sketches instead.",
        position: "sidebar",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      // Required when lifecycle is complete — enforced in beforeValidate so
      // in-progress commissions can omit the final deliverable.
      admin: {
        description: "Final artwork. Required once the piece is marked complete.",
      },
    },
    {
      name: "altImages",
      type: "array",
      label: "Alternate versions (inline images)",
      labels: { singular: "Alt image", plural: "Alt images" },
      admin: {
        description:
          "Lightweight variants (outfit swap, alternate pose) shown as a carousel on this artwork's page. Same rating as this artwork. Counterparts that deserve their own page belong in “Alternate versions (linked artworks)” instead.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "label",
          type: "text",
          admin: { description: "Shown as the slide caption, e.g. “casual outfit”." },
        },
      ],
    },
    {
      name: "altArtworks",
      type: "relationship",
      relationTo: "artworks",
      hasMany: true,
      label: "Alternate versions (linked artworks)",
      admin: {
        description:
          "Independent artworks that are versions of this one (e.g. the After Dark counterpart). Link one side only — the other side lists this artwork automatically.",
      },
      filterOptions: ({ id }) => {
        const self = idOf(id);
        return self === undefined ? true : { id: { not_equals: self } };
      },
    },
    {
      // Reverse of `altArtworks`: which artworks name this one as a version.
      // Editors never touch it; the frontend merges both directions into one
      // symmetric alt group, so linking a single side is enough.
      name: "altOf",
      type: "join",
      collection: "artworks",
      on: "altArtworks",
      label: "Alternate version of",
      admin: {
        description: "Artworks that link this one as an alternate version.",
      },
    },
    withAdminCondition(
      {
        name: "commission",
        type: "group",
        label: "Commission status",
        access: {
          read: authenticatedField,
          update: authenticatedField,
        },
        fields: [
          {
            name: "paid",
            type: "checkbox",
            defaultValue: false,
          },
          {
            name: "artistStarted",
            type: "checkbox",
            defaultValue: false,
            label: "Artist started",
          },
          {
            name: "lastArtistUpdateAt",
            type: "date",
            label: "Last artist update",
            admin: {
              date: { pickerAppearance: "dayAndTime" },
            },
          },
          {
            name: "lastArtistUpdateNote",
            type: "textarea",
            label: "Last update note",
          },
        ],
      },
      (_, siblingData) => siblingData?.lifecycle === "in_progress",
    ),
    {
      name: "wipImages",
      type: "array",
      label: "WIP sketches",
      labels: { singular: "WIP image", plural: "WIP images" },
      admin: {
        description:
          "Progress sketches. Kept after completion when “Show WIP history” is on.",
        initCollapsed: true,
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "caption",
          type: "text",
        },
        {
          name: "addedAt",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayAndTime" },
          },
        },
      ],
    },
    withAdminCondition(
      {
        name: "overviewDisplay",
        type: "select",
        defaultValue: "generated",
        options: [
          { label: "Generated placeholder", value: "generated" },
          { label: "WIP image", value: "wipImage" },
        ],
        admin: {
          description: "What the overview / gallery card shows while in progress.",
        },
      },
      (_, siblingData) => siblingData?.lifecycle === "in_progress",
    ),
    withAdminCondition(
      {
        name: "overviewWipImage",
        type: "upload",
        relationTo: "media",
        admin: {
          description: "Should be one of the WIP sketches above.",
        },
      },
      (_, siblingData) =>
        siblingData?.lifecycle === "in_progress" &&
        siblingData?.overviewDisplay === "wipImage",
    ),
    withAdminCondition(
      {
        name: "wipPlaceholder",
        type: "group",
        label: "Placeholder options",
        fields: wipFields,
      },
      (_, siblingData) => siblingData?.lifecycle === "in_progress",
    ),
    {
      name: "showWipHistory",
      type: "checkbox",
      defaultValue: false,
      label: "Show WIP history when complete",
      admin: {
        description:
          "When the piece is finished, still show the WIP sketches on the public detail page.",
      },
    },
    withAdminCondition(
      {
        name: "reminder",
        type: "group",
        label: "Follow-up reminder",
        access: {
          read: authenticatedField,
          update: authenticatedField,
        },
        fields: [
          {
            name: "enabled",
            type: "checkbox",
            defaultValue: false,
          },
          {
            type: "row",
            fields: [
              {
                name: "interval",
                type: "number",
                defaultValue: 1,
                min: 1,
                admin: { width: "50%" },
              },
              {
                name: "unit",
                type: "select",
                defaultValue: "weeks",
                options: [
                  { label: "Days", value: "days" },
                  { label: "Weeks", value: "weeks" },
                  { label: "Months", value: "months" },
                ],
                admin: { width: "50%" },
              },
            ],
          },
          {
            name: "nextAt",
            type: "date",
            label: "Next reminder",
            admin: {
              date: { pickerAppearance: "dayAndTime" },
              description: "Filled automatically when reminders are enabled.",
            },
          },
          {
            name: "lastSentAt",
            type: "date",
            label: "Last sent",
            admin: {
              date: { pickerAppearance: "dayAndTime" },
              readOnly: true,
            },
          },
        ],
      },
      (_, siblingData) => siblingData?.lifecycle === "in_progress",
    ),
    {
      name: "artist",
      type: "relationship",
      relationTo: "artists",
    },
    {
      // Polymorphic on purpose: one field covers both own characters and
      // friends, and Payload stores each entry as `{ relationTo, value }` so
      // the frontend knows which collection to link into. This replaces the
      // old convention of encoding people into titles like "Hug (with Taire)",
      // and makes "every picture Taire appears in" a real query.
      //
      // The subject above is deliberately absent: it is always in the picture,
      // so the frontend prepends it rather than asking for it twice.
      name: "featuring",
      type: "relationship",
      relationTo: ["characters", "friends"],
      hasMany: true,
      label: "Also featuring",
      admin: {
        description:
          "Everyone else in the picture. The character above is always featured.",
      },
      filterOptions: ({ relationTo, data }) => {
        const subject = idOf(data?.character);
        // `relationTo` is the collection being searched, so the id constraint
        // only ever applies to the side it can mean anything on.
        if (relationTo !== "characters" || subject === undefined) return true;
        return { id: { not_equals: subject } };
      },
      hooks: {
        // Keeps what is stored canonical even for writes that bypass the admin
        // (REST, GraphQL, the Local API), so nothing has to dedupe on read.
        beforeValidate: [
          ({ value, data, originalDoc }) => {
            const subject = idOf(data?.character ?? originalDoc?.character);
            if (!Array.isArray(value) || subject === undefined) return value;

            return value.filter(
              (entry) =>
                !(
                  isPolymorphicValue(entry) &&
                  entry.relationTo === "characters" &&
                  idOf(entry.value) === subject
                ),
            );
          },
        ],
      },
    },
    {
      // `allowCreate` (on by default) is what makes this behave like a tag box:
      // type-to-search over existing tags, with inline creation for new ones.
      // A plain `text` field with `hasMany` would be faster to type into but
      // has no shared registry, so a typo silently forks a facet.
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Lower sorts first within the profile's gallery.",
        position: "sidebar",
      },
    },
  ],
};
