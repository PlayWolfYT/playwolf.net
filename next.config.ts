import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

/**
 * Payload proxies uploads through its own route on this origin by default, so
 * media is same-origin and needs no allowlist. Set this only if Garage is ever
 * exposed directly (see `docs/DEPLOYMENT.md` section 6.3) — it is read at build
 * time, so changing it needs a rebuild.
 */
const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_URL;

function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  if (!mediaOrigin) return [];
  const { protocol, hostname, port } = new URL(mediaOrigin);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      port,
      pathname: "/**",
    },
  ];
}

const nextConfig: NextConfig = {
  /** Slim runtime image when using the bundled Dockerfile */
  output: "standalone",
  /**
   * `cacheComponents` stays off: Payload does not support it yet. Content
   * freshness comes from the `revalidateTag` calls in
   * `src/payload/hooks/revalidate.ts` instead.
   */
  images: {
    formats: ["image/avif", "image/webp"],
    /**
     * Capped at the widest derivative the media collection produces. The
     * default list tops out at 3840, which would only ever upscale a 2560px
     * display master and cost an encode to do it.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    /**
     * Uploads are immutable — Payload gives a re-upload a new filename — so
     * optimized variants can be held for a month rather than re-encoded.
     */
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: remotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // TLS is terminated at Nginx Proxy Manager; this only instructs the
          // browser. No Content-Security-Policy here: Payload's admin relies on
          // inline styles and would need a nonce pipeline to survive one.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
