import { EarlyAccessScreen } from "@/components/EarlyAccessScreen";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { isMaintenanceMode } from "@/lib/maintenance";

export default function Home() {
  if (isMaintenanceMode()) {
    return <MaintenanceScreen />;
  }
  return <EarlyAccessScreen />;
}
