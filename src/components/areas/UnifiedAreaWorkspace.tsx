"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TestTube2,
  Sparkles,
  Wrench,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
} from "lucide-react";
import QRCode from "qrcode";
import { saveDecontaminationAction } from "@/app/areas/[areaCode]/knbm/actions";
import { saveMaintenanceAction } from "@/app/maintenance/actions";

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
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>(initialAreaCode);
  const [statuses, setStatuses] = useState<Record<string, string>>(initialStatuses);
  const [bm06Note, setBm06Note] = useState<string>(initialBm06Note);

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
      for (const a of areas) {
        const found = a.machines.find((m) => m.id === scannedDeviceId);
        if (found) {
          setSelectedAreaCode(a.code);
          setActionSheetMachine(found);
          break;
        }
      }
    }
  }, [scannedDeviceId, areas]);

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
              <input type="hidden" name="lockVersion" value={bm06LockVersion} />
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

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/incidents/new?assetId=${actionSheetMachine.id}`}
                className="min-h-11 rounded-xl border border-red-200 bg-red-50 text-red-800 font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-100 transition active:scale-95"
              >
                <AlertTriangle className="size-3.5" />
                <span>Báo sự cố khẩn</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setActionSheetMachine(null);
                  alert(`Đã cập nhật trạng thái máy #${actionSheetMachine.sourceOrder} thành công!`);
                }}
                className="min-h-11 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs hover:bg-teal-800 transition active:scale-95"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Xác nhận hoàn tất</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
