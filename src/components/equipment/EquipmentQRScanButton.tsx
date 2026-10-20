"use client";

import React from "react";
import { Camera, QrCode } from "lucide-react";
import { useQRScanner } from "@/components/qr/QRScannerContext";

export function EquipmentQRScanButton({
  variant = "primary",
  className = "",
}: {
  variant?: "primary" | "compact";
  className?: string;
}) {
  const { openScanner } = useQRScanner();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={openScanner}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 shadow-2xs transition active:scale-95 ${className}`}
        title="Quét QR nhận diện thiết bị"
      >
        <QrCode className="size-3.5" />
        <span>Quét QR</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openScanner}
      className={`inline-flex items-center gap-2 rounded-2xl bg-teal-400 hover:bg-teal-300 px-4 py-2.5 text-xs font-black text-slate-950 transition shadow-md active:scale-95 ${className}`}
      title="Quét mã QR trên thân máy xét nghiệm để nhập ca"
    >
      <Camera className="size-4" />
      <span>Quét QR Thiết Bị</span>
    </button>
  );
}
