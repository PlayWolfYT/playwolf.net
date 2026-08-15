"use client";

import Link from "next/link";

import { useMaintenanceAccess } from "@/components/MaintenancePathGate";
import { NAV_ITEMS } from "@/components/site/nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FooterNav() {
  const { isAccessible } = useMaintenanceAccess();
  const visibleItems = NAV_ITEMS.filter((item) => isAccessible(item.href));

  if (visibleItems.length === 0) return null;

  return (
    <nav aria-label="Footer">
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-5 lg:grid-cols-2">
        {visibleItems.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-start rounded-lg font-mono text-[0.62rem] uppercase tracking-[0.15em]",
              )}
            >
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
