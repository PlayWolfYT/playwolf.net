"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      className={cn(
        buttonVariants({
          variant: active ? "secondary" : "ghost",
          size: "sm",
        }),
        "rounded-lg px-3 font-mono text-[0.62rem] uppercase tracking-[0.16em]",
      )}
    >
      {children}
    </Link>
  );
}
