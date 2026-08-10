import { redirect } from "next/navigation";

import { BrandBackdrop, SparkStar } from "@/components/BrandBackdrop";
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
    "w-full rounded-lg border border-white/10 bg-void-lift/70 px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/60 outline-none focus:border-glow-500/60 focus:ring-1 focus:ring-glow-500/40";
  const labelClass =
    "font-display text-xs font-medium uppercase tracking-[0.14em] text-parchment-muted";

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <BrandBackdrop density="soft" />

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="mb-8 flex items-center justify-center gap-3 text-glow-500/50"
          aria-hidden
        >
          <SparkStar className="h-4 w-4 animate-twinkle" />
          <SparkStar className="h-3 w-3 translate-y-1 text-glow-500/30" />
          <SparkStar className="h-4 w-4 animate-twinkle [animation-delay:600ms]" />
        </div>

        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-px shadow-glow-md backdrop-blur-2xl">
          <div className="relative rounded-[calc(1.5rem-1px)] bg-void-panel/80 px-7 py-9 shadow-inner-glow">
            <p className="text-center font-display text-xs font-medium uppercase tracking-[0.22em] text-glow-500">
              playwolf.net
            </p>
            <h1 className="mt-3 text-center font-display text-2xl font-light tracking-tight text-parchment">
              {alreadyHasUsers ? "Admin sign in" : "Create the first account"}
            </h1>

            {error ? (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
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
                  className="mt-2 inline-flex items-center justify-center rounded-lg border border-glow-500/40 bg-glow-500/10 px-4 py-2.5 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:bg-glow-500/20 hover:text-glow-300"
                >
                  Sign in
                </button>
              </form>
            ) : (
              <form
                action={createFirstUserFormAction}
                className="mt-6 flex flex-col gap-4"
              >
                <p className="text-center text-xs text-parchment-dim">
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
                  className="mt-2 inline-flex items-center justify-center rounded-lg border border-glow-500/40 bg-glow-500/10 px-4 py-2.5 text-sm font-medium text-glow-400 shadow-glow-sm transition hover:bg-glow-500/20 hover:text-glow-300"
                >
                  Create account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
