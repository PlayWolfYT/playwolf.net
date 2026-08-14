import type { Metadata } from "next";
import { RadioTowerIcon } from "lucide-react";

import { LinkRow } from "@/components/site/LinkRow";
import { PageHeader } from "@/components/site/PageHeader";
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
import { getSiteSettings } from "@/lib/references";

export const metadata: Metadata = {
  title: "Links",
  description: "Where else to find playwolf.",
};

export default async function LinksPage() {
  const { links } = await getSiteSettings();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8 lg:pb-32">
      <PageHeader
        eyebrow="Outbound signal"
        title="Elsewhere"
        lede="Social feeds, commission pages, support links, and every other place the work escapes to."
      />

      {links.length > 0 ? (
        <Card className="mt-10 [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-[-0.045em]">
              Pick a frequency
            </CardTitle>
            <CardDescription>
              External links open in a new tab. Email opens your default mail app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkRow links={links} mode="directory" />
          </CardContent>
        </Card>
      ) : (
        <Empty className="mt-10 min-h-80 border bg-card/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioTowerIcon />
            </EmptyMedia>
            <EmptyTitle>No signal yet</EmptyTitle>
            <EmptyDescription>
              External profiles will appear here once they are connected.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
