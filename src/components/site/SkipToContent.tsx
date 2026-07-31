/**
 * Off-screen until focused, then the first thing a keyboard user reaches.
 * Every layout that renders chrome gives its `<main>` the matching id.
 */
export const MAIN_CONTENT_ID = "main-content";

export function SkipToContent() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:border focus:border-glow-500/50 focus:bg-void focus:px-5 focus:text-sm focus:font-medium focus:text-glow-400 focus:shadow-glow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-glow-500"
    >
      Skip to content
    </a>
  );
}
