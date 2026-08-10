export type AdminNavItem = {
  href: string;
  label: string;
  group?: string;
};

/**
 * Fallback nav used until the live Payload config is read. The sidebar prefers
 * `getAdminNavFromConfig()` so new collections appear automatically.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", group: "Overview" },
  { href: "/admin/collections/artworks", label: "Artworks", group: "Content" },
  { href: "/admin/collections/characters", label: "Characters", group: "Content" },
  { href: "/admin/collections/projects", label: "Projects", group: "Content" },
  { href: "/admin/collections/artists", label: "Artists", group: "People" },
  { href: "/admin/collections/friends", label: "Friends", group: "People" },
  { href: "/admin/collections/tags", label: "Tags", group: "Library" },
  { href: "/admin/collections/media", label: "Media", group: "Library" },
  { href: "/admin/collections/users", label: "Users", group: "System" },
  { href: "/admin/globals/siteSettings", label: "Site settings", group: "System" },
];
