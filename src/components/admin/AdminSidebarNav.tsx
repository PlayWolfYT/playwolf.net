"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavItem } from "@/components/admin/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavEntry =
  | { kind: "group"; label: string; key: string }
  | { kind: "link"; item: AdminNavItem };

function toEntries(items: AdminNavItem[]): NavEntry[] {
  const entries: NavEntry[] = [];
  let lastGroup: string | undefined;
  let groupIndex = 0;

  for (const item of items) {
    if (item.group && item.group !== lastGroup) {
      entries.push({
        kind: "group",
        label: item.group,
        key: `group-${groupIndex}-${item.group}`,
      });
      groupIndex += 1;
      lastGroup = item.group;
    }
    entries.push({ kind: "link", item });
  }

  return entries;
}

export function AdminSidebarNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const entries = toEntries(items);

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {entries.map((entry) => {
        if (entry.kind === "group") {
          return (
            <p
              key={entry.key}
              className="mt-3 px-3 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-parchment-dim first:mt-0"
            >
              {entry.label}
            </p>
          );
        }

        const { item } = entry;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-glow-500/10 text-glow-300 shadow-inner-glow"
                : "text-parchment-muted hover:bg-white/[0.04] hover:text-parchment"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
