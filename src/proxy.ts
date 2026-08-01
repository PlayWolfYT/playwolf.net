import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { PATHNAME_HEADER } from "@/lib/maintenance";

/**
 * Forwards the request pathname into a request header so the frontend root
 * layout can honour maintenance-mode path exclusions. Maintenance itself is
 * still decided in the layout (where site settings are already loaded).
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and files with an extension (favicons, images, etc.).
     * Admin/API also get the header; they do not use the frontend layout.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
