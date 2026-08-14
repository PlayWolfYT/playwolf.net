import type { ReactNode } from "react";
import type { ContentLink, LinkKind } from "@/lib/content";
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
  GlobeIcon,
  TrelloIcon,
  TwitchIcon,
  VGenIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/site/SocialIcons";

const ICON_CLASS = "h-[18px] w-[18px]";

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
    icon: <GlobeIcon className={ICON_CLASS} />,
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
  href: string;
  icon: ReactNode;
  hoverClass: string;
};

function buildLinks(links: ContentLink[]): RenderedLink[] {
  // Two Telegrams with neither a description nor a distinguishable handle would
  // otherwise render as two identical tooltips, so they get numbered.
  const totals = new Map<LinkKind, number>();
  for (const link of links) {
    totals.set(link.kind, (totals.get(link.kind) ?? 0) + 1);
  }
  const seen = new Map<LinkKind, number>();

  return links.map((link, index) => {
    const presentation = PRESENTATION[link.kind];
    const position = (seen.get(link.kind) ?? 0) + 1;
    seen.set(link.kind, position);

    const ordinal = (totals.get(link.kind) ?? 0) > 1 ? String(position) : undefined;
    const suffix = link.description ?? inferHandle(link.kind, link.url) ?? ordinal;

    return {
      key: `${link.kind}-${index}`,
      label: suffix ? `${presentation.label} (${suffix})` : presentation.label,
      href: link.kind === "email" ? `mailto:${link.url}` : link.url,
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
}: {
  className?: string;
  links: ContentLink[];
}) {
  const rendered = buildLinks(links);
  if (rendered.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {rendered.map((link) => {
        const isMail = link.href.startsWith("mailto:");
        return (
          <a
            key={link.key}
            href={link.href}
            target={isMail ? undefined : "_blank"}
            rel={isMail ? undefined : "noreferrer"}
            aria-label={link.label}
            className={`group/social relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment-muted transition hover:border-white/25 hover:bg-white/6 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${link.hoverClass}`}
          >
            {link.icon}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 max-w-56 -translate-x-1/2 translate-y-1 whitespace-pre-line wrap-break-word rounded-md border border-white/10 bg-void-panel px-2 py-1 text-center text-[0.7rem] font-medium leading-snug text-parchment opacity-0 shadow-glow-sm transition duration-150 group-hover/social:translate-y-0 group-hover/social:opacity-100 group-focus-visible/social:translate-y-0 group-focus-visible/social:opacity-100">
              {link.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
