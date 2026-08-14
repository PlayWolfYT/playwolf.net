import type { Metadata } from "next";
import { PenLineIcon } from "lucide-react";

import { PageHeader } from "@/components/site/PageHeader";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getSiteSettings } from "@/lib/references";
import { RichTextContent, richTextToPlainText } from "@/lib/rich-text";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSiteSettings();
  return {
    title: "About",
    description: richTextToPlainText(about) ?? "About playwolf.",
  };
}

export default async function AboutPage() {
  const { about } = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <PageHeader
        eyebrow="About me"
        title="Hi, I&rsquo;m PlayWolf."
        lede="This is my small corner of the internet for characters, art, code, and things I make because they sound fun."
      />

      {about ? (
        <article className="mt-12 max-w-3xl">
          <RichTextContent
            className="text-base leading-8 text-muted-foreground sm:text-lg"
            value={about}
          />
        </article>
      ) : (
        <Empty className="mt-10 min-h-96 border bg-card/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PenLineIcon />
            </EmptyMedia>
            <EmptyTitle>I haven&rsquo;t written this part yet</EmptyTitle>
            <EmptyDescription>There will be more about me here soon.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
