import { revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  Payload,
} from "payload";

/**
 * Tag every Payload-backed fetch carries, so a change anywhere invalidates
 * pages that join across collections (an artwork title on a character page,
 * a friend's name on a "featuring" chip) without each hook having to know
 * which pages exist.
 */
export const CONTENT_TAG = "payload";

/** Per-collection tag, for reads that only depend on one collection. */
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
 * Next 16's `max` profile is stale-while-revalidate, so the first request after
 * an editor presses Save still receives old content. `{ expire: 0 }` makes
 * admin writes read-after-write consistent.
 */
function purge(tags: string[], payload: Payload): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
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
