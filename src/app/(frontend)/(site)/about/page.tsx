import type { Metadata } from "next";
import { PenLineIcon } from "lucide-react";

import { PageHeader } from "@/components/site/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
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
        eyebrow="Studio notes"
        title="About"
        lede="A small corner of the internet for character design, commissioned art, and things made for the fun of making them."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <Badge className="w-fit">Field note 001</Badge>
            <CardTitle className="mt-5 text-3xl font-bold leading-[0.92] tracking-[-0.06em]">
              Personal work, kept personal.
            </CardTitle>
            <CardDescription className="mt-3">
              No algorithmic feed. No engagement treadmill. Just the archive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] opacity-55">
              playwolf.net / independent
            </p>
          </CardContent>
        </Card>

        {about ? (
          <Card className="[--card-spacing:--spacing(7)] sm:[--card-spacing:--spacing(10)]">
            <CardHeader>
              <CardTitle className="text-3xl font-bold tracking-[-0.055em]">
                The longer version
              </CardTitle>
              <CardDescription>Notes from behind the workbench.</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextContent
                className="max-w-3xl text-base leading-8 text-muted-foreground"
                value={about}
              />
            </CardContent>
          </Card>
        ) : (
          <Empty className="min-h-96 border bg-card/70">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PenLineIcon />
              </EmptyMedia>
              <EmptyTitle>The page is still unwritten</EmptyTitle>
              <EmptyDescription>
                Check back after the next studio session.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  );
}
