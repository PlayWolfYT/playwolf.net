import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://playwolf.net";

/** Wildcard so it covers every upload collection, not just `media`. */
const MEDIA_FILE_PATHS = "/api/*/file/";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Uploads are served same-origin from `/api/{collection}/file/…`, which is
      // also where every `og:image` points. Disallowing `/api/` without this
      // exception would take the whole gallery out of Google Images.
      //
      // Google and Bing pick the longest matching rule and break ties in favour
      // of `Allow`, so the 12-character media rule beats the 5-character
      // `/api/` for a file path while the rest of the API stays disallowed.
      // Crawlers that ignore wildcards fall back to the broader `Disallow` and
      // simply skip the images, which is the safe direction to fail in.
      allow: ["/", MEDIA_FILE_PATHS],
      // The gallery's filters combine, so crawling them means crawling a
      // combinatorial number of URLs that all lead back to pages already in the
      // sitemap. `/admin` is behind a login and has nothing to index. `/api/` is
      // Payload's REST surface — the same content as the pages, in a form that
      // would compete with them for indexing.
      disallow: ["/gallery?*", "/admin", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
