import type { PayloadServerReactComponent, SanitizedCollectionConfig } from "payload";

import { FramedCollectionUploadClient } from "@/payload/components/FramedCollectionUpload.client";

/**
 * Collection edit Upload slot for framed Library collections. Renders the
 * client upload UI that locks crop to the on-site aspect ratio.
 */
export const FramedCollectionUpload: PayloadServerReactComponent<
  NonNullable<
    NonNullable<SanitizedCollectionConfig["admin"]["components"]>["edit"]
  >["Upload"]
> = () => {
  return <FramedCollectionUploadClient />;
};
