import { headers } from "next/headers";

import { MaintenancePathGate } from "@/components/MaintenancePathGate";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { Analytics } from "@/components/site/Analytics";
import { SkipToContent } from "@/components/site/SkipToContent";
import { isPathExcludedFromMaintenance, PATHNAME_HEADER } from "@/lib/maintenance";
import { getSiteSettings } from "@/lib/references";

/**
 * Server gate for full loads + props for the client path gate. Templates
 * remount on navigation; the client gate covers soft navigations out of an
 * excluded prefix even when the RSC shell is reused.
 */
export default async function FrontendTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, headerStore] = await Promise.all([getSiteSettings(), headers()]);
  const {
    maintenanceMode = false,
    maintenanceMessage,
    maintenanceExcludedPaths = [],
  } = settings;
  const pathname = headerStore.get(PATHNAME_HEADER) ?? "/";
  const showMaintenance =
    Boolean(maintenanceMode) &&
    !isPathExcludedFromMaintenance(pathname, maintenanceExcludedPaths);

  if (showMaintenance) {
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return (
    <MaintenancePathGate
      maintenanceMode={Boolean(maintenanceMode)}
      maintenanceMessage={maintenanceMessage}
      maintenanceExcludedPaths={maintenanceExcludedPaths}
    >
      <SkipToContent />
      {children}
      <Analytics />
    </MaintenancePathGate>
  );
}
