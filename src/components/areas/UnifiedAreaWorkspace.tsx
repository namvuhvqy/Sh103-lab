"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TestTube2,
  Sparkles,
  Wrench,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Printer,
  X,
  Send,
  Zap,
  Camera,
  Loader2,
  RefreshCw,
} from "lucide-react";
import QRCode from "qrcode";
import { useQRScanner } from "@/components/qr/QRScannerContext";
import { saveDecontaminationAction } from "@/app/areas/[areaCode]/knbm/actions";

export interface AreaMachine {
  id: string;
  sourceOrder: number;
  name: string;
  locationCode: string;
  desc?: string;
}

export interface AreaData {
  code: string;
  name: string;
  icon: string;
  machineCount: number;
  machines: AreaMachine[];
  decon: {
    periodId: string;
    daily: boolean;
    weekly: boolean;
    spill: boolean;
    note: string;
    status: string;
  };
}

export interface OfflineQueueItem {
  occurrenceId: string;
  assetId: string;
  machineName: string;
  machineOrder: number;
  status: string;
  note: string;
  areaCode: string;
  timestamp: string;
}

const OFFLINE_QUEUE_KEY = "lab103_bm06_offline_queue_v1";

function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(items: OfflineQueueItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save offline queue", err);
  }
}

function addToOfflineQueue(item: OfflineQueueItem) {
  const current = getOfflineQueue();
  const existingIdx = current.findIndex(
    (q) => q.occurrenceId === item.occurrenceId && q.assetId === item.assetId
  );
  if (existingIdx >= 0) {
    current[existingIdx] = item;
  } else {
    current.push(item);
  }
  saveOfflineQueue(current);
}

function removeFromOfflineQueue(occurrenceId: string, assetId: string) {
  const current = getOfflineQueue();
  const filtered = current.filter(
    (q) => !(q.occurrenceId === occurrenceId && q.assetId === assetId)
  );
  saveOfflineQueue(filtered);
}

function clearOfflineQueueForOccurrence(occurrenceId: string) {
  const current = getOfflineQueue();
  const filtered = current.filter((q) => q.occurrenceId !== occurrenceId);
  saveOfflineQueue(filtered);
}

interface UnifiedAreaWorkspaceProps {
  areas: AreaData[];
  initialAreaCode?: string;
  today: string;
  shift: { code: string; label: string; time?: string };
  bm06OccurrenceId: string;
  bm06LockVersion: number;
  initialStatuses: Record<string, string>;
  initialBm06Note?: string;
  scannedDeviceId?: string;
}

