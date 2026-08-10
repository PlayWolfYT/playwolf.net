import { describe, expect, test } from "bun:test";
import type { Field } from "payload";

import { documentToFormValues, formValuesToDocument } from "@/lib/admin/document";
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
