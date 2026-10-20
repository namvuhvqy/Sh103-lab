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

  // Load machines if not provided initially
  useEffect(() => {
    if (typeof window !== "undefined" && machines.length === 0) {
      fetch("/api/equipment/active")
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.machines)) {
            setMachines(data.machines);
          }
        })
        .catch(() => {
          // Ignore network errors in offline/test mode
        });
    }
  }, [machines.length]);

  const openScanner = useCallback(() => {
    setIsOpen(true);
  }, []);

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
    };
  }
  return context;
}
