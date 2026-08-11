import { headers } from "next/headers";

import { getPayloadClient } from "@/lib/payload";
import type { User } from "@/payload-types";

/**
 * The signed-in admin user, or `null` when the Payload session cookie is
 * missing/invalid. Used by public pages that show admin-only metadata (e.g.
 * commission status on reference examples). Login / first-user / logout are
 * handled by the stock Payload admin UI.
 */
export async function getAdminUser(): Promise<User | null> {
  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });
  return (user as User | null) ?? null;
}
