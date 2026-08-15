"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useMaintenanceAccess } from "@/components/MaintenancePathGate";
import { NAV_ITEMS } from "@/components/site/nav";
import { Wordmark } from "@/components/site/Wordmark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAccessible } = useMaintenanceAccess();
  const visibleItems = NAV_ITEMS.filter((item) => isAccessible(item.href));

  if (visibleItems.length === 0) return null;

  return (
    <Sheet key={pathname} open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl bg-background/70 sm:hidden"
          />
        }
      >
        <MenuIcon />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(26rem,92vw)] border-l-border/80 bg-popover/96 p-0 backdrop-blur-2xl sm:hidden"
      >
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="sr-only">Primary navigation</SheetTitle>
          <Wordmark />
        </SheetHeader>

        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="flex flex-col gap-2">
            {visibleItems.map((item, index) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex min-h-14 items-center justify-between rounded-xl px-4 transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="font-display text-lg font-semibold tracking-[-0.03em]">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[0.6rem] tracking-[0.2em]",
                        active
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground/55 group-hover:text-foreground/60",
                      )}
                    >
                      0{index + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <SheetFooter className="border-t border-border">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-muted-foreground">
            Character art · references · projects
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M5 7h14" />
      <path d="M8 12h11" />
      <path d="M5 17h14" />
    </svg>
  );
}
