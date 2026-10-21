"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface ScannerMachine {
  id: string;
  sourceOrder: number;
  name: string;
  locationCode: string;
}

interface QRScannerContextType {
  isOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  machines: ScannerMachine[];
  handleMachineIdentified: (machine: ScannerMachine) => void;
  isLoadingMachines: boolean;
  isLoadedMachines: boolean;
  machinesError: string | null;
  reloadMachines: () => Promise<void>;
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(undefined);

export function QRScannerProvider({
  children,
  initialMachines = [],
}: {
  children: React.ReactNode;
  initialMachines?: ScannerMachine[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [machines, setMachines] = useState<ScannerMachine[]>(initialMachines);
  const [isLoaded, setIsLoaded] = useState(initialMachines.length > 0);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [machinesError, setMachinesError] = useState<string | null>(null);

  let router: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback for test / headless environments
  }

  let pathname = "/";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() || "/";
  } catch {
    // Fallback for test / headless environments
  }

  // Fetch machines on demand (only when scanner is open or explicitly requested)
  const fetchMachines = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsLoadingMachines(true);
    setMachinesError(null);
    try {
      const res = await fetch("/api/equipment/active");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.machines)) {
        setMachines(data.machines);
        setIsLoaded(true);
      } else {
        setMachinesError(data?.error || "Không thể tải danh sách thiết bị");
      }
    } catch (err: any) {
      console.warn("[QRScannerContext] Failed to load machines:", err);
      setMachinesError(err?.message || "Lỗi kết nối khi tải danh sách thiết bị");
    } finally {
      setIsLoadingMachines(false);
    }
  }, []);

  const openScanner = useCallback(() => {
    setIsOpen(true);
    if (!isLoaded && !isLoadingMachines) {
      fetchMachines();
    }
  }, [isLoaded, isLoadingMachines, fetchMachines]);

  // If scanner opened directly (e.g. by state change), ensure machines are loaded
  useEffect(() => {
    if (isOpen && !isLoaded && !isLoadingMachines && !machinesError) {
      fetchMachines();
    }
  }, [isOpen, isLoaded, isLoadingMachines, machinesError, fetchMachines]);

  const reloadMachines = useCallback(async () => {
    setIsLoaded(false);
    return fetchMachines();
  }, [fetchMachines]);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMachineIdentified = useCallback(
    (machine: ScannerMachine) => {
      setIsOpen(false);

      // Play success haptic
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([50]);
      }

      const targetUrl = `/areas?area=${encodeURIComponent(machine.locationCode)}&scanDev=${encodeURIComponent(machine.id)}`;

      // If already on /areas, dispatch a custom event for seamless in-place action sheet opening
      if (pathname === "/areas") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sh103:machine-scanned", {
              detail: machine,
            })
          );
          window.history.replaceState(null, "", targetUrl);
        }
      } else if (router) {
        router.push(targetUrl);
      }
    },
    [pathname, router]
  );

  return (
    <QRScannerContext.Provider
      value={{
        isOpen,
        openScanner,
        closeScanner,
        machines,
        handleMachineIdentified,
        isLoadingMachines,
        isLoadedMachines: isLoaded,
        machinesError,
        reloadMachines,
      }}
    >
      {children}
    </QRScannerContext.Provider>
  );
}

export function useQRScanner() {
  const context = useContext(QRScannerContext);
  if (!context) {
    return {
      isOpen: false,
      openScanner: () => {},
      closeScanner: () => {},
      machines: [],
      handleMachineIdentified: () => {},
      isLoadingMachines: false,
      isLoadedMachines: false,
      machinesError: null,
      reloadMachines: async () => {},
    };
  }
  return context;
}
