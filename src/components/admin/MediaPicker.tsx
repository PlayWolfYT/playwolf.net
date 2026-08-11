"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";

import { uploadMediaAction, type UploadedMedia } from "@/lib/admin/actions/media";

export type MediaOption = {
  id: number;
  url: string;
  alt: string;
  thumbnailURL?: string;
};

/**
 * Picks an existing media document or uploads a new one. The recent list is
 * fetched once by the page (a server component) and passed in — uploading
 * calls the server action directly rather than through a `<form>`, so the
 * new thumbnail can appear immediately without a page reload.
 */
export function MediaPicker({
  name,
  label,
  recent,
  defaultValue,
  description,
  onSelect,
}: {
  name?: string;
  label?: string;
  recent: MediaOption[];
  defaultValue?: MediaOption;
  description?: string;
  /** Notified on every pick/clear — used by array editors that aggregate several pickers. */
  onSelect?: (media: MediaOption | undefined) => void;
}) {
  const [selected, setSelectedState] = useState<MediaOption | undefined>(defaultValue);
  const [uploaded, setUploaded] = useState<MediaOption[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function setSelected(media: MediaOption | undefined) {
    setSelectedState(media);
    onSelect?.(media);
  }

  const options = useMemo(() => {
    const merged = [...uploaded, ...recent];
    const seen = new Set<number>();
    return merged.filter((option) =>
      seen.has(option.id) ? false : (seen.add(option.id), true),
    );
  }, [recent, uploaded]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadMediaAction(formData);
      if (result.ok) {
        const media = toOption(result.media);
        setUploaded((prev) => [media, ...prev]);
        setSelected(media);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <span className="text-sm font-medium text-zinc-800">{label}</span>
      ) : null}

      <input type="hidden" name={name} value={selected?.id ?? ""} />

      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-50">
          {selected ? (
            <Image
              src={selected.thumbnailURL || selected.url}
              alt={selected.alt || ""}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-zinc-400">
              None
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50">
            {pending ? "Uploading…" : "Upload new"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={pending}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(undefined)}
              className="w-fit rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Clear
            </button>
          ) : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>

      {options.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {options.slice(0, 24).map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => setSelected(option)}
                className={`relative h-14 w-14 overflow-hidden rounded-md border transition ${
                  selected?.id === option.id
                    ? "border-sky-500 ring-2 ring-sky-500/30"
                    : "border-zinc-300 hover:border-zinc-400"
                }`}
                title={option.alt}
              >
                <Image
                  src={option.thumbnailURL || option.url}
                  alt={option.alt || ""}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
    </div>
  );
}

function toOption(media: UploadedMedia): MediaOption {
  return {
    id: media.id,
    url: media.url,
    alt: media.alt,
    thumbnailURL: media.thumbnailURL,
  };
}
