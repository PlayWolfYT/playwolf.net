import type { ReactNode } from "react";
import { ArrowUpRightIcon, GlobeIcon as WebsiteIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ContentLink, LinkKind } from "@/lib/content";
import { safeHref } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import {
  BlueskyIcon,
  BoostyIcon,
  DiscordIcon,
  EmailIcon,
  FurAffinityIcon,
  InstagramIcon,
  KofiIcon,
  LinktreeIcon,
  PatreonIcon,
  TelegramIcon,
  TrelloIcon,
  TwitchIcon,
  VGenIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/site/SocialIcons";

const ICON_CLASS = "";

type Presentation = {
  label: string;
  icon: ReactNode;
  /** Tailwind hover text color (also recolors mask icons via currentColor). */
  hoverClass: string;
  /** Platforms whose inferred handle reads naturally with an `@` prefix. */
  atPrefixed?: boolean;
};

/**
 * How each link kind renders. Replaces the long if-chain the old keyed
 * `socials` object needed — now that links arrive as an ordered array, order
 * and repetition are the data's business and this is only a lookup.
 */
const PRESENTATION: Record<LinkKind, Presentation> = {
  website: {
    label: "Website",
    icon: <WebsiteIcon />,
    hoverClass: "hover:text-glow-400",
  },
  twitter: {
    label: "X",
    icon: <XIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-white",
    atPrefixed: true,
  },
  bluesky: {
    label: "Bluesky",
    icon: <BlueskyIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#1185FE]",
    atPrefixed: true,
  },
  instagram: {
    label: "Instagram",
    icon: <InstagramIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#E1306C]",
    atPrefixed: true,
  },
  twitch: {
    label: "Twitch",
    icon: <TwitchIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#9146FF]",
    atPrefixed: true,
  },
  youtube: {
    label: "YouTube",
    icon: <YoutubeIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#FF0000]",
    atPrefixed: true,
  },
  furaffinity: {
    label: "FurAffinity",
    icon: <FurAffinityIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#FAAF3A]",
  },
  vgen: {
    label: "VGen",
    icon: <VGenIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#B8FF26]",
  },
  linktree: {
    label: "Linktree",
    icon: <LinktreeIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#43E660]",
  },
  kofi: {
    label: "Ko-fi",
    icon: <KofiIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#FF5E5B]",
  },
  patreon: {
    label: "Patreon",
    icon: <PatreonIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#FF424D]",
  },
  boosty: {
    label: "Boosty",
    icon: <BoostyIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#F15F2C]",
  },
  trello: {
    label: "Trello",
    icon: <TrelloIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#0052CC]",
  },
  telegram: {
    label: "Telegram",
    icon: <TelegramIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#26A5E4]",
    atPrefixed: true,
  },
  discord: {
    label: "Discord",
    icon: <DiscordIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-[#5865F2]",
  },
  email: {
    label: "Email",
    icon: <EmailIcon className={ICON_CLASS} />,
    hoverClass: "hover:text-glow-400",
  },
};

/** Best-effort handle from a profile URL, e.g. `https://t.me/abc` -> `@abc`. */
function inferHandle(kind: LinkKind, url: string): string | undefined {
  if (kind === "email") return url;

  if (kind === "discord") {
    return url.trim();
  }

  let segment: string | undefined;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    segment = parts[parts.length - 1];
  } catch {
    return undefined;
  }

  if (!segment) return undefined;
  if (!PRESENTATION[kind].atPrefixed) return segment;
  return segment.startsWith("@") ? segment : `@${segment}`;
}

type RenderedLink = {
  key: string;
  label: string;
  href?: string;
  icon: ReactNode;
  hoverClass: string;
};

/**
 * `links.url` is validated on save, but rows stored before that validation
 * existed still go straight into an `href`, so the scheme is re-checked here and
 * an unusable link is dropped from the row rather than rendered.
 *
 * The `mailto:` strip is for the same reason: `detectLinkKind` classifies a
 * pasted `mailto:` as `email`, which used to render as `mailto:mailto:…`.
 *
 * Discord usernames are stored bare (no URL) since Discord doesn't provide
 * profile URLs, so they render as unclickable text.
 */
function hrefFor(link: ContentLink): string | undefined {
  if (link.kind === "email") {
    const address = link.url.trim().replace(/^mailto:/i, "");
    return address ? `mailto:${address}` : undefined;
  }
  if (link.kind === "discord") {
    return undefined;
  }
  return safeHref(link.url);
}

function buildLinks(links: ContentLink[]): RenderedLink[] {
  // Two Telegrams with neither a description nor a distinguishable handle would
  // otherwise render as two identical tooltips, so they get numbered.
  const totals = new Map<LinkKind, number>();
  for (const link of links) {
    totals.set(link.kind, (totals.get(link.kind) ?? 0) + 1);
  }
  const seen = new Map<LinkKind, number>();

  return links.map((link, index) => {
    const href = hrefFor(link);
    const presentation = PRESENTATION[link.kind];
    const position = (seen.get(link.kind) ?? 0) + 1;
    seen.set(link.kind, position);

    const ordinal = (totals.get(link.kind) ?? 0) > 1 ? String(position) : undefined;
    const suffix = link.description ?? inferHandle(link.kind, link.url) ?? ordinal;

    return {
      key: `${link.kind}-${index}`,
      label: suffix ? `${presentation.label} (${suffix})` : presentation.label,
      href,
      icon: presentation.icon,
      hoverClass: presentation.hoverClass,
    };
  });
}

/**
 * Row of circular icon buttons with hover tooltips. Shared by the artist credit
 * bar, the site footer and friend cards, so every set of links on the site
 * behaves the same way.
 */
export function LinkRow({
  className = "",
  links,
  align = "center",
  mode = "icons",
}: {
  className?: string;
  links: ContentLink[];
  align?: "start" | "center" | "end";
  mode?: "icons" | "directory";
}) {
  const rendered = buildLinks(links);
  if (rendered.length === 0) return null;

  if (mode === "directory") {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
        {rendered.map((link) => {
          const isMail = link.href?.startsWith("mailto:");
          const isClickable = Boolean(link.href);
          const Component = isClickable ? "a" : "div";

          return (
            <Component
              key={link.key}
              {...(isClickable && link.href
                ? {
                    href: link.href,
                    target: isMail ? undefined : "_blank",
                    rel: isMail ? undefined : "noreferrer",
                  }
                : {})}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-auto min-h-16 justify-between rounded-xl px-5 whitespace-normal",
                isClickable ? link.hoverClass : "cursor-default",
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                {link.icon}
                <span className="truncate text-left">{link.label}</span>
              </span>
              {isClickable ? <ArrowUpRightIcon data-icon="inline-end" /> : null}
            </Component>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "start" && "justify-start",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className,
      )}
    >
      {rendered.map((link) => {
        const isMail = link.href?.startsWith("mailto:");
        const isClickable = Boolean(link.href);
        const Component = isClickable ? "a" : "span";

        return (
          <Tooltip key={link.key}>
            <TooltipTrigger
              render={
                <Component
                  {...(isClickable && link.href
                    ? {
                        href: link.href,
                        target: isMail ? undefined : "_blank",
                        rel: isMail ? undefined : "noreferrer",
                      }
                    : {})}
                  aria-label={link.label}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "rounded-xl bg-background/70 text-muted-foreground",
                    isClickable ? link.hoverClass : "cursor-default",
                  )}
                />
              }
            >
              {link.icon}
              <span className="sr-only">{link.label}</span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="max-w-56 whitespace-pre-line wrap-break-word text-center">
                {link.label}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
