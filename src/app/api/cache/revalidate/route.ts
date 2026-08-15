import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { isCacheRevalidationAuthorized } from "@/lib/cache-revalidation";
import { CONTENT_TAG } from "@/payload/hooks/revalidate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One cache invalidation boundary for out-of-process writers such as the seed
 * CLI. Payload admin writes run inside Next and invalidate from collection
 * hooks; standalone scripts cannot call next/cache directly.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (
    !isCacheRevalidationAuthorized(
      request.headers.get("authorization"),
      process.env.PAYLOAD_SECRET,
    )
  ) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // External writers need immediate expiry. The "max" profile is SWR and
  // deliberately serves the old value once, which is wrong immediately after a seed.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
