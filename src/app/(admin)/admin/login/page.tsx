import { redirect } from "next/navigation";

import {
  createFirstUserAction,
  getAdminUser,
  hasAnyUsers,
  loginAction,
} from "@/lib/admin/auth";

export const metadata = { title: "Sign in" };

async function signInAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await loginAction(email, password);
  if (!result.ok) {
    redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin");
}

async function createFirstUserFormAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const result = await createFirstUserAction(email, password, name);
  if (!result.ok) {
    redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
  }
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, user, alreadyHasUsers] = await Promise.all([
    searchParams,
    getAdminUser(),
    hasAnyUsers(),
  ]);

  if (user) redirect("/admin");

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";
  const labelClass = "text-sm font-medium text-zinc-800";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-6 py-16 text-zinc-900">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
            playwolf.net
          </p>
          <h1 className="mt-2 text-center text-xl font-semibold tracking-tight text-zinc-900">
            {alreadyHasUsers ? "Admin sign in" : "Create the first account"}
          </h1>

          {error ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
              {error}
            </p>
          ) : null}

          {alreadyHasUsers ? (
            <form action={signInAction} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                Sign in
              </button>
            </form>
          ) : (
            <form
              action={createFirstUserFormAction}
              className="mt-6 flex flex-col gap-4"
            >
              <p className="text-center text-xs text-zinc-500">
                No account exists yet. This form only appears once.
              </p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className={labelClass}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="new-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-password" className={labelClass}>
                  Password
                </label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                Create account
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
