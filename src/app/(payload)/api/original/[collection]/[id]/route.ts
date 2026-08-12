import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getPayloadClient } from "@/lib/payload";
import { getOriginal } from "@/payload/originals/store";
import { UPLOAD_FRAMES, type FramedCollectionSlug } from "@/payload/uploadFrames";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    collection: string;
    id: string;
  }>;
};

/**
 * Streams the pristine sidecar original for a framed upload into the admin
 * crop drawer. Public `url` points at the cropped WebP; the drawer needs the
 * untouched bytes so re-crops do not compound. Gated to signed-in admins —
 * the sidecars are deliberately outside the public S3 URL space.
 *
 * Static segment takes precedence over Payload's `api/[...slug]` catch-all.
 */
export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { collection, id } = await params;

  if (!isFramedCollection(collection)) {
    return new NextResponse(null, { status: 404 });
  }

  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: "Unauthorized" }] },
      { status: 401 },
    );
  }

  let doc: {
    source?: { key?: string | null } | null;
  };

  try {
    doc = await payload.findByID({
      collection,
      id,
      depth: 0,
      overrideAccess: false,
      showHiddenFields: true,
      user,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 404;

    if (status === 403) {
      return NextResponse.json({ errors: [{ message: "Forbidden" }] }, { status: 403 });
    }

    return new NextResponse(null, { status: 404 });
  }

  const key = doc.source?.key;
  if (typeof key !== "string" || !key) {
    return new NextResponse(null, { status: 404 });
  }

  const stored = await getOriginal(key);
  if (!stored) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(stored.body), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": stored.contentType || "application/octet-stream",
      "Content-Length": String(stored.body.length),
    },
    status: 200,
  });
}

function isFramedCollection(slug: string): slug is FramedCollectionSlug {
  return Object.prototype.hasOwnProperty.call(UPLOAD_FRAMES, slug);
}
