import type { Artist, SocialEntry } from "@/lib/references";
import {
  BlueskyIcon,
  BoostyIcon,
  EmailIcon,
  FurAffinityIcon,
  InstagramIcon,
  KofiIcon,
  LinktreeIcon,
  PatreonIcon,
  TelegramIcon,
  GlobeIcon,
  TrelloIcon,
  VGenIcon,
  XIcon,
} from "@/components/ref/SocialIcons";

type SocialLink = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Tailwind hover text color (also recolors mask icons via currentColor) */
  hoverClass: string;
};

const ICON_CLASS = "h-[18px] w-[18px]";

type Platform =
  | "twitter"
  | "bluesky"
  | "instagram"
  | "furaffinity"
  | "vgen"
  | "linktree"
  | "kofi"
  | "patreon"
  | "boosty"
  | "trello"
  | "telegram"
  | "email"
  | "website";

/** Platforms whose inferred handle reads naturally with an `@` prefix. */
const AT_PREFIXED: ReadonlySet<Platform> = new Set([
  "twitter",
  "bluesky",
  "instagram",
  "telegram",
]);

function normalize(entry: SocialEntry): { url: string; description?: string } {
  return typeof entry === "string" ? { url: entry } : entry;
}

/** Best-effort handle from a profile URL, e.g. `https://t.me/abc` -> `@abc`. */
function inferHandle(platform: Platform, url: string): string | undefined {
  if (platform === "email") return url;
  let segment: string | undefined;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    segment = parts[parts.length - 1];
  } catch {
    return undefined;
  }
  if (!segment) return undefined;
  return AT_PREFIXED.has(platform) ? `@${segment}` : segment;
}

/** `Base` or `Base (suffix)` when a description/handle is available. */
function labelWith(base: string, suffix?: string): string {
  return suffix ? `${base} (${suffix})` : base;
}

/** Build the ordered list of present social links for an artist. */
function buildLinks(artist: Artist): SocialLink[] {
  const socials = artist.socials;
  if (!socials) return [];

  const links: SocialLink[] = [];

  const add = (
    platform: Platform,
    base: string,
    entry: SocialEntry,
    icon: React.ReactNode,
    hoverClass: string,
    options?: { key?: string; href?: string; fallback?: string },
  ) => {
    const { url, description } = normalize(entry);
    const suffix =
      description ?? inferHandle(platform, url) ?? options?.fallback;
    links.push({
      key: options?.key ?? platform,
      label: labelWith(base, suffix),
      href: options?.href ?? url,
      icon,
      hoverClass,
    });
  };

  if (socials.twitter) {
    add(
      "twitter",
      "X",
      socials.twitter,
      <XIcon className={ICON_CLASS} />,
      "hover:text-white",
    );
  }
  if (socials.bluesky) {
    add(
      "bluesky",
      "Bluesky",
      socials.bluesky,
      <BlueskyIcon className={ICON_CLASS} />,
      "hover:text-[#1185FE]",
    );
  }
  if (socials.instagram) {
    add(
      "instagram",
      "Instagram",
      socials.instagram,
      <InstagramIcon className={ICON_CLASS} />,
      "hover:text-[#E1306C]",
    );
  }
  if (socials.furaffinity) {
    add(
      "furaffinity",
      "FurAffinity",
      socials.furaffinity,
      <FurAffinityIcon className={ICON_CLASS} />,
      "hover:text-[#FAAF3A]",
    );
  }
  if (socials.vgen) {
    add(
      "vgen",
      "VGen",
      socials.vgen,
      <VGenIcon className={ICON_CLASS} />,
      "hover:text-[#B8FF26]",
    );
  }
  if (socials.linktree) {
    add(
      "linktree",
      "Linktree",
      socials.linktree,
      <LinktreeIcon className={ICON_CLASS} />,
      "hover:text-[#43E660]",
    );
  }
  if (socials.kofi) {
    add(
      "kofi",
      "Ko-fi",
      socials.kofi,
      <KofiIcon className={ICON_CLASS} />,
      "hover:text-[#FF5E5B]",
    );
  }
  if (socials.patreon) {
    add(
      "patreon",
      "Patreon",
      socials.patreon,
      <PatreonIcon className={ICON_CLASS} />,
      "hover:text-[#FF424D]",
    );
  }
  if (socials.boosty) {
    add(
      "boosty",
      "Boosty",
      socials.boosty,
      <BoostyIcon className={ICON_CLASS} />,
      "hover:text-[#F15F2C]",
    );
  }
  if (socials.trello) {
    add(
      "trello",
      "Trello",
      socials.trello,
      <TrelloIcon className={ICON_CLASS} />,
      "hover:text-[#0052CC]",
    );
  }
  if (socials.telegram) {
    const entries = socials.telegram;
    entries.forEach((entry, index) => {
      add(
        "telegram",
        "Telegram",
        entry,
        <TelegramIcon className={ICON_CLASS} />,
        "hover:text-[#26A5E4]",
        {
          key: `telegram-${index}`,
          fallback: entries.length > 1 ? `${index + 1}` : undefined,
        },
      );
    });
  }
  if (socials.email) {
    const { url } = normalize(socials.email);
    add(
      "email",
      "Email",
      socials.email,
      <EmailIcon className={ICON_CLASS} />,
      "hover:text-glow-400",
      { href: `mailto:${url}` },
    );
  }
  if (socials.website) {
    const entries = Array.isArray(socials.website)
      ? socials.website
      : [socials.website];
    entries.forEach((entry, index) => {
      add(
        "website",
        "Website",
        entry,
        <GlobeIcon className={ICON_CLASS} />,
        "hover:text-glow-400",
        {
          key: `website-${index}`,
          href: normalize(entry).url,
          fallback: entries.length > 1 ? `${index + 1}` : undefined,
        },
      );
    });
  }

  return links;
}

/**
 * Credit bar for a piece of artwork. Styled to sit flush against the bottom of
 * the image inside the same card — hence the divider on top and rounding only
 * on the bottom corners.
 */
export function ArtistBar({ artist }: { artist: Artist }) {
  const links = buildLinks(artist);

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-b-3xl border-t border-white/[0.12] bg-gradient-to-br from-void-lift to-void-panel px-5 py-4 sm:flex-row">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-glow-500">
          Artist
        </span>
        <span className="font-display text-base font-medium text-parchment">
          {artist.name}
        </span>
      </div>

      {links.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {links.map((link) => {
            const isMail = link.href.startsWith("mailto:");
            return (
              <a
                key={link.key}
                href={link.href}
                target={isMail ? undefined : "_blank"}
                rel={isMail ? undefined : "noreferrer"}
                aria-label={link.label}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-void/70 text-parchment-muted transition hover:border-white/25 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${link.hoverClass}`}
              >
                {link.icon}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 max-w-[14rem] -translate-x-1/2 translate-y-1 whitespace-pre-line break-words rounded-md border border-white/10 bg-void-panel px-2 py-1 text-center text-[0.7rem] font-medium leading-snug text-parchment opacity-0 shadow-glow-sm transition duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
