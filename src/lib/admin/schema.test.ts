import { describe, expect, test } from "bun:test";
import type { Field } from "payload";

import {
  documentToFormValues,
  formValuesToDocument,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/admin/document";
import { serializeFields } from "@/lib/admin/schema";
import { matchStudioCondition } from "@/payload/fields/studioCondition";

describe("serializeFields", () => {
  test("flattens tabs/rows and keeps select options", () => {
    const fields: Field[] = [
      {
        type: "tabs",
        tabs: [
          {
            label: "Main",
            fields: [
              {
                type: "row",
                fields: [
                  { name: "title", type: "text", required: true },
                  {
                    name: "status",
                    type: "select",
                    options: [
                      { label: "Live", value: "live" },
                      { label: "WIP", value: "wip" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const serialized = serializeFields(fields);
    expect(serialized).toHaveLength(1);
    expect(serialized[0].type).toBe("tabs");
    expect(serialized[0].tabs?.[0].fields[0].type).toBe("row");
    const status = serialized[0].tabs?.[0].fields[0].fields?.find(
      (field) => field.name === "status",
    );
    expect(status?.options).toEqual([
      { label: "Live", value: "live" },
      { label: "WIP", value: "wip" },
    ]);
  });

  test("copies studioCondition from admin.custom", () => {
    const fields: Field[] = [
      {
        name: "detail",
        type: "text",
        admin: {
          custom: {
            studioCondition: {
              kind: "siblingEq",
              field: "lifecycle",
              value: "in_progress",
            },
          },
        },
      },
    ];

    expect(serializeFields(fields)[0].condition).toEqual({
      kind: "siblingEq",
      field: "lifecycle",
      value: "in_progress",
    });
  });
});

describe("matchStudioCondition", () => {
  test("supports and/or combinations", () => {
    const sibling = { lifecycle: "in_progress", overviewDisplay: "wipImage" };
    expect(
      matchStudioCondition(
        {
          kind: "and",
          conditions: [
            { kind: "siblingEq", field: "lifecycle", value: "in_progress" },
            { kind: "siblingEq", field: "overviewDisplay", value: "wipImage" },
          ],
        },
        sibling,
        sibling,
      ),
    ).toBe(true);

    expect(
      matchStudioCondition(
        {
          kind: "and",
          conditions: [
            { kind: "siblingEq", field: "lifecycle", value: "in_progress" },
            { kind: "siblingEq", field: "overviewDisplay", value: "generated" },
          ],
        },
        sibling,
        sibling,
      ),
    ).toBe(false);
  });
});

describe("document round-trip", () => {
  const fields = serializeFields([
    { name: "title", type: "text", required: true },
    { name: "count", type: "number" },
    { name: "artist", type: "relationship", relationTo: "artists" },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
  ]);

  test("collapses relationship objects to ids for the form", () => {
    const values = documentToFormValues(
      {
        title: "Hello",
        count: 3,
        artist: { id: 9, name: "Nib" },
        tags: [
          { id: 1, label: "hug" },
          { id: 2, label: "ref" },
        ],
      },
      fields,
    );

    expect(values).toEqual({
      title: "Hello",
      count: 3,
      artist: 9,
      tags: [1, 2],
    });
  });

  test("formValuesToDocument keeps ids for Payload", () => {
    const data = formValuesToDocument(
      { title: "Hello", count: 3, artist: 9, tags: [1, 2] },
      fields,
    );
    expect(data).toEqual({
      title: "Hello",
      count: 3,
      artist: 9,
      tags: [1, 2],
    });
  });
});

describe("datetime-local form values", () => {
  const fields = serializeFields([
    {
      name: "lastArtistUpdateAt",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
  ]);

  test("toDateTimeLocalValue uses local wall time, not UTC slice", () => {
    const local = new Date(2026, 7, 17, 9, 5);
    expect(toDateTimeLocalValue(local)).toBe("2026-08-17T09:05");
    expect(toDateTimeLocalValue(local.toISOString())).toBe("2026-08-17T09:05");
  });

  test("documentToFormValues keeps a datetime-local string for the input", () => {
    const local = new Date(2026, 7, 17, 14, 30);
    const values = documentToFormValues(
      { lastArtistUpdateAt: local.toISOString() },
      fields,
    );
    expect(values.lastArtistUpdateAt).toBe("2026-08-17T14:30");
  });

  test("formValuesToDocument converts datetime-local back to ISO", () => {
    const data = formValuesToDocument(
      { lastArtistUpdateAt: "2026-08-17T14:30" },
      fields,
    );
    expect(data.lastArtistUpdateAt).toBe(fromDateTimeLocalValue("2026-08-17T14:30"));
    expect(data.lastArtistUpdateAt).toBe(new Date(2026, 7, 17, 14, 30).toISOString());
  });

  test("empty date clears to null both ways", () => {
    expect(documentToFormValues({ lastArtistUpdateAt: null }, fields)).toEqual({
      lastArtistUpdateAt: null,
    });
    expect(formValuesToDocument({ lastArtistUpdateAt: "" }, fields)).toEqual({
      lastArtistUpdateAt: null,
    });
  });
});
