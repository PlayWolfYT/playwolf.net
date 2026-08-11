import type { Field } from "payload";

import { richTextEditor } from "../editor";
import { withStudioCondition } from "./studioCondition";

// Resolved by Next when the generated import map is compiled, not by the
// Payload CLI — so these stay on the `@/` alias rather than a relative path.
const ICON_PICKER = "@/payload/components/IconPicker#IconPicker";
const COLOR_PICKER = "@/payload/components/ColorPicker#ColorPicker";

/** Mirrors `WipAspect` in the frontend's sheet types. */
const ASPECTS = ["4/3", "3/2", "16/9", "1/1"] as const;

/**
 * Placeholder shown in place of a reference sheet (or artwork) that doesn't
 * exist yet. Every knob here maps onto one property of `RefSheetWipOptions`,
 * which `SheetPlaceholder` already reads. Reused by Artworks' `wipPlaceholder`.
 */
export const wipFields: Field[] = [
  {
    type: "row",
    fields: [
      {
        name: "badge",
        type: "text",
        defaultValue: "WIP",
        admin: { width: "33%" },
      },
      {
        name: "aspect",
        type: "select",
        defaultValue: "4/3",
        options: ASPECTS.map((value) => ({ label: value, value })),
        admin: { width: "33%" },
      },
      {
        name: "iconCount",
        type: "number",
        defaultValue: 42,
        min: 0,
        max: 200,
        admin: { width: "34%" },
      },
    ],
  },
  {
    name: "subtitle",
    type: "text",
    defaultValue: "Reference sheet in progress",
  },
  {
    name: "quotes",
    type: "array",
    labels: { singular: "Quote", plural: "Quotes" },
    admin: {
      description: "Leave empty to use the built-in pool.",
      initCollapsed: true,
    },
    fields: [{ name: "text", type: "text", required: true }],
  },
  {
    name: "icons",
    type: "array",
    labels: { singular: "Icon", plural: "Icons" },
    admin: {
      description:
        "Scattered across the backdrop. Empty falls back to the drawing kit.",
      initCollapsed: true,
    },
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        admin: { components: { Field: ICON_PICKER } },
      },
    ],
  },
  {
    name: "gradient",
    type: "array",
    labels: { singular: "Colour", plural: "Gradient" },
    admin: {
      description:
        "Blended left-to-right across the frame. Empty follows the profile accent.",
      initCollapsed: true,
    },
    fields: [
      {
        name: "color",
        type: "text",
        required: true,
        admin: { components: { Field: COLOR_PICKER } },
      },
    ],
  },
  {
    type: "row",
    fields: [
      {
        name: "interval",
        type: "number",
        defaultValue: 5000,
        min: 500,
        admin: {
          description: "Milliseconds between quote swaps.",
          width: "50%",
        },
      },
      {
        name: "progress",
        type: "number",
        min: 0,
        max: 100,
        admin: {
          description: "0–100 swaps the pacing bar for a determinate one.",
          width: "50%",
        },
      },
    ],
  },
];

const sheetField: Field = {
  name: "sheet",
  type: "group",
  label: "Reference sheet",
  fields: [
    {
      name: "kind",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "None", value: "none" },
        { label: "Image", value: "image" },
        { label: "Work in progress", value: "wip" },
      ],
    },
    withStudioCondition(
      { name: "title", type: "text" },
      { kind: "siblingNeq", field: "kind", value: "none" },
      (_, siblingData) => siblingData?.kind !== "none",
    ),
    withStudioCondition(
      { name: "image", type: "upload", relationTo: "media" },
      { kind: "siblingEq", field: "kind", value: "image" },
      (_, siblingData) => siblingData?.kind === "image",
    ),
    withStudioCondition(
      { name: "description", type: "textarea" },
      { kind: "siblingNeq", field: "kind", value: "none" },
      (_, siblingData) => siblingData?.kind !== "none",
    ),
    withStudioCondition(
      { name: "artist", type: "relationship", relationTo: "artists" },
      { kind: "siblingNeq", field: "kind", value: "none" },
      (_, siblingData) => siblingData?.kind !== "none",
    ),
    withStudioCondition(
      {
        name: "wip",
        type: "group",
        label: "Placeholder options",
        fields: wipFields,
      },
      { kind: "siblingEq", field: "kind", value: "wip" },
      (_, siblingData) => siblingData?.kind === "wip",
    ),
  ],
};

/**
 * One character profile — SFW or After Dark. Two at most, which is why this is
 * a group on `characters` rather than a collection of its own: the rating is
 * implied by which key it lives under.
 */
export function profileField(name: "nsfw" | "sfw", label: string): Field {
  return {
    name,
    type: "group",
    label,
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "enabled",
            type: "checkbox",
            defaultValue: name === "sfw",
            admin: {
              description: `Publishes /ref/<character>/${name}.`,
              width: "30%",
            },
          },
          {
            name: "label",
            type: "text",
            defaultValue: label,
            admin: {
              description: "Shown on the profile switcher.",
              width: "35%",
            },
          },
          {
            name: "accentColor",
            type: "text",
            defaultValue: "#3abef9",
            admin: {
              components: { Field: COLOR_PICKER },
              width: "35%",
            },
          },
        ],
      },
      {
        name: "description",
        type: "richText",
        editor: richTextEditor,
        admin: {
          description: "Blurb at the top of this profile's panel.",
        },
      },
      sheetField,
    ],
  };
}
