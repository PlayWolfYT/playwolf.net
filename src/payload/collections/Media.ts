import type { CollectionConfig } from "payload";

import { anyone, authenticated } from "../access";
import { generateBlurPlaceholder } from "../hooks/blurPlaceholder";
import { revalidateHooks } from "../hooks/revalidate";

const { afterChange, afterDelete } = revalidateHooks("media");

/**
 * Artwork and reference-sheet library. The uploaded bytes are stored untouched
 * — that copy is what "Open full image" links to — and the derivatives below
 * are the only thing `next/image` is ever pointed at, so the optimizer never
 * has to decode a 15 MB PNG on a cache miss.
 *
 * Cropping is deliberately off: Payload's crop tool rewrites the stored
 * original, which would defeat the point. Focal point is kept, since it only
 * influences how the derivatives are framed.
 *
 * Framed UI images (friend portraits, character cards, project covers, OG)
 * live in their own Library collections where crop is enabled.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
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
    crop: false,
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
      name: "caption",
      type: "text",
      admin: {
        description: "Optional visible caption.",
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
