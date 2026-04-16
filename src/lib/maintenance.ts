/**
 * Toggle maintenance mode with env `MAINTENANCE_MODE`.
 * Truthy: "true", "1", "yes" (case-insensitive). Anything else is off.
 * Set in `.env.local` for local dev, or your host's environment for production.
 */
export function isMaintenanceMode(): boolean {
  const raw = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
