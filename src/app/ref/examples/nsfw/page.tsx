import type { Metadata } from "next";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { getExamples } from "@/lib/references";

export const metadata: Metadata = {
  title: "NSFW Examples · playwolf.net",
  description: "A gallery of NSFW art examples (18+).",
};

export default function NsfwExamplesPage() {
  const examples = getExamples(true);
  return (
    <ExampleGrid
      examples={examples}
      basePath="/ref/examples/nsfw"
      title="NSFW Examples"
      description="18+ content. Click any image to reveal."
    />
  );
}
