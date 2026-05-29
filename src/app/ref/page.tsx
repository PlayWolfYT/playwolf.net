import Link from "next/link";
import type { Metadata } from "next";
import { SparkStar } from "@/components/BrandBackdrop";

export const metadata: Metadata = {
  title: "References · playwolf.net",
  description: "Reference sheets and art examples.",
};

type RefLink = { label: string; href: string };
type RefSection = { title: string; links: RefLink[] };

const sections: RefSection[] = [
  {
    title: "Reference Sheets",
    links: [
      { label: "SFW Refsheet", href: "/ref/sfw" },
      { label: "NSFW Refsheet", href: "/ref/nsfw" },
    ],
  },
  {
    title: "Examples",
    links: [
      { label: "SFW Examples", href: "/ref/examples" },
      { label: "NSFW Examples", href: "/ref/examples/nsfw" },
    ],
  },
];

export default function RefHome() {
  return (
    <div className="w-full">
      <div className="mb-10 flex justify-center gap-4 text-glow-500/40">
        <SparkStar className="h-4 w-4 animate-twinkle" />
        <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/25" />
        <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
      </div>

      <h1 className="text-center font-display text-3xl font-light tracking-tight text-parchment sm:text-4xl">
        References
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-parchment-muted">
        Reference sheets and art examples.
      </p>

      <div className="mx-auto mt-12 grid w-full max-w-xl gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-void-lift/90 to-void-panel/70 p-px shadow-glow-sm backdrop-blur-xl"
          >
            <div className="rounded-[calc(1.5rem-1px)] p-6 shadow-inner-glow">
              <h2 className="mb-4 font-display text-xs font-medium uppercase tracking-[0.28em] text-glow-500">
                {section.title}
              </h2>
              <div className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-glow-500/40 bg-glow-500/10 px-6 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:border-glow-500/60 hover:bg-glow-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
