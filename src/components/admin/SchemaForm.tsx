"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  Checkbox,
  Field,
  FormRow,
  FormSection,
  NumberInput,
  Select,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/admin/AdminForm";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ColorInput } from "@/components/admin/ColorInput";
import { MediaPicker, type MediaOption } from "@/components/admin/MediaPicker";
import {
  RelationshipPicker,
  type RelationshipOption,
} from "@/components/admin/RelationshipPicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  saveCollectionDocumentAction,
  saveGlobalDocumentAction,
} from "@/lib/admin/actions/documents";
import {
  isStudioRichText,
  toDateTimeLocalValue,
  type StudioRichText,
} from "@/lib/admin/document";
import { matchStudioCondition, type AdminField } from "@/lib/admin/schema";

type SchemaFormProps = {
  kind: "collection" | "global";
  slug: string;
  id?: number | string;
  fields: AdminField[];
  initialValues: Record<string, unknown>;
  relationOptions: Record<string, RelationshipOption[]>;
  mediaOptions: MediaOption[];
  mediaById: Record<number, MediaOption>;
  submitLabel?: string;
};

function getAt(data: unknown, path: string[]): unknown {
  let current: unknown = data;
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[Number(key)];
      continue;
    }
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setAt(data: unknown, path: string[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const index = Number(head);
  const asArray = Array.isArray(data) || (/^\d+$/.test(head) && data == null);

  if (asArray) {
    const list = Array.isArray(data) ? [...data] : [];
    const existing = list[index];
    list[index] =
      rest.length === 0
        ? value
        : setAt(existing && typeof existing === "object" ? existing : {}, rest, value);
    return list;
  }

  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? { ...(data as Record<string, unknown>) }
      : {};
  const existing = record[head];
  record[head] =
    rest.length === 0
      ? value
      : setAt(existing && typeof existing === "object" ? existing : {}, rest, value);
  return record;
}

function relationKey(field: AdminField): string {
  if (!field.relationTo) return "";
  if (Array.isArray(field.relationTo)) return field.relationTo.slice().sort().join("|");
  return field.relationTo;
}

function visible(
  field: AdminField,
  sibling: Record<string, unknown>,
  root: Record<string, unknown>,
): boolean {
  if (field.hidden) return false;
  return matchStudioCondition(field.condition, sibling, root);
}

/**
 * Renders a Payload field tree from a serializable schema. Document state is
 * held as JSON in React — submit posts that object through a generic Local
 * API action, so adding a collection field never needs a new form component.
 */
export function SchemaForm({
  kind,
  slug,
  id,
  fields,
  initialValues,
  relationOptions,
  mediaOptions,
  mediaById,
  submitLabel = "Save",
}: SchemaFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  // Explicit saving state — `useTransition` stays pending through
  // `router.push`/`refresh`, which left the button stuck on "Saving…".
  const [saving, setSaving] = useState(false);

  const root = values;

  function patch(path: string[], value: unknown) {
    setSuccess(undefined);
    setValues((prev) => setAt(prev, path, value) as Record<string, unknown>);
  }

  function renderFields(list: AdminField[], path: string[]) {
    const sibling =
      path.length === 0
        ? root
        : ((getAt(root, path) as Record<string, unknown> | undefined) ?? {});

    return list.map((field, index) => {
      if (!visible(field, sibling, root)) return null;

      if (field.type === "tabs") {
        return (
          <AdminTabs
            key={`tabs-${index}`}
            tabs={(field.tabs ?? []).map((tab, tabIndex) => ({
              key: `${tab.label}-${tabIndex}`,
              label: tab.label,
              content: (
                <div className="flex flex-col gap-4">
                  {renderFields(tab.fields, path)}
                </div>
              ),
            }))}
          />
        );
      }

      if (field.type === "row") {
        return (
          <FormRow key={`row-${index}`}>
            {renderFields(field.fields ?? [], path)}
          </FormRow>
        );
      }

      if (field.type === "collapsible") {
        return (
          <FormSection key={`collapse-${index}`} title={field.label}>
            {renderFields(field.fields ?? [], path)}
          </FormSection>
        );
      }

      if (field.type === "group") {
        const groupPath = field.name ? [...path, field.name] : path;
        const body = renderFields(field.fields ?? [], groupPath);
        if (!field.name) {
          return (
            <FormSection
              key={`anon-group-${index}`}
              title={field.label}
              description={field.description}
            >
              {body}
            </FormSection>
          );
        }
        return (
          <FormSection
            key={field.name}
            title={field.label ?? field.name}
            description={field.description}
          >
            {body}
          </FormSection>
        );
      }

      if (field.type === "array") {
        if (!field.name) return null;
        const arrayPath = [...path, field.name];
        const rows = (getAt(root, arrayPath) as unknown[] | undefined) ?? [];
        return (
          <FormSection
            key={field.name}
            title={field.label ?? field.name}
            description={field.description}
          >
            <div className="flex flex-col gap-3">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      {field.label ?? field.name} {rowIndex + 1}
                    </p>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() => {
                        const next = rows.filter((_, i) => i !== rowIndex);
                        patch(arrayPath, next);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {renderFields(field.fields ?? [], [...arrayPath, String(rowIndex)])}
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                onClick={() => patch(arrayPath, [...rows, {}])}
              >
                Add {field.label ?? field.name}
              </button>
            </div>
          </FormSection>
        );
      }

      if (!field.name) return null;
      const fieldPath = [...path, field.name];
      const value = getAt(root, fieldPath);
      const inputId = fieldPath.join(".");

      if (field.type === "checkbox") {
        return (
          <Checkbox
            key={inputId}
            label={field.label ?? field.name}
            checked={Boolean(value)}
            disabled={field.readOnly}
            onChange={(event) => patch(fieldPath, event.target.checked)}
          />
        );
      }

      if (field.type === "select" || field.type === "radio") {
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description}
            required={field.required}
          >
            <Select
              id={inputId}
              value={value == null ? "" : String(value)}
              disabled={field.readOnly}
              onChange={(event) =>
                patch(fieldPath, event.target.value === "" ? null : event.target.value)
              }
            >
              {!field.required ? <option value="">—</option> : null}
              {(field.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        );
      }

      if (field.type === "textarea" || (field.type === "text" && field.hasMany)) {
        if (field.hasMany) {
          const list = Array.isArray(value)
            ? value.map(String)
            : typeof value === "string"
              ? value.split("\n").filter(Boolean)
              : [];
          return (
            <Field
              key={inputId}
              label={field.label}
              htmlFor={inputId}
              description={field.description ?? "One value per line."}
              required={field.required}
            >
              <TextArea
                id={inputId}
                value={list.join("\n")}
                disabled={field.readOnly}
                onChange={(event) =>
                  patch(
                    fieldPath,
                    event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
                rows={4}
              />
            </Field>
          );
        }
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description}
            required={field.required}
          >
            <TextArea
              id={inputId}
              value={value == null ? "" : String(value)}
              disabled={field.readOnly}
              onChange={(event) => patch(fieldPath, event.target.value)}
              rows={4}
            />
          </Field>
        );
      }

      if (field.type === "richText") {
        const rich = isStudioRichText(value)
          ? value
          : ({
              __studioHtml: "",
              __studioOriginal: null,
            } satisfies StudioRichText);
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description}
            required={field.required}
          >
            <RichTextEditor
              id={inputId}
              value={rich.__studioHtml}
              disabled={field.readOnly}
              onChange={(html) =>
                patch(fieldPath, {
                  __studioHtml: html,
                  __studioOriginal: rich.__studioOriginal,
                } satisfies StudioRichText)
              }
            />
          </Field>
        );
      }

      if (field.type === "number") {
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description}
            required={field.required}
          >
            <NumberInput
              id={inputId}
              value={value == null ? "" : String(value)}
              min={field.min}
              max={field.max}
              disabled={field.readOnly}
              onChange={(event) =>
                patch(
                  fieldPath,
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
            />
          </Field>
        );
      }

      if (field.type === "date") {
        // Form state holds the datetime-local string itself. Converting to ISO
        // on every keystroke rewrites the controlled value and clears the
        // browser's pending digit buffer (day "1"+"7" became "7", not "17").
        const dateValue =
          typeof value === "string"
            ? value
            : value instanceof Date
              ? toDateTimeLocalValue(value)
              : "";
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description}
            required={field.required}
          >
            <TextInput
              id={inputId}
              type="datetime-local"
              value={dateValue}
              disabled={field.readOnly}
              onChange={(event) =>
                patch(
                  fieldPath,
                  event.target.value === "" ? null : event.target.value,
                )
              }
            />
          </Field>
        );
      }

      if (field.type === "upload") {
        const mediaId = typeof value === "number" ? value : null;
        const selected = mediaId != null ? mediaById[mediaId] : undefined;
        return (
          <div key={inputId}>
            <MediaPicker
              label={field.label}
              description={field.description}
              recent={mediaOptions}
              defaultValue={selected}
              onSelect={(media) => patch(fieldPath, media?.id ?? null)}
            />
          </div>
        );
      }

      if (field.type === "relationship") {
        const key = relationKey(field);
        const options = relationOptions[key] ?? [];
        const polymorphic = Array.isArray(field.relationTo);
        const selected = selectedRelationValues(value, field.hasMany, polymorphic);

        return (
          <div key={inputId}>
            <RelationshipPicker
              label={field.label}
              description={field.description}
              options={options}
              multiple={Boolean(field.hasMany)}
              polymorphic={polymorphic}
              value={selected}
              onChange={(next) => {
                if (polymorphic) {
                  patch(
                    fieldPath,
                    next.flatMap((entry) => {
                      const [relationTo, rawId] = entry.split(":");
                      const parsed = Number(rawId);
                      return relationTo && Number.isFinite(parsed)
                        ? [{ relationTo, value: parsed }]
                        : [];
                    }),
                  );
                  return;
                }
                if (field.hasMany) {
                  patch(
                    fieldPath,
                    next.map(Number).filter((n) => Number.isFinite(n)),
                  );
                } else {
                  patch(fieldPath, next[0] ? Number(next[0]) : null);
                }
              }}
            />
          </div>
        );
      }

      if (field.type === "json") {
        return (
          <Field
            key={inputId}
            label={field.label}
            htmlFor={inputId}
            description={field.description ?? "JSON"}
            required={field.required}
          >
            <TextArea
              id={inputId}
              value={
                typeof value === "string"
                  ? value
                  : JSON.stringify(value ?? null, null, 2)
              }
              disabled={field.readOnly}
              onChange={(event) => {
                try {
                  patch(fieldPath, JSON.parse(event.target.value));
                } catch {
                  patch(fieldPath, event.target.value);
                }
              }}
              rows={6}
            />
          </Field>
        );
      }

      if (field.widget === "color") {
        return (
          <ColorInput
            key={inputId}
            label={field.label}
            value={typeof value === "string" ? value : "#3abef9"}
            onChange={(next) => patch(fieldPath, next)}
          />
        );
      }

      // text | email | password | icon
      return (
        <Field
          key={inputId}
          label={field.label}
          htmlFor={inputId}
          description={field.description}
          required={field.required && field.type !== "password"}
        >
          <TextInput
            id={inputId}
            type={
              field.type === "password"
                ? "password"
                : field.type === "email"
                  ? "email"
                  : "text"
            }
            value={value == null ? "" : String(value)}
            disabled={field.readOnly}
            autoComplete={field.type === "password" ? "new-password" : undefined}
            placeholder={
              field.type === "password" && id != null
                ? "Leave blank to keep current password"
                : undefined
            }
            onChange={(event) => patch(fieldPath, event.target.value)}
          />
        </Field>
      );
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    setSaving(true);
    try {
      const result =
        kind === "global"
          ? await saveGlobalDocumentAction({ global: slug, values })
          : await saveCollectionDocumentAction({ collection: slug, id, values });

      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // Inline success — editing the same URL with `?flash=updated` often
      // doesn't remount the page FlashMessage, so the form owns the feedback.
      if (kind === "global") {
        setSuccess("Saved.");
        setSaving(false);
        router.replace(`/admin/globals/${slug}?flash=updated`);
        router.refresh();
        return;
      }

      const nextId = result.id ?? id;
      const isCreate = id == null;
      setSuccess(isCreate ? "Created." : "Saved.");
      setSaving(false);

      if (isCreate) {
        router.push(`/admin/collections/${slug}/${nextId}?flash=created`);
      } else {
        router.replace(`/admin/collections/${slug}/${nextId}?flash=updated`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {success}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">{renderFields(fields, [])}</div>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 border-t border-zinc-200 bg-zinc-50/95 px-1 py-3 backdrop-blur">
        <SubmitButton disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </SubmitButton>
        {success ? (
          <span className="text-sm font-medium text-emerald-700">{success}</span>
        ) : null}
      </div>
    </form>
  );
}

function selectedRelationValues(
  value: unknown,
  hasMany: boolean | undefined,
  polymorphic: boolean,
): string[] {
  if (polymorphic) {
    const list = Array.isArray(value) ? value : [];
    return list.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const relationTo = (entry as { relationTo?: unknown }).relationTo;
      const id = (entry as { value?: unknown }).value;
      if (typeof relationTo !== "string" || id == null) return [];
      return [`${relationTo}:${id}`];
    });
  }
  if (hasMany) {
    const list = Array.isArray(value) ? value : [];
    return list.map(String);
  }
  if (value == null || value === "") return [];
  return [String(value)];
}
