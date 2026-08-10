import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminNavItem } from "@/components/admin/nav";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { logoutAction } from "@/lib/admin/auth";
import type { User } from "@/payload-types";

/** Sidebar + content shell wrapping every authenticated `/admin/*` page. */
export function AdminShell({
  user,
  navItems,
  children,
}: {
  user: User;
  navItems: AdminNavItem[];
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-void">
      <BrandBackdrop density="soft" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[100rem]">
        <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-white/[0.07] bg-void/60 px-4 py-6 backdrop-blur-xl lg:flex">
          <Link
            href="/admin"
            className="font-display text-sm font-medium uppercase tracking-[0.28em] text-glow-500 transition hover:text-glow-400"
          >
            playwolf.net
          </Link>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-parchment-dim">
            Admin
          </p>

          <AdminSidebarNav items={navItems} />

          <div className="mt-auto flex flex-col gap-2 border-t border-white/[0.07] pt-4">
            <p className="truncate text-xs text-parchment-dim">{user.email}</p>
            <form action={logoutThenRedirect}>
              <button
                type="submit"
                className="w-full rounded-lg border border-white/10 px-3 py-1.5 text-xs text-parchment-muted transition hover:border-glow-500/40 hover:text-glow-300"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/[0.07] bg-void/60 px-4 py-3 backdrop-blur-xl lg:hidden">
            <Link
              href="/admin"
              className="font-display text-xs font-medium uppercase tracking-[0.28em] text-glow-500"
            >
              playwolf.net · Admin
            </Link>
            <form action={logoutThenRedirect}>
              <button type="submit" className="text-xs text-parchment-muted underline">
                Sign out
              </button>
            </form>
          </header>

          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

async function logoutThenRedirect(): Promise<void> {
  "use server";
  const { redirect } = await import("next/navigation");
  await logoutAction();
  redirect("/admin/login");
}
