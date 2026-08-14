import type { Metadata } from "next";

import { LinkRow } from "@/components/site/LinkRow";
import { PageHeader } from "@/components/site/PageHeader";
import { getSiteSettings } from "@/lib/references";

export const metadata: Metadata = {
  title: "Links",
  description: "Where else to find playwolf.",
  alternates: { canonical: "/links" },
};

export default async function LinksPage() {
  const { links } = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageHeader
        eyebrow="playwolf.net"
        title="Links"
        lede="Everywhere else I can be found."
      />

      <div className="mt-12 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 px-6 py-10 shadow-glow-sm backdrop-blur-xl">
        {links.length > 0 ? (
          <LinkRow links={links} />
        ) : (
          <p className="text-center text-sm leading-relaxed text-parchment-muted">
            No links added yet.
          </p>
        )}
      </div>
    </div>
  );
}
