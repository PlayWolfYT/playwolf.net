"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavItem } from "@/components/admin/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavEntry =
  { kind: "group"; label: string; key: string } | { kind: "link"; item: AdminNavItem };

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
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {entries.map((entry) => {
        if (entry.kind === "group") {
          return (
            <p
              key={entry.key}
              className="mt-4 px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-400 first:mt-0"
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
                ? "bg-sky-50 font-medium text-sky-800"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
