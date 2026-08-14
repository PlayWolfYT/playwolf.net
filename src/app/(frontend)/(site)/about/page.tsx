import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { getSiteSettings } from "@/lib/references";
import { RichTextContent, richTextToMetaDescription } from "@/lib/rich-text";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSiteSettings();
  return {
    title: "About",
    description: richTextToMetaDescription(about) ?? "About playwolf.",
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const { about } = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-16 sm:px-8 sm:pt-24">
      <PageHeader eyebrow="playwolf.net" title="About" />

      <div className="mt-12 rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 px-6 py-8 shadow-glow-sm backdrop-blur-xl sm:px-10 sm:py-10">
        {about ? (
          <RichTextContent
            className="text-sm leading-relaxed text-parchment-muted"
            value={about}
          />
        ) : (
          <p className="text-center text-sm leading-relaxed text-parchment-muted">
            Nothing written here yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