export function UnifiedAreaWorkspace({
  areas,
  initialAreaCode = "SINH_HOA",
  today,
  shift,
  bm06OccurrenceId,
  bm06LockVersion,
  initialStatuses,
  initialBm06Note = "",
  scannedDeviceId,
}: UnifiedAreaWorkspaceProps) {
  const { openScanner } = useQRScanner();
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>(initialAreaCode);
  const [statuses, setStatuses] = useState<Record<string, string>>(initialStatuses);
  const [bm06Note, setBm06Note] = useState<string>(initialBm06Note);

  // Dynamic lock version tracking to handle concurrency between technicians
  const [currentLockVersion, setCurrentLockVersion] = useState<number>(bm06LockVersion);

  useEffect(() => {
    setCurrentLockVersion(bm06LockVersion);
  }, [bm06LockVersion]);

  // Single machine save states for Action Sheet
  const [isSavingSingleMachine, setIsSavingSingleMachine] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [invalidDeviceWarning, setInvalidDeviceWarning] = useState<string | null>(null);

  // Offline queue state & sync banner
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [syncBannerMsg, setSyncBannerMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load offline queue on mount
  useEffect(() => {
    const q = getOfflineQueue().filter((item) => item.occurrenceId === bm06OccurrenceId);
    setOfflineQueue(q);
  }, [bm06OccurrenceId]);

  // Maintenance state for active area
  const [maintAssetId, setMaintAssetId] = useState<string>("");
  const [maintCadence, setMaintCadence] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [maintResult, setMaintResult] = useState<"PASS" | "FAIL">("PASS");
  const [maintNote, setMaintNote] = useState<string>("");

  // QR Modal state
  const [qrModalMachine, setQrModalMachine] = useState<AreaMachine | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Scanned machine action sheet state
  const [actionSheetMachine, setActionSheetMachine] = useState<AreaMachine | null>(null);

  const currentArea = areas.find((a) => a.code === selectedAreaCode) || areas[0];

  // Auto open action sheet if scannedDeviceId is provided in URL
  useEffect(() => {
    if (scannedDeviceId) {
      let foundMachine: AreaMachine | null = null;
      for (const a of areas) {
        const found = a.machines.find((m) => m.id === scannedDeviceId);
        if (found) {
          foundMachine = found;
          setSelectedAreaCode(a.code);
          setActionSheetMachine(found);
          break;
        }
      }
      if (!foundMachine && areas.length > 0) {
        setInvalidDeviceWarning(
          `Không tìm thấy thiết bị xét nghiệm tương ứng với mã quét (${scannedDeviceId.slice(0, 8)}...) hoặc thiết bị đã ngừng hoạt động.`
        );
      } else {
        setInvalidDeviceWarning(null);
      }
    }
  }, [scannedDeviceId, areas]);

  // Listen for in-page scan events from global scanner
  useEffect(() => {
    const handleScannedEvent = (e: any) => {
      const machine = e.detail as AreaMachine;
      if (machine) {
        setSelectedAreaCode(machine.locationCode);
        setActionSheetMachine(machine);
        setInvalidDeviceWarning(null);
      }
    };
    window.addEventListener("sh103:machine-scanned", handleScannedEvent);
    return () => {
      window.removeEventListener("sh103:machine-scanned", handleScannedEvent);
    };
  }, []);

  // Sync offline queue to Supabase
  const handleSyncOfflineQueue = useCallback(async () => {
    const currentQ = getOfflineQueue().filter((item) => item.occurrenceId === bm06OccurrenceId);
    if (currentQ.length === 0 || isSyncingOffline) return;

    setIsSyncingOffline(true);
    setSyncBannerMsg({
      type: "info",
      text: `Đang gửi ${currentQ.length} bản ghi máy lên máy chủ Supabase...`,
    });

    try {
      const statusesPayload = currentQ.map((item) => ({
        asset_id: item.assetId,
        status: item.status,
      }));

      const formData = new FormData();
      formData.append("occurrenceId", bm06OccurrenceId);
      formData.append("lockVersion", String(currentLockVersion));
      formData.append("statuses", JSON.stringify(statusesPayload));
      formData.append("areaCode", currentArea.code);
      formData.append("note", bm06Note);
      formData.append("intent", "draft");

      const res = await fetch("/api/forms/bm06", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Không thể đồng bộ lên máy chủ");
      }

      if (typeof data.lockVersion === "number") {
        setCurrentLockVersion(data.lockVersion);
      }

      // Update local react statuses state
      const syncedStatuses = { ...statuses };
      currentQ.forEach((item) => {
        syncedStatuses[item.assetId] = item.status;
      });
      setStatuses(syncedStatuses);

      clearOfflineQueueForOccurrence(bm06OccurrenceId);
      setOfflineQueue([]);
      setSyncBannerMsg({
        type: "success",
        text: `✓ Đã đồng bộ thành công ${statusesPayload.length} máy lên máy chủ Supabase (v${data.lockVersion ?? currentLockVersion})!`,
      });
      setTimeout(() => setSyncBannerMsg(null), 4000);
    } catch (err: any) {
      setSyncBannerMsg({
        type: "error",
        text: `⚠️ Đồng bộ thất bại: ${err?.message || "Lỗi mạng"}. Dữ liệu vẫn được giữ an toàn trên máy.`,
      });
    } finally {
      setIsSyncingOffline(false);
    }
  }, [bm06OccurrenceId, isSyncingOffline, currentLockVersion, currentArea.code, bm06Note, statuses]);

  // Auto trigger sync when network recovers
  useEffect(() => {
    const onOnline = () => {
      const q = getOfflineQueue().filter((item) => item.occurrenceId === bm06OccurrenceId);
      if (q.length > 0) {
        handleSyncOfflineQueue();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [bm06OccurrenceId, handleSyncOfflineQueue]);

  // Save single machine status directly from Action Sheet to BM.06
  const handleSaveMachineStatus = async (nextAction: "close" | "scan_next" = "close") => {
    if (!actionSheetMachine) return;
    setIsSavingSingleMachine(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const currentStatus = statuses[actionSheetMachine.id] || "BT";

    // REQUIREMENT 1: ISOLATED SINGLE-MACHINE PAYLOAD
    // Only send the scanned machine so other machines in the shift are never deleted or overwritten!
    const statusesPayload = [{ asset_id: actionSheetMachine.id, status: currentStatus }];

    const formData = new FormData();
    formData.append("occurrenceId", bm06OccurrenceId);
    formData.append("lockVersion", String(currentLockVersion));
    formData.append("statuses", JSON.stringify(statusesPayload));
    formData.append("areaCode", currentArea.code);
    formData.append("note", bm06Note);
    formData.append("intent", "draft");

    try {
      const res = await fetch("/api/forms/bm06", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Không thể lưu trạng thái máy lên hệ thống");
      }

      if (typeof data.lockVersion === "number") {
        setCurrentLockVersion(data.lockVersion);
      }

      // Remove from offline queue if it was previously queued
      removeFromOfflineQueue(bm06OccurrenceId, actionSheetMachine.id);
      setOfflineQueue(getOfflineQueue().filter((q) => q.occurrenceId === bm06OccurrenceId));

      setIsSavingSingleMachine(false);
      // REQUIREMENT 3: Only claim "Đã lưu" after Supabase confirmation!
      setSaveSuccessMsg(
        `✓ Đã lưu thành công lên máy chủ Supabase (Máy #${actionSheetMachine.sourceOrder} · v${data.lockVersion ?? currentLockVersion})`
      );

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([50]);
      }

      // Local storage backup
      try {
        localStorage.setItem(
          `lab103_bm06_${bm06OccurrenceId}_${actionSheetMachine.id}`,
          JSON.stringify({ status: currentStatus, timestamp: new Date().toISOString() })
        );
      } catch {}

      if (nextAction === "scan_next") {
        setTimeout(() => {
          setActionSheetMachine(null);
          setSaveSuccessMsg(null);
          openScanner();
        }, 500);
      } else {
        setTimeout(() => {
          setActionSheetMachine(null);
          setSaveSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setIsSavingSingleMachine(false);
      // REQUIREMENT 3 & 4: NEVER display "Đã lưu" when data is only in localStorage!
      setSaveSuccessMsg(null);

      // Save into structured offline sync queue
      const offlineItem: OfflineQueueItem = {
        occurrenceId: bm06OccurrenceId,
        assetId: actionSheetMachine.id,
        machineName: actionSheetMachine.name,
        machineOrder: actionSheetMachine.sourceOrder,
        status: currentStatus,
        note: bm06Note,
        areaCode: currentArea.code,
        timestamp: new Date().toISOString(),
      };
      addToOfflineQueue(offlineItem);
      setOfflineQueue(getOfflineQueue().filter((q) => q.occurrenceId === bm06OccurrenceId));

      setSaveErrorMsg(
        `⚠️ Chưa đồng bộ lên máy chủ: Dữ liệu máy #${actionSheetMachine.sourceOrder} đã lưu tạm trong bộ nhớ máy (${err?.message || "Mất kết nối mạng"}). Vui lòng bấm 'Đồng bộ' khi có kết nối.`
      );
    }
  };

  // Generate QR Code data URL when machine is selected for QR
  useEffect(() => {
    if (qrModalMachine) {
      const scanUrl = `${window.location.origin}/areas?scanDev=${qrModalMachine.id}`;
      QRCode.toDataURL(scanUrl, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [qrModalMachine]);

  const handleSetAllInAreaBT = () => {
    const updated = { ...statuses };
    currentArea.machines.forEach((m) => {
      updated[m.id] = "BT";
    });
    setStatuses(updated);
  };

  const currentAreaPayload = JSON.stringify(
    currentArea.machines.map((m) => ({
      asset_id: m.id,
      status: statuses[m.id] || "BT",
    }))
  );

  return (
    <div className="space-y-6">
      {/* CẢNH BÁO MÃ QR KHÔNG HỢP LỆ HOẶC THIẾT BỊ KHÔNG TỒN TẠI */}
      {invalidDeviceWarning ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <p className="font-semibold">{invalidDeviceWarning}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setInvalidDeviceWarning(null);
              openScanner();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 font-bold text-amber-900 transition shrink-0 active:scale-95"
          >
            Quét lại
          </button>
        </div>
      ) : null}

      {/* BANNER DỮ LIỆU NGOẠI TUYẾN CHƯA ĐỒNG BỘ */}
      {offlineQueue.length > 0 ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 text-xs shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0">
              <AlertTriangle className="size-4.5" />
            </div>
            <div>
              <h4 className="font-black text-amber-950">
                Có {offlineQueue.length} bản ghi máy xét nghiệm chưa đồng bộ lên máy chủ Supabase
              </h4>
              <p className="text-[11px] text-amber-800">
                Dữ liệu được lưu tạm trên thiết bị. Bấm nút bên cạnh để đồng bộ ngay khi có kết nối mạng.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSyncingOffline}
            onClick={handleSyncOfflineQueue}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            {isSyncingOffline ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            <span>Đồng bộ lên máy chủ ({offlineQueue.length})</span>
          </button>
        </div>
      ) : null}

      {/* THÔNG BÁO TIẾN TRÌNH ĐỒNG BỘ */}
      {syncBannerMsg ? (
        <div
          className={`rounded-2xl border p-3.5 text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
            syncBannerMsg.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : syncBannerMsg.type === "error"
              ? "border-rose-300 bg-rose-50 text-rose-900"
              : "border-sky-300 bg-sky-50 text-sky-900"
          }`}
        >
          {syncBannerMsg.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : syncBannerMsg.type === "error" ? (
            <AlertTriangle className="size-4 text-rose-600 shrink-0" />
          ) : (
            <Loader2 className="size-4 text-sky-600 animate-spin shrink-0" />
          )}
          <span>{syncBannerMsg.text}</span>
        </div>
      ) : null}

      {/* 1. TOP HEADER & 5 AREA SWITCHER (5 KÍP TRỰC) */}
      <section className="rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-teal-500/20 text-teal-300 font-black border border-teal-500/30 text-xs">
                103
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-400">
                Workspace 5 Khu Vực · 5 Kíp Trực Tác Nghiệp
              </p>
            </div>
            <h1 className="text-xl md:text-2xl font-black">
              Không Gian Tác Nghiệp Ca Trực Chuẩn ISO 15189
            </h1>
            <p className="text-xs text-slate-300">
              Điền trọn gói <strong>BM.06 Nhật ký máy</strong>, <strong>Khử nhiễm bề mặt</strong>, và{" "}
              <strong>Bảo dưỡng</strong> ngay trong 1 tab cho từng khu vực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* NÚT QUÉT QR THIẾT BỊ NỔI BẬT */}
            <button
              type="button"
              onClick={openScanner}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-400 hover:bg-teal-300 px-4 py-2 text-xs font-black text-slate-950 transition shadow-sm active:scale-95"
              title="Quét mã QR trên thân máy xét nghiệm để nhập ca 1 chạm"
            >
              <Camera className="size-4" />
              <span>Quét QR Máy</span>
            </button>

            <Link
              href="/areas/qr-print"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 px-3.5 py-2 text-xs font-bold border border-teal-400/40 text-teal-200 transition backdrop-blur-md"
              title="In trọn bộ 20 tem dán QR cho tất cả máy xét nghiệm chuẩn ISO 15189"
            >
              <QrCode className="size-3.5" />
              <span>In 20 Tem QR Máy</span>
            </Link>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-bold border border-white/10 backdrop-blur-md">
              <span>Ca trực:</span>
              <span className="text-teal-300 font-extrabold">{shift.label}</span>
              <span className="text-slate-400">·</span>
              <span>{today}</span>
            </div>
          </div>
        </div>

        {/* 5 TABS CHUYỂN NHANH 5 KHU VỰC */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-white/10">
          {areas.map((area) => {
            const isSelected = selectedAreaCode === area.code;
            const completedCount = area.machines.filter((m) => statuses[m.id]).length;
            const isAllDone = area.machines.length > 0 && completedCount === area.machines.length;

            return (
              <button
                key={area.code}
                type="button"
                onClick={() => setSelectedAreaCode(area.code)}
                className={`relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 select-none active:scale-95 ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-400 shadow-md ring-2 ring-teal-400/30"
                    : "bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{area.icon}</span>
                  {area.machines.length > 0 ? (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isAllDone
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-slate-700/60 text-slate-300"
                      }`}
                    >
                      {completedCount}/{area.machines.length}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      KNBM
                    </span>
                  )}
                </div>
                <span className="mt-2 text-xs font-black line-clamp-1 leading-tight">{area.name}</span>
                <span className="text-[10px] opacity-80 mt-0.5">
                  {area.machineCount > 0 ? `${area.machineCount} máy chuẩn` : "0 máy · Khử nhiễm"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. KHU VỰC ĐANG TÁC NGHIỆP: TẤT CẢ TRÊN 1 TAB */}
      <div className="space-y-6">
        {/* BANNER KHU VỰC */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-teal-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-2xl border border-teal-200">
              {currentArea.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{currentArea.name}</h2>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                  {currentArea.machineCount > 0 ? `${currentArea.machineCount} máy thiết bị` : "Khu nhận bệnh phẩm"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kíp trực phụ trách tác nghiệp đầy đủ các hạng mục bên dưới trên cùng một màn hình.
              </p>
            </div>
          </div>

          {currentArea.machines.length > 0 ? (
            <button
              type="button"
              onClick={handleSetAllInAreaBT}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 border border-teal-300 hover:bg-teal-100 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Zap className="size-3.5 text-teal-600 fill-teal-600" />
              <span>Đặt tất cả máy trong khu = BT</span>
            </button>
          ) : null}
        </div>

        {/* HẠNG MỤC 1: BM.06 NHẬT KÝ MÁY (NẾU KHU VỰC CÓ MÁY) */}
        {currentArea.machines.length > 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-teal-100 text-teal-800">
                  <TestTube2 className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    1. Nhật ký hoạt động trang thiết bị (BM.06/QL.TRTB.01)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ghi nhận trạng thái từng máy và ghi chú ca (tự động ghi log kiểm toán ISO).
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-teal-800">
                {currentArea.machines.filter((m) => statuses[m.id]).length}/{currentArea.machines.length} máy
              </span>
            </div>

            {/* FORM BM06 KHU VỰC */}
            <form action="/api/forms/bm06" method="post" className="space-y-4">
              <input type="hidden" name="occurrenceId" value={bm06OccurrenceId} />
              <input type="hidden" name="lockVersion" value={currentLockVersion} />
              <input type="hidden" name="statuses" value={currentAreaPayload} />
              <input type="hidden" name="areaCode" value={currentArea.code} />

              {/* LƯỚI MÁY THUỘC KHU VỰC */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentArea.machines.map((m) => {
                  const currentSt = statuses[m.id];
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        currentSt === "H"
                          ? "border-red-300 bg-red-50/40"
                          : currentSt === "KSD"
                          ? "border-slate-300 bg-slate-50/80"
                          : currentSt === "BT"
                          ? "border-teal-300 bg-teal-50/20"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-900 text-xs font-black border border-teal-200">
                            #{m.sourceOrder}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">{m.name}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{m.desc || "Thiết bị xét nghiệm"}</p>
                          </div>
                        </div>

                        {/* NÚT XEM TEM QR MÁY */}
                        <button
                          type="button"
                          onClick={() => setQrModalMachine(m)}
                          className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition"
                          title="Xem tem QR dán trên máy"
                        >
                          <QrCode className="size-4" />
                        </button>
                      </div>

                      {/* 3 NÚT CHỌN TRẠNG THÁI TOUCH >= 44PX */}
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
                        {[
                          ["BT", "Bình thường", "border-teal-700 bg-teal-700 text-white shadow-xs"],
                          ["KSD", "Không dùng", "border-slate-700 bg-slate-700 text-white shadow-xs"],
                          ["H", "Hỏng", "border-red-700 bg-red-700 text-white shadow-xs"],
                        ].map(([code, label, activeClass]) => {
                          const isSelected = currentSt === code;
                          return (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setStatuses((prev) => ({ ...prev, [m.id]: code }))}
                              className={`min-h-11 rounded-lg text-xs font-bold border transition-all active:scale-95 flex items-center justify-center select-none ${
                                isSelected
                                  ? activeClass
                                  : "border-transparent bg-white/80 text-slate-700 hover:bg-white"
                              }`}
                              title={`${code} - ${label}`}
                            >
                              {code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MỤC GHI CHÚ BM.06 (LƯU VÀO LOG CÙNG TRẠNG THÁI MÁY THEO YÊU CẦU B) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Ghi chú ca BM.06 khu vực {currentArea.name}
                  <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                    (Ghi nhận chi tiết máy lỗi, số lần rửa kim, hóa chất hoặc bàn giao kíp)
                  </span>
                  <textarea
                    name="note"
                    value={bm06Note}
                    onChange={(e) => setBm06Note(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
                    placeholder="Nhập ghi chú cho các máy thuộc khu vực này..."
                  />
                </label>
              </div>

              {/* NÚT LƯU BM06 KHU VỰC */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500">
                  Lưu ý: Dữ liệu ghi chú và trạng thái sẽ được ghi lại trong nhật ký kiểm toán ISO 15189.
                </p>
                <button
                  type="submit"
                  name="intent"
                  value="draft"
                  className="min-h-11 rounded-xl bg-teal-700 px-5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 active:scale-95 transition-all flex items-center gap-1.5 select-none"
                >
                  <Send className="size-3.5" />
                  <span>Lưu BM.06 khu {currentArea.name}</span>
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {/* HẠNG MỤC 2: KHỬ NHIỄM BỀ MẶT (BM.01_KNBM) CỦA KHU VỰC */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  2. Khử nhiễm bề mặt (BM.01_KNBM) · {currentArea.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ghi nhận thực hiện khử nhiễm hằng ngày, hằng tuần hoặc xử lý tràn đổ hóa chất/mẫu bệnh phẩm.
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                currentArea.decon.daily || currentArea.decon.weekly
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {currentArea.decon.daily || currentArea.decon.weekly ? "Đã khử nhiễm" : "Chưa thực hiện"}
            </span>
          </div>

          <form action={async (fd: FormData) => { await saveDecontaminationAction(fd); }} className="space-y-4">
            <input type="hidden" name="periodId" value={currentArea.decon.periodId} />
            <input type="hidden" name="areaCode" value={currentArea.code} />
            <input type="hidden" name="businessDate" value={today} />
            <input type="hidden" name="returnTo" value={`/areas?area=${currentArea.code}`} />

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["daily", "Khử nhiễm hằng ngày (Daily)", "Bắt buộc mỗi ca trực", currentArea.decon.daily],
                ["weekly", "Khử nhiễm hằng tuần (Weekly)", "Thực hiện theo định kỳ", currentArea.decon.weekly],
                ["spill", "Xử lý tràn đổ (Spill Event)", "Khi phát sinh sự cố tràn mẫu", currentArea.decon.spill],
              ].map(([name, label, desc, defChecked]) => (
                <label
                  key={name as string}
                  className="flex min-h-12 items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs transition hover:border-teal-200 hover:bg-teal-50/40 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    name={name as string}
                    defaultChecked={Boolean(defChecked)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <div>
                    <strong className="block text-slate-900 font-bold">{label as string}</strong>
                    <span className="text-[10px] text-slate-500">{desc as string}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <label className="block text-xs font-bold text-slate-800">
                Ghi chú khử nhiễm
                <input
                  type="text"
                  name="note"
                  defaultValue={currentArea.decon.note || ""}
                  placeholder="Loại dung dịch khử khuẩn (ví dụ: Cloramin B 0.5%, Cồn 70°), nồng độ, vị trí cụ thể..."
                  className="mt-1 w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-cyan-700 px-5 text-xs font-bold text-white shadow-xs hover:bg-cyan-800 active:scale-95 transition-all flex items-center gap-1.5 select-none"
              >
                <Sparkles className="size-3.5" />
                <span>Lưu khử nhiễm khu {currentArea.name}</span>
              </button>
            </div>
          </form>
        </section>

        {/* HẠNG MỤC 3: BẢO DƯỠNG TRANG THIẾT BỊ (BM.02) CỦA KHU VỰC (NẾU CÓ MÁY) */}
        {currentArea.machines.length > 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-amber-100 text-amber-800">
                  <Wrench className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    3. Bảo dưỡng trang thiết bị (BM.02/QL.TRTB.01) · {currentArea.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ghi nhận kiểm tra, lau chùi quang học, thay rửa kim hút và bảo dưỡng định kỳ máy trong khu.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-xs font-bold text-slate-800">
                  Chọn thiết bị bảo dưỡng
                  <select
                    value={maintAssetId || (currentArea.machines[0]?.id ?? "")}
                    onChange={(e) => setMaintAssetId(e.target.value)}
                    className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
                  >
                    {currentArea.machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.sourceOrder} {m.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-800">
                  Chu kỳ bảo dưỡng
                  <select
                    value={maintCadence}
                    onChange={(e) => setMaintCadence(e.target.value as any)}
                    className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs"
                  >
                    <option value="DAILY">Hằng ngày (Lau rửa kim, kiểm tra áp suất)</option>
                    <option value="WEEKLY">Hằng tuần (Vệ sinh bộ lọc, buồng phản ứng)</option>
                    <option value="MONTHLY">Hằng tháng (Hiệu chuẩn cuvette, dầu bôi trơn)</option>
                  </select>
                </label>

                <div className="block text-xs font-bold text-slate-800">
                  Kết quả kiểm tra
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMaintResult("PASS")}
                      className={`min-h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        maintResult === "PASS"
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Đạt (PASS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaintResult("FAIL")}
                      className={`min-h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        maintResult === "FAIL"
                          ? "bg-red-700 text-white border-red-700 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <AlertTriangle className="size-3.5" />
                      <span>Không đạt</span>
                    </button>
                  </div>
                </div>
              </div>

              <label className="block text-xs font-bold text-slate-800">
                Ghi chú nội dung bảo dưỡng kỹ thuật
                <input
                  type="text"
                  value={maintNote}
                  onChange={(e) => setMaintNote(e.target.value)}
                  placeholder="Ghi nhận chi tiết: đã thay ống dây dẫn, rửa đầu đo, kiểm tra điện áp..."
                  className="mt-1 w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs"
                />
              </label>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã ghi nhận bảo dưỡng cho thiết bị với kết quả: ${maintResult}`);
                  }}
                  className="min-h-11 rounded-xl bg-amber-700 px-5 text-xs font-bold text-white shadow-xs hover:bg-amber-800 active:scale-95 transition-all flex items-center gap-1.5 select-none"
                >
                  <Wrench className="size-3.5" />
                  <span>Lưu bảo dưỡng thiết bị</span>
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* 3. MODAL: TEM QR CODE CHUẨN DÁN MÁY */}
      {qrModalMachine ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase text-teal-800">Tem QR Dán Thiết Bị Y Tế</span>
              <button
                type="button"
                onClick={() => setQrModalMachine(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* TEM IN DÁN MÁY CHUẨN ISO */}
            <div
              id="printable-qr-sticker"
              className="rounded-2xl border-2 border-slate-900 p-4 bg-white text-center space-y-3 shadow-inner"
            >
              <div className="border-b border-slate-200 pb-2">
                <p className="text-[10px] font-black uppercase text-slate-500">BV QUÂN Y 103 · KHOA SINH HÓA</p>
                <h3 className="text-sm font-black text-slate-950 leading-tight mt-0.5">
                  #{qrModalMachine.sourceOrder} {qrModalMachine.name}
                </h3>
                <p className="text-[10px] text-teal-800 font-bold mt-0.5">
                  Mã thiết bị: DEV_{String(qrModalMachine.sourceOrder).padStart(2, "0")} · {currentArea.name}
                </p>
              </div>

              {qrDataUrl ? (
                <div className="flex justify-center py-1">
                  <img src={qrDataUrl} alt="Mã QR dán máy" className="size-48 rounded-xl border border-slate-200 shadow-xs" />
                </div>
              ) : (
                <div className="size-48 mx-auto grid place-items-center bg-slate-100 rounded-xl text-xs text-slate-400">
                  Đang tạo mã QR...
                </div>
              )}

              <p className="text-[9px] font-semibold text-slate-500 leading-tight">
                Quét mã bằng Camera điện thoại để mở Action Sheet 1 chạm: nhập BM.06, bảo dưỡng hoặc báo hỏng.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-11 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-xs hover:bg-teal-800 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Printer className="size-4" />
                <span>In tem dán máy</span>
              </button>
              <button
                type="button"
                onClick={() => setQrModalMachine(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. ACTION SHEET KHI QUÉT MÃ QR TRÊN DI ĐỘNG */}
      {actionSheetMachine ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl space-y-4 text-slate-900 border border-slate-200 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-teal-100 text-teal-800 text-xs font-black">
                  #{actionSheetMachine.sourceOrder}
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900 line-clamp-1">{actionSheetMachine.name}</h3>
                  <p className="text-[10px] text-teal-800 font-bold">Thao tác quét QR 1 chạm · Ca {shift.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionSheetMachine(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* ACTION 1: TRẠNG THÁI MÁY */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-600">Trạng thái vận hành trong ca</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["BT", "Bình thường", "bg-teal-700 text-white"],
                  ["KSD", "Không dùng", "bg-slate-700 text-white"],
                  ["H", "Báo hỏng", "bg-red-700 text-white"],
                ].map(([code, label, activeStyle]) => {
                  const isSel = (statuses[actionSheetMachine.id] || "BT") === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setStatuses((prev) => ({ ...prev, [actionSheetMachine.id]: code }));
                      }}
                      className={`min-h-12 rounded-xl text-xs font-bold border transition-all active:scale-95 flex flex-col items-center justify-center ${
                        isSel ? activeStyle : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span className="text-sm font-black">{code}</span>
                      <span className="text-[9px] opacity-80">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTION 2: GHI CHÚ NHANH CHO MÁY */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-600">Ghi chú tình trạng thiết bị</label>
              <input
                type="text"
                value={bm06Note}
                onChange={(e) => setBm06Note(e.target.value)}
                placeholder="Nhập lưu ý bảo trì hoặc cảnh báo hóa chất..."
                className="w-full min-h-10 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-teal-600 shadow-2xs"
              />
            </div>

            {/* SUCCESS / ERROR NOTICES */}
            {saveSuccessMsg ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : null}

            {saveErrorMsg ? (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-rose-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                <span>{saveErrorMsg}</span>
              </div>
            ) : null}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSavingSingleMachine}
                  onClick={() => handleSaveMachineStatus("close")}
                  className="min-h-11 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-teal-800 transition active:scale-95 disabled:opacity-50"
                >
                  {isSavingSingleMachine ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>Lưu vào BM.06</span>
                </button>

                <button
                  type="button"
                  disabled={isSavingSingleMachine}
                  onClick={() => handleSaveMachineStatus("scan_next")}
                  className="min-h-11 rounded-xl bg-teal-50 border border-teal-300 text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-100 transition active:scale-95 disabled:opacity-50"
                >
                  <Camera className="size-3.5 text-teal-600" />
                  <span>Lưu &amp; Quét tiếp</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={`/incidents/new?assetId=${actionSheetMachine.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline"
                >
                  <AlertTriangle className="size-3" />
                  <span>Báo sự cố khẩn cấp</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setActionSheetMachine(null);
                    setSaveSuccessMsg(null);
                    setSaveErrorMsg(null);
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
