import Link from "next/link";
import { ArrowLeft, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { getBm06ByDateShift } from "@/lib/forms/context";
import { currentShift, vietnamParts } from "@/lib/forms/domain";
import { PrintTriggerButton } from "@/components/areas/PrintTriggerButton";

export const dynamic = "force-dynamic";

export default async function QRPrintPage() {
  const today = vietnamParts(new Date()).date;
  const shift = currentShift();
  const bm06Data = await getBm06ByDateShift(today, shift.code);

  const assets = bm06Data?.assets ?? [];
  const prodBase = "https://sh103-lab.vercel.app";

  const stickers = await Promise.all(
    assets.map(async (a, index) => {
      const qrTarget = `${prodBase}/areas?scanDev=${a.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrTarget, {
        margin: 1,
        width: 320,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" },
      });

      const areaNames: Record<string, string> = {
        SINH_HOA: "Khu vực Sinh hóa",
        MIEN_DICH: "Khu vực Miễn dịch",
        NUOC_TIEU: "Khu vực Nước tiểu",
        LY_TAM: "Khu vực Ly tâm",
        NHAN_BENH_PHAM: "Khu Nhận bệnh phẩm",
      };

      return {
        stt: index + 1,
        id: a.id,
        name: a.name,
        areaCode: a.locationCode,
        areaName: areaNames[a.locationCode] || a.locationCode,
        qrDataUrl,
        qrTarget,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 text-slate-900 print:bg-white print:p-0">
      {/* THANH ĐIỀU HƯỚNG & NÚT IN (ẨN KHI IN) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 p-4 bg-teal-950 text-white rounded-2xl shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/areas"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition text-teal-200"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại 5 Khu vực</span>
          </Link>
          <div>
            <h1 className="text-base font-black">Bộ 20 Tem Dán QR Code Thiết Bị Y Tế</h1>
            <p className="text-xs text-teal-300">
              Tiêu chuẩn ISO 15189 · Khoa Sinh Hóa Bệnh viện Quân y 103 (Khổ in A4)
            </p>
          </div>
        </div>

        <PrintTriggerButton />
      </div>

      {/* LƯỚI TEM DÁN CHUẨN IN KHỔ A4 */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 print:grid-cols-2 print:gap-3 print:max-w-none">
        {stickers.map((m) => (
          <div
            key={m.id}
            className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between h-[230px] break-inside-avoid shadow-xs print:border-slate-500 print:shadow-none print:h-[50mm] print:rounded-xl"
          >
            {/* Header tem */}
            <div className="border-b-2 border-teal-700 pb-1.5 mb-2 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-teal-800">
                  BV Quân y 103 · Khoa Sinh Hóa
                </p>
                <h3 className="text-xs font-black text-slate-900 uppercase">
                  Tem Nhận Diện Thiết Bị Xét Nghiệm
                </h3>
              </div>
              <span className="bg-teal-700 text-white text-[9px] font-black px-2 py-0.5 rounded">
                ISO 15189
              </span>
            </div>

            {/* Thân tem: QR Code + Thông tin máy */}
            <div className="flex items-center gap-3 flex-1 min-h-0">
              <div className="size-24 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center print:border-slate-300">
                <img
                  src={m.qrDataUrl}
                  alt={`QR ${m.name}`}
                  className="size-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="inline-block text-[10px] font-black bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded-md">
                  MÁY SỐ #{m.stt < 10 ? `0${m.stt}` : m.stt}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-950 leading-tight line-clamp-3">
                  {m.name}
                </h4>
                <p className="text-[11px] font-bold text-slate-600">
                  📍 {m.areaName}
                </p>
              </div>
            </div>

            {/* Chân tem */}
            <div className="border-t border-slate-100 pt-1.5 mt-2 flex items-center justify-between text-[9px] text-slate-500">
              <span className="font-bold text-teal-800">
                📱 Quét bằng Camera / Zalo: BM.06 &amp; Bảo dưỡng
              </span>
              <span className="font-mono text-[8px] text-slate-400">
                {m.id.slice(0, 8)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
