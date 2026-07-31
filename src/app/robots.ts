import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /**
       * The gallery's filters combine, so crawling them means crawling a
       * combinatorial number of URLs that all lead back to pages already in
       * the sitemap. `/admin` is behind a login and has nothing to index.
       */
      disallow: ["/gallery?*", "/admin"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
