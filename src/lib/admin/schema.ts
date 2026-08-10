import type {
  ArrayField,
  BlocksField,
  CheckboxField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GroupField,
  NumberField,
  Option,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from "payload";

import {
  matchStudioCondition,
  type StudioCondition,
} from "@/payload/fields/studioCondition";

/**
 * Client-safe field descriptors derived from Payload collection/global
 * configs. Functions (hooks, conditions, validate) are dropped; visibility
 * uses `admin.custom.studioCondition` instead.
 */

export type AdminSelectOption = { label: string; value: string };

export type AdminFieldWidget =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "date"
  | "checkbox"
  | "select"
  | "radio"
  | "relationship"
  | "upload"
  | "richText"
  | "json"
  | "password"
  | "group"
  | "array"
  | "row"
  | "tabs"
  | "collapsible"
  | "ui";

export type AdminField = {
  type: AdminFieldWidget;
  name?: string;
  label?: string;
  description?: string;
  required?: boolean;
  hasMany?: boolean;
  options?: AdminSelectOption[];
  /** Single collection slug, or several for polymorphic relationships. */
  relationTo?: string | string[];
  min?: number;
  max?: number;
  defaultValue?: unknown;
  condition?: StudioCondition;
  /** Nested fields for group / array / row / tabs / collapsible. */
  fields?: AdminField[];
  /** Tab labels when `type === "tabs"`. */
  tabs?: { label: string; fields: AdminField[] }[];
  /** Extra widget hint: color | icon */
  widget?: "color" | "icon";
  hidden?: boolean;
  readOnly?: boolean;
};

export type AdminCollectionSchema = {
  kind: "collection";
  slug: string;
  label: string;
  singularLabel: string;
  useAsTitle: string;
  defaultColumns: string[];
  upload: boolean;
  auth: boolean;
  fields: AdminField[];
};

export type AdminGlobalSchema = {
  kind: "global";
  slug: string;
  label: string;
  fields: AdminField[];
};

function labelOf(field: { label?: unknown; name?: string }): string | undefined {
  if (typeof field.label === "string") return field.label;
  if (field.name) return titleCase(field.name);
  return undefined;
}

function titleCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function optionList(options: Option[] | undefined): AdminSelectOption[] | undefined {
  if (!options?.length) return undefined;
  return options.map((option) => {
    if (typeof option === "string") return { label: option, value: option };
    const value = String(option.value);
    const label = typeof option.label === "string" ? option.label : titleCase(value);
    return { label, value };
  });
}

function studioConditionOf(field: Field): StudioCondition | undefined {
  const custom =
    field.admin && "custom" in field.admin ? field.admin.custom : undefined;
  const value =
    custom && typeof custom === "object" ? custom.studioCondition : undefined;
  if (!value || typeof value !== "object") return undefined;
  return value as StudioCondition;
}

function widgetHint(field: Field): "color" | "icon" | undefined {
  const component = field.admin?.components?.Field;
  const path =
    typeof component === "string"
      ? component
      : component && typeof component === "object" && "path" in component
        ? String((component as { path: unknown }).path)
        : "";
  if (path.includes("ColorPicker")) return "color";
  if (path.includes("IconPicker")) return "icon";
  return undefined;
}

function isPresentational(field: Field): boolean {
  return (
    field.type === "ui" ||
    field.type === "row" ||
    field.type === "tabs" ||
    field.type === "collapsible" ||
    field.type === "group"
  );
}

function adminRecord(field: Field): Record<string, unknown> {
  return (field.admin ?? {}) as Record<string, unknown>;
}

function serializeNamed(
  field: Field & { name: string },
  partial: Omit<
    AdminField,
    "name" | "label" | "description" | "condition" | "hidden" | "readOnly"
  >,
): AdminField {
  const admin = adminRecord(field);
  return {
    ...partial,
    name: field.name,
    label: labelOf(field),
    description: typeof admin.description === "string" ? admin.description : undefined,
    condition: studioConditionOf(field),
    hidden: Boolean(admin.hidden),
    readOnly: Boolean(admin.readOnly),
    widget: widgetHint(field),
  };
}

/** Walk Payload fields into a JSON-safe tree for the custom admin form. */
export function serializeFields(fields: Field[]): AdminField[] {
  const out: AdminField[] = [];

  for (const field of fields) {
    if (field.type === "tabs") {
      const tabsField = field as TabsField;
      out.push({
        type: "tabs",
        tabs: tabsField.tabs.map((tab) => ({
          label: typeof tab.label === "string" ? tab.label : "Tab",
          fields: serializeFields(tab.fields),
        })),
      });
      continue;
    }

    if (field.type === "row") {
      const rowField = field as RowField;
      out.push({
        type: "row",
        fields: serializeFields(rowField.fields),
        condition: studioConditionOf(field),
      });
      continue;
    }

    if (field.type === "collapsible") {
      const collapsible = field as CollapsibleField;
      out.push({
        type: "collapsible",
        label: labelOf(collapsible) ?? "Section",
        fields: serializeFields(collapsible.fields),
        condition: studioConditionOf(field),
      });
      continue;
    }

    if (field.type === "ui") {
      continue;
    }

    if (field.type === "group") {
      const group = field as GroupField;
      const groupName = "name" in group ? group.name : undefined;
      if (!groupName) {
        out.push({
          type: "group",
          label: labelOf(group),
          fields: serializeFields(group.fields),
          condition: studioConditionOf(field),
        });
        continue;
      }
      out.push(
        serializeNamed(
          { ...group, name: groupName },
          {
            type: "group",
            fields: serializeFields(group.fields),
          },
        ),
      );
      continue;
    }

    if (field.type === "array") {
      const array = field as ArrayField;
      out.push(
        serializeNamed(array, {
          type: "array",
          fields: serializeFields(array.fields),
        }),
      );
      continue;
    }

    if (field.type === "blocks") {
      // Blocks are unused in this project; surface as opaque JSON if they appear.
      const blocks = field as BlocksField;
      out.push(
        serializeNamed(blocks, {
          type: "json",
        }),
      );
      continue;
    }

    if (field.type === "text") {
      const text = field as TextField;
      out.push(
        serializeNamed(text, {
          type: "text",
          required: Boolean(text.required),
          hasMany: Boolean(text.hasMany),
          defaultValue: text.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "textarea") {
      const textarea = field as TextareaField;
      out.push(
        serializeNamed(textarea, {
          type: "textarea",
          required: Boolean(textarea.required),
          defaultValue: textarea.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "number") {
      const number = field as NumberField;
      out.push(
        serializeNamed(number, {
          type: "number",
          required: Boolean(number.required),
          min: typeof number.min === "number" ? number.min : undefined,
          max: typeof number.max === "number" ? number.max : undefined,
          defaultValue: number.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "email") {
      const email = field as EmailField;
      out.push(
        serializeNamed(email, {
          type: "email",
          required: Boolean(email.required),
        }),
      );
      continue;
    }

    if (field.type === "date") {
      const date = field as DateField;
      out.push(
        serializeNamed(date, {
          type: "date",
          required: Boolean(date.required),
        }),
      );
      continue;
    }

    if (field.type === "checkbox") {
      const checkbox = field as CheckboxField;
      out.push(
        serializeNamed(checkbox, {
          type: "checkbox",
          defaultValue: checkbox.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "select") {
      const select = field as SelectField;
      out.push(
        serializeNamed(select, {
          type: "select",
          required: Boolean(select.required),
          hasMany: Boolean(select.hasMany),
          options: optionList(select.options),
          defaultValue: select.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "radio") {
      const radio = field as RadioField;
      out.push(
        serializeNamed(radio, {
          type: "radio",
          required: Boolean(radio.required),
          options: optionList(radio.options),
          defaultValue: radio.defaultValue,
        }),
      );
      continue;
    }

    if (field.type === "relationship") {
      const relationship = field as RelationshipField;
      out.push(
        serializeNamed(relationship, {
          type: "relationship",
          required: Boolean(relationship.required),
          hasMany: Boolean(relationship.hasMany),
          relationTo: relationship.relationTo,
        }),
      );
      continue;
    }

    if (field.type === "upload") {
      const upload = field as UploadField;
      out.push(
        serializeNamed(upload, {
          type: "upload",
          required: Boolean(upload.required),
          hasMany: Boolean(upload.hasMany),
          relationTo: upload.relationTo,
        }),
      );
      continue;
    }

    if (field.type === "richText") {
      const richText = field as RichTextField;
      out.push(
        serializeNamed(richText, {
          type: "richText",
          required: Boolean(richText.required),
        }),
      );
      continue;
    }

    if (field.type === "json") {
      out.push(
        serializeNamed(field as Field & { name: string }, {
          type: "json",
        }),
      );
      continue;
    }

    if ("name" in field && typeof field.name === "string" && !isPresentational(field)) {
      out.push(
        serializeNamed(field as Field & { name: string }, {
          type: "json",
        }),
      );
    }
  }

  return out;
}

export { matchStudioCondition };

/** Collect every relationship/upload collection slug referenced by a schema. */
export function collectRelationSlugs(fields: AdminField[]): string[] {
  const slugs = new Set<string>();

  const walk = (list: AdminField[]) => {
    for (const field of list) {
      if (field.relationTo) {
        const relations = Array.isArray(field.relationTo)
          ? field.relationTo
          : [field.relationTo];
        for (const slug of relations) slugs.add(slug);
      }
      if (field.fields) walk(field.fields);
      if (field.tabs) for (const tab of field.tabs) walk(tab.fields);
    }
  };

  walk(fields);
  return [...slugs];
}
