import { NextResponse } from "next/server";

import { getPayloadClient } from "@/lib/payload";
import { processCommissionReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${secret}`) return true;

  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

async function handle(request: Request): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getPayloadClient();
  const result = await processCommissionReminders(payload);

  return NextResponse.json({
    ok: result.errors.length === 0,
    sent: result.sent,
    errors: result.errors,
  });
}

export function GET(request: Request): Promise<NextResponse> {
  return handle(request);
}

export function POST(request: Request): Promise<NextResponse> {
  return handle(request);
}
