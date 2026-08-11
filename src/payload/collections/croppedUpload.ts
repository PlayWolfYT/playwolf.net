import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { generateBlurPlaceholder } from "../hooks/blurPlaceholder";
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
 * Upload collections where Payload's crop tool is welcome. These hold
 * portraits, covers and social previews — images that are always shown inside
 * a framed slot — so rewriting the stored original on crop is the point.
 *
 * Artwork and reference sheets stay on `media`, where crop is off so the
 * untouched original remains available for "Open full image".
 *
 * Each collection maps to a fixed on-site aspect ratio (`UPLOAD_FRAMES`); the
 * admin crop UI locks to that ratio via `AspectLockedEditUpload`.
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
