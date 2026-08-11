import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { generateBlurPlaceholder } from "../hooks/blurPlaceholder";
import {
  cleanupFramedOriginalAfterDelete,
  framedCropBeforeOperation,
} from "../hooks/framedCrop";
import { revalidateHooks } from "../hooks/revalidate";
import {
  frameAdminDescription,
  type FramedCollectionSlug,
  UPLOAD_FRAMES,
} from "../uploadFrames";

type CroppedUploadOptions = {
  slug: FramedCollectionSlug;
  /** Singular label in the admin nav, e.g. "Friend image". */
  labels: { singular: string; plural: string };
};

/**
 * Upload collections for framed UI images (friend banners, character cards,
 * project covers, OG previews). Cropping is aspect-locked to `UPLOAD_FRAMES`,
 * but the pristine upload is kept as an `originals/` sidecar and the public
 * file is re-derived on every save — see `hooks/framedCrop.ts`.
 *
 * Artwork and reference sheets stay on `media`, where crop is off so the
 * untouched original remains available for "Open full image".
 *
 * `FramedCollectionUpload` replaces the stock Upload so the crop drawer uses
 * `AspectLockedEditUpload` with that frame.
 */
export function createCroppedUploadCollection({
  slug,
  labels,
}: CroppedUploadOptions): CollectionConfig {
  const { afterChange, afterDelete } = revalidateHooks(slug);
  const frame = UPLOAD_FRAMES[slug];
  const description = frameAdminDescription(frame);

  return {
    slug,
    labels,
    access: {
      create: authenticated,
      delete: authenticated,
      read: anyone,
      update: authenticated,
    },
    admin: {
      description,
      group: "Library",
      useAsTitle: "filename",
      components: {
        edit: {
          Upload: "@/payload/components/FramedCollectionUpload#FramedCollectionUpload",
        },
      },
    },
    hooks: {
      afterChange,
      afterDelete: [...afterDelete, cleanupFramedOriginalAfterDelete],
      beforeChange: [generateBlurPlaceholder],
      beforeOperation: [framedCropBeforeOperation],
    },
    upload: {
      adminThumbnail: "thumbnail",
      crop: true,
      focalPoint: true,
      mimeTypes: ["image/*"],
      imageSizes: [
        {
          name: "thumbnail",
          width: 480,
          withoutEnlargement: true,
          formatOptions: { format: "webp", options: { quality: 78 } },
        },
        {
          // Exact on-site frame — shown in admin "Preview sizes" and used as a
          // reference for how the public card crops.
          name: "frame",
          width: frame.referenceSize.width,
          height: frame.referenceSize.height,
          withoutEnlargement: true,
          formatOptions: { format: "webp", options: { quality: 82 } },
        },
        {
          name: "card",
          width: 1024,
          withoutEnlargement: true,
          formatOptions: { format: "webp", options: { quality: 80 } },
        },
        {
          name: "display",
          width: 2560,
          withoutEnlargement: true,
          formatOptions: { format: "webp", options: { quality: 82 } },
        },
      ],
    },
    fields: [
      {
        name: "alt",
        type: "text",
        admin: {
          description:
            "Describes the image for screen readers and when it fails to load.",
        },
      },
      {
        name: "blurDataURL",
        type: "text",
        admin: {
          description:
            "Generated on upload and used as the `next/image` blur placeholder.",
          hidden: true,
          readOnly: true,
        },
      },
      {
        /**
         * Points at the pristine sidecar copy of the upload under the
         * `originals/` prefix (see `payload/originals/store.ts`). Its pixel
         * dimensions are recorded alongside it because every stored crop is a
         * percentage *of this image*, and the crop hook needs them before it has
         * decoded anything. Null on documents that predate non-destructive
         * cropping; the hook adopts their current file as the original on the
         * next save.
         */
        name: "source",
        type: "group",
        admin: {
          hidden: true,
          readOnly: true,
        },
        fields: [
          { name: "key", type: "text" },
          { name: "width", type: "number" },
          { name: "height", type: "number" },
          { name: "mimeType", type: "text" },
        ],
      },
      {
        /**
         * The crop that derives the stored file from `source`, as percentages of
         * the original. Unlike Payload's transient `uploadEdits.crop` these
         * survive on the document, so re-opening the drawer restores the exact
         * selection instead of starting over — and they are free to go negative
         * or past 100, which is what lets a crop extend into padding beyond the
         * original's edges.
         */
        name: "crop",
        type: "group",
        admin: {
          hidden: true,
          readOnly: true,
        },
        fields: [
          { name: "x", type: "number" },
          { name: "y", type: "number" },
          { name: "width", type: "number" },
          { name: "height", type: "number" },
        ],
      },
    ],
  };
}

export const FriendImages = createCroppedUploadCollection({
  slug: "friend-images",
  labels: { singular: "Friend image", plural: "Friend images" },
});

export const CharacterImages = createCroppedUploadCollection({
  slug: "character-images",
  labels: { singular: "Character image", plural: "Character images" },
});

export const ProjectImages = createCroppedUploadCollection({
  slug: "project-images",
  labels: { singular: "Project image", plural: "Project images" },
});

export const SiteImages = createCroppedUploadCollection({
  slug: "site-images",
  labels: { singular: "Site image", plural: "Site images" },
});
