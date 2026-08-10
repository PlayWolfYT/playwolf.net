import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPayloadClient } from "@/lib/payload";
import type { User } from "@/payload-types";

/**
 * Payload's own login/refresh/logout endpoints (see
 * `node_modules/payload/dist/auth/cookies.js`) always name the session cookie
 * `${cookiePrefix}-token`, and the config never overrides `cookiePrefix`
 * (`src/payload.config.ts`), so it defaults to `payload`. Setting this cookie
 * by hand is exactly what those endpoints do — the custom admin just calls
 * `payload.login` through the Local API instead of hitting `/api/users/login`
 * over HTTP, then replicates the same `Set-Cookie`.
 */
const TOKEN_COOKIE = "payload-token";
const USERS_COLLECTION = "users";

async function setAuthCookie(token: string, exp: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(exp * 1000),
  });
}

async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

/** The signed-in admin user, or `null` when the session cookie is missing/invalid. */
export async function getAdminUser(): Promise<User | null> {
  const payload = await getPayloadClient();
  const headerList = await headers();
  const { user } = await payload.auth({ headers: headerList });
  return (user as User | null) ?? null;
}

/** Guards a server component / layout: redirects to the login page when signed out. */
export async function requireAdminUser(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Whether any admin account exists yet — drives the "create first user" form. */
export async function hasAnyUsers(): Promise<boolean> {
  const payload = await getPayloadClient();
  const { totalDocs } = await payload.count({
    collection: USERS_COLLECTION,
    overrideAccess: true,
  });
  return totalDocs > 0;
}

export type AuthActionResult = { ok: true } | { ok: false; error: string };

/** Signs in with the Local API and sets the same cookie Payload's own login endpoint would. */
export async function loginAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!email.trim() || !password) {
    return { ok: false, error: "Enter an email and password." };
  }

  const payload = await getPayloadClient();

  try {
    const result = await payload.login({
      collection: USERS_COLLECTION,
      data: { email: email.trim(), password },
    });
    if (!result.token || !result.exp) {
      return { ok: false, error: "Login succeeded but no session token was returned." };
    }
    await setAuthCookie(result.token, result.exp);
    return { ok: true };
  } catch {
    return { ok: false, error: "Incorrect email or password." };
  }
}

/** First-run signup, only usable while the `users` collection is empty. */
export async function createFirstUserAction(
  email: string,
  password: string,
  name?: string,
): Promise<AuthActionResult> {
  if (!email.trim() || !password) {
    return { ok: false, error: "Enter an email and password." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const payload = await getPayloadClient();

  if (await hasAnyUsers()) {
    return { ok: false, error: "An account already exists — sign in instead." };
  }

  try {
    await payload.create({
      collection: USERS_COLLECTION,
      data: { email: email.trim(), password, name: name?.trim() || undefined },
      overrideAccess: true,
    });
    const result = await payload.login({
      collection: USERS_COLLECTION,
      data: { email: email.trim(), password },
    });
    if (!result.token || !result.exp) {
      return { ok: false, error: "Account created but no session token was returned." };
    }
    await setAuthCookie(result.token, result.exp);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create the account.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
}
