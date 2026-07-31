import type { CollectionBeforeChangeHook } from "payload";

/** Wide enough to hint at composition, small enough to inline in the HTML. */
const PLACEHOLDER_WIDTH = 16;

const SKIPPED_MIME_TYPES = new Set(["image/svg+xml", "image/gif"]);

/**
 * Generates the `blurDataURL` that static `next/image` imports used to provide
 * for free. Runs off the in-memory upload buffer, so it costs one extra sharp
 * pass at upload time and nothing at request time.
 *
 * Only fires when a new file is attached — editing an alt text re-runs the
 * hook but leaves the existing placeholder alone.
 */
export const generateBlurPlaceholder: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  const file = req.file;
  if (!file?.data?.length) return data;
  if (!file.mimetype?.startsWith("image/")) return data;
  if (SKIPPED_MIME_TYPES.has(file.mimetype)) return data;

  const sharp = req.payload.config.sharp;
  if (!sharp) return data;

  try {
    const buffer = await sharp(file.data)
      .rotate()
      .resize(PLACEHOLDER_WIDTH, null, { fit: "inside" })
      .webp({ quality: 40, alphaQuality: 40, smartSubsample: true })
      .toBuffer();

    return {
      ...data,
      blurDataURL: `data:image/webp;base64,${buffer.toString("base64")}`,
    };
  } catch (error) {
    req.payload.logger.warn(
      { err: error, file: file.name },
      "Could not generate a blur placeholder; the image will render without one",
    );
    return data;
  }
};
