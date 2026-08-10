import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV_ITEMS } from "@/components/admin/nav";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminNavFromConfig } from "@/lib/admin/registry";

/**
 * Wraps every authenticated `/admin/*` page with the sidebar shell. Grouped
 * separately from `/admin/login` so the login screen never renders the sidebar
 * or requires a session. Nav is derived from the live Payload config.
 */
export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, navItems] = await Promise.all([
    requireAdminUser(),
    getAdminNavFromConfig().catch(() => ADMIN_NAV_ITEMS),
  ]);

  return (
    <AdminShell user={user} navItems={navItems}>
      {children}
    </AdminShell>
  );
}
