import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
} from "payload";

/**
 * Catch-all tag, for reads that join across collections — an artwork title on a
 * character page, a friend's name on a "featuring" chip — so a change anywhere
 * invalidates them without each hook having to know which pages exist.
 *
 * Every write emits it, but not every read carries it: a read that depends on a
 * known, small set of collections should list those with `collectionTag`
 * instead, so an unrelated save stops rebuilding it.
 */
export const CONTENT_TAG = "payload";

/**
 * Per-collection tag. A read tagged this way must name *every* collection it
 * touches, populated relationships included — a project's cover lives in
 * `project-images`, and re-cropping it never touches the project row.
 */
export function collectionTag(slug: string): string {
  return `payload:${slug}`;
}

/** Per-document tag, for a single character/artwork page. */
export function documentTag(slug: string, id: number | string): string {
  return `payload:${slug}:${id}`;
}

/**
 * `revalidateTag` throws outside a Next.js request or render scope, which is
 * exactly where the Payload CLI runs (`payload migrate`, seeds, scripts). A
 * failed cache purge must never fail the write that triggered it.
 *
 * Next 16 requires a cache-life profile; `max` expires every entry carrying the
 * tag regardless of the profile it was written with, which is what an editor
 * pressing Save expects.
 */
function purge(tags: string[], payload: Payload): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (error) {
      payload.logger.warn(
        { err: error, tag },
        "Skipped cache revalidation outside a Next.js scope",
      );
    }
  }
}

type RevalidateOptions = {
  /** Extra tags derived from the document, e.g. its slug. */
  extraTags?: (doc: Record<string, unknown>) => string[];
};

export function revalidateAfterChange(
  slug: string,
  { extraTags }: RevalidateOptions = {},
): CollectionAfterChangeHook {
  return ({ context, doc, req }) => {
    if (context?.disableRevalidate) return doc;

    purge(
      [
        CONTENT_TAG,
        collectionTag(slug),
        ...(doc?.id !== undefined
          ? [documentTag(slug, doc.id as number | string)]
          : []),
        ...(extraTags?.(doc as Record<string, unknown>) ?? []),
      ],
      req.payload,
    );

    return doc;
  };
}

export function revalidateAfterDelete(
  slug: string,
  { extraTags }: RevalidateOptions = {},
): CollectionAfterDeleteHook {
  return ({ context, doc, req }) => {
    if (context?.disableRevalidate) return doc;

    purge(
      [
        CONTENT_TAG,
        collectionTag(slug),
        ...(doc?.id !== undefined
          ? [documentTag(slug, doc.id as number | string)]
          : []),
        ...(extraTags?.(doc as Record<string, unknown>) ?? []),
      ],
      req.payload,
    );

    return doc;
  };
}

export function revalidateGlobalAfterChange(slug: string): GlobalAfterChangeHook {
  return ({ context, doc, req }) => {
    if (context?.disableRevalidate) return doc;
    purge([CONTENT_TAG, collectionTag(slug)], req.payload);
    return doc;
  };
}

/** Hook pair for a collection whose documents are addressed by slug. */
export function revalidateHooks(slug: string, options?: RevalidateOptions) {
  return {
    afterChange: [revalidateAfterChange(slug, options)],
    afterDelete: [revalidateAfterDelete(slug, options)],
  };
}

/** Tags a document's slug, so `/ref/playwuff` can be purged on its own. */
export const bySlug = (doc: Record<string, unknown>): string[] =>
  typeof doc.slug === "string" ? [`payload:slug:${doc.slug}`] : [];
