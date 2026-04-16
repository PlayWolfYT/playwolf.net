import { EarlyAccessScreen } from "@/components/EarlyAccessScreen";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { isMaintenanceMode } from "@/lib/maintenance";

/** Read MAINTENANCE_MODE at request time (Docker/Portainer), not only at `next build`. */
export const dynamic = "force-dynamic";

export default function Home() {
  if (isMaintenanceMode()) {
    return <MaintenanceScreen />;
  }
  return <EarlyAccessScreen />;
}
