import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { PATHNAME_HEADER } from "@/lib/maintenance";

/**
 * Forwards the request pathname into a request header so the frontend
 * template can honour maintenance-mode path exclusions. Maintenance itself is
 * decided in `app/(frontend)/template.tsx` (where site settings are loaded),
 * which remounts on every soft navigation.
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
