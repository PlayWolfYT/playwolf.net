import { NextResponse } from "next/server";

import { getSiteSettings } from "@/lib/references";

/**
 * Public maintenance probe for the client path gate. Returns only the fields
 * needed to decide whether to show the maintenance screen — no secrets.
 */
export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(
    {
      maintenanceMode: Boolean(settings.maintenanceMode),
      maintenanceMessage: settings.maintenanceMessage ?? undefined,
      maintenanceExcludedPaths: settings.maintenanceExcludedPaths ?? [],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
