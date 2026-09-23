"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import type { MaintenanceExcludedPath } from "@/lib/content";
import { isPathExcludedFromMaintenance } from "@/lib/maintenance";

type MaintenanceStatus = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceExcludedPaths: MaintenanceExcludedPath[];
};

const MaintenanceStatusContext = createContext<MaintenanceStatus | null>(null);

export function useMaintenanceAccess() {
  const status = useContext(MaintenanceStatusContext);

  return {
    isAccessible(pathname: string) {
      return (
        !status?.maintenanceMode ||
        isPathExcludedFromMaintenance(pathname, status.maintenanceExcludedPaths)
      );
    },
  };
}

type MaintenancePathGateProps = MaintenanceStatus & {
  children: React.ReactNode;
};

/**
 * Shows the maintenance screen, or the page, from the live URL.
 *
 * The server template always mounts this gate and always passes `children`.
 * Soft navigations therefore keep one tree shape: the URL change updates
 * `usePathname()`, and an excluded path reveals the page already in the slot.
 * Replacing the whole template with the screen (and dropping `children`) makes
 * the router update the address bar and leave the screen in place until reload.
 */
export function MaintenancePathGate({
  maintenanceMode: initialMode,
  maintenanceMessage: initialMessage,
  maintenanceExcludedPaths: initialExcluded,
  children,
}: MaintenancePathGateProps) {
  const pathname = usePathname() || "/";
  const [status, setStatus] = useState<MaintenanceStatus>(() => ({
    maintenanceMode: initialMode,
    maintenanceMessage: initialMessage,
    maintenanceExcludedPaths: initialExcluded,
  }));

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/maintenance", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: MaintenanceStatus | null) => {
        if (cancelled || !data) return;
        setStatus({
          maintenanceMode: Boolean(data.maintenanceMode),
          maintenanceMessage: data.maintenanceMessage,
          maintenanceExcludedPaths: Array.isArray(data.maintenanceExcludedPaths)
            ? data.maintenanceExcludedPaths.map((entry) =>
                typeof entry === "string" ? { path: entry } : entry,
              )
            : [],
        });
      })
      .catch(() => {
        // Keep the last known status if the probe fails.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const blocked =
    status.maintenanceMode &&
    !isPathExcludedFromMaintenance(pathname, status.maintenanceExcludedPaths);

  if (blocked) {
    return (
      <MaintenanceScreen
        message={status.maintenanceMessage}
        excludedPaths={status.maintenanceExcludedPaths}
      />
    );
  }

  return (
    <MaintenanceStatusContext.Provider value={status}>
      {children}
    </MaintenanceStatusContext.Provider>
  );
}
