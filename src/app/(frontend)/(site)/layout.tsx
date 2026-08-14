import { BrandBackdrop } from "@/components/BrandBackdrop";
import { absoluteUrl, JsonLd, type JsonLdNode } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MAIN_CONTENT_ID } from "@/components/site/SkipToContent";
import { getSiteSettings } from "@/lib/references";

/**
 * Site-level identity, attached here rather than to the root layout so that
 * `/ref` pages carry only the artwork graph their own pages emit — one `WebSite`
 * node per document is the point of it.
 */
function identityGraph(profileUrls: string[]): JsonLdNode[] {
  const person: JsonLdNode = {
    "@type": "Person",
    "@id": absoluteUrl("/#person"),
    name: "playwolf",
    url: absoluteUrl("/"),
    sameAs: profileUrls.length > 0 ? profileUrls : undefined,
  };

  return [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: "playwolf.net",
      url: absoluteUrl("/"),
      inLanguage: "en",
      description:
        "Character reference sheets, art examples, and portfolio for playwolf.",
      publisher: { "@id": person["@id"] },
    },
    person,
  ];
}

/**
 * Chrome for the portfolio side of the site. `/ref` has its own layout because
 * it wraps the same header and footer in a per-character theme; everything
 * else shares this one.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { links } = await getSiteSettings();

  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-void">
      <JsonLd nodes={identityGraph(links.map((link) => link.url))} />
      {/* `100lvh` keeps the layer stable when mobile browser chrome shows/hides. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[100lvh] overflow-hidden"
        aria-hidden
      >
        <BrandBackdrop density="soft" />
      </div>

      <SiteHeader />

      <main id={MAIN_CONTENT_ID} className="relative z-10 flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
