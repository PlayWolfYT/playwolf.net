import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { generateBlurPlaceholder } from "../hooks/blurPlaceholder";
import { revalidateHooks } from "../hooks/revalidate";

type CroppedUploadOptions = {
  slug: string;
  /** Singular label in the admin nav, e.g. "Friend image". */
  labels: { singular: string; plural: string };
  /**
   * Why this collection exists — shown as the collection description and used
   * in field helper text on the documents that point here.
   */
  description: string;
};

/**
 * Upload collections where Payload's crop tool is welcome. These hold
 * portraits, covers and social previews — images that are always shown inside
 * a framed slot — so rewriting the stored original on crop is the point.
 *
 * Artwork and reference sheets stay on `media`, where crop is off so the
 * untouched original remains available for "Open full image".
 */
export function createCroppedUploadCollection({
  slug,
  labels,
  description,
}: CroppedUploadOptions): CollectionConfig {
  const { afterChange, afterDelete } = revalidateHooks(slug);

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
    },
    hooks: {
      afterChange,
      afterDelete,
      beforeChange: [generateBlurPlaceholder],
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
    ],
  };
}

export const FriendImages = createCroppedUploadCollection({
  slug: "friend-images",
  labels: { singular: "Friend image", plural: "Friend images" },
  description:
    "Portraits for featured friends. Crop and focal point frame the card; the stored file is the cropped result.",
});

export const CharacterImages = createCroppedUploadCollection({
  slug: "character-images",
  labels: { singular: "Character image", plural: "Character images" },
  description:
    "Character overview / card portraits (main art). Reference sheets stay in Media so the full sheet is preserved.",
});

export const ProjectImages = createCroppedUploadCollection({
  slug: "project-images",
  labels: { singular: "Project image", plural: "Project images" },
  description:
    "Project cover images. Crop to the card frame; artwork and sheets stay in Media.",
});

export const SiteImages = createCroppedUploadCollection({
  slug: "site-images",
  labels: { singular: "Site image", plural: "Site images" },
  description:
    "Site-wide images such as the default social preview. Crop to the intended share frame.",
});
