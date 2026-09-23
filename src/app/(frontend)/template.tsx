import { MaintenancePathGate } from "@/components/MaintenancePathGate";
import { Analytics } from "@/components/site/Analytics";
import { SkipToContent } from "@/components/site/SkipToContent";
import { getSiteSettings } from "@/lib/references";

/**
 * Always pass the page through. Swapping this template's output for the
 * maintenance screen (and dropping `children`) makes the App Router treat the
 * two responses as different trees. A client transition then updates the URL
 * from the predicted route and keeps the screen on display until a full load
 * fetches the document again.
 *
 * `MaintenancePathGate` is a client component, so it can follow `usePathname()`
 * on soft navigations and reveal the page that was already in this slot.
 */
export default async function FrontendTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    maintenanceMode = false,
    maintenanceMessage,
    maintenanceExcludedPaths = [],
  } = await getSiteSettings();

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
