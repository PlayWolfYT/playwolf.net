import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminNavItem } from "@/components/admin/nav";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
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
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[100rem]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
          <div className="border-b border-zinc-200 px-4 py-5">
            <Link
              href="/admin"
              className="text-sm font-semibold tracking-tight text-zinc-900 transition hover:text-sky-700"
            >
              playwolf.net
            </Link>
            <p className="mt-0.5 text-xs text-zinc-500">Admin</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <AdminSidebarNav items={navItems} />
          </div>

          <div className="mt-auto border-t border-zinc-200 px-4 py-4">
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <form action={logoutThenRedirect} className="mt-2">
              <button
                type="submit"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
            <Link href="/admin" className="text-sm font-semibold text-zinc-900">
              playwolf.net · Admin
            </Link>
            <form action={logoutThenRedirect}>
              <button
                type="submit"
                className="text-xs font-medium text-sky-700 underline"
              >
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
