import type { Metadata } from "next";
import { ExampleGrid } from "@/components/ref/ExampleGrid";
import { getExamples } from "@/lib/references";

export const metadata: Metadata = {
  title: "SFW Examples · playwolf.net",
  description: "A gallery of SFW art examples.",
};

export default function SfwExamplesPage() {
  const examples = getExamples(false);
  return (
    <ExampleGrid
      examples={examples}
      basePath="/ref/examples"
      title="SFW Examples"
      description="A gallery of art examples."
    />
  );
}
