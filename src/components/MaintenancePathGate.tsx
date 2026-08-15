"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { isPathExcludedFromMaintenance } from "@/lib/maintenance";

type MaintenanceStatus = {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceExcludedPaths: string[];
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
 * Client-side gate so soft navigations out of an excluded prefix (e.g. `/ref`
 * → `/projects`) still honour maintenance mode. The server template covers
 * full loads; this covers App Router client transitions via `usePathname`.
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
            ? data.maintenanceExcludedPaths.map(String)
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
    return <MaintenanceScreen message={status.maintenanceMessage} />;
  }

  return (
    <MaintenanceStatusContext.Provider value={status}>
      {children}
    </MaintenanceStatusContext.Provider>
  );
}
