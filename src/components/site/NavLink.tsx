"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Navigation entry that knows whether it is the current section. Matches on
 * prefix so `/ref/playwuff/nsfw` still highlights "References", and marks the
 * match with `aria-current` rather than relying on colour alone.
 */
export function NavLink({ children, href }: { children: ReactNode; href: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium uppercase tracking-[0.2em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 ${
        active ? "text-glow-400" : "text-parchment-dim hover:text-parchment"
      }`}
    >
      {children}
    </Link>
  );
}
