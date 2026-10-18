"use client";

import { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  User, 
  Calendar, 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  FileSpreadsheet, 
  Sliders, 
  Sparkles, 
  Thermometer, 
  TestTube2,
  Clock
} from "lucide-react";

export interface FormattedAuditEvent {
  id: string;
  createdAt: string;
  timeStr: string;
  actorName: string;
  actorRole: string;
  actionTitle: string;
  badgeLabel: string;
  badgeColor: string;
  category: "BM06" | "TEMPERATURE" | "DECONTAMINATION" | "APPROVAL" | "MASTER" | "OTHER";
  summary: string;
  entityType: string;
  entityId: string;
  technicalDetails: {
    actionCode: string;
    targetDate?: string;
    slotCode?: string;
    locationName?: string;
    assetName?: string;
    periodLabel?: string;
    lockVersion?: number;
  };
}

interface AuditLogClientViewProps {
  events: FormattedAuditEvent[];
}

export function AuditLogClientView({ events }: AuditLogClientViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { key: "ALL", label: "Tất cả sự kiện", count: events.length },
    { key: "BM06", label: "BM.06 Nhật ký máy", count: events.filter(e => e.category === "BM06").length, icon: TestTube2 },
    { key: "TEMPERATURE", label: "BM.01-03 Nhiệt ẩm", count: events.filter(e => e.category === "TEMPERATURE").length, icon: Thermometer },
    { key: "DECONTAMINATION", label: "Khử nhiễm BM.01", count: events.filter(e => e.category === "DECONTAMINATION").length, icon: Sparkles },
    { key: "APPROVAL", label: "Phê duyệt & Sổ kỳ", count: events.filter(e => e.category === "APPROVAL").length, icon: CheckCircle2 },
    { key: "MASTER", label: "Cấu hình danh mục", count: events.filter(e => e.category === "MASTER").length, icon: Sliders },
  ];

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchCat = selectedCategory === "ALL" || ev.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ev.actorName.toLowerCase().includes(q) ||
        ev.actionTitle.toLowerCase().includes(q) ||
        ev.summary.toLowerCase().includes(q) ||
        ev.timeStr.includes(q) ||
        (ev.technicalDetails.locationName && ev.technicalDetails.locationName.toLowerCase().includes(q)) ||
        (ev.technicalDetails.assetName && ev.technicalDetails.assetName.toLowerCase().includes(q))
      );
    });
  }, [events, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* THANH TÌM KIẾM VÀ BỘ LỌC PHÂN HỆ */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên kỹ thuật viên, bác sĩ, thiết bị, phòng hoặc ngày..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold text-slate-500 shrink-0">
            <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-teal-800 font-black border border-teal-200/60">
              {filteredEvents.length} / {events.length} sự kiện
            </span>
          </div>
        </div>

        {/* CÁC CHIP PHÂN LOẠI */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {categories.map((cat) => {
            const active = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all select-none active:scale-95 ${
                  active
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat.icon && <cat.icon className="size-3.5" />}
                <span>{cat.label}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${active ? "bg-teal-900/60 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH SỰ KIỆN AUDIT CHI TIẾT */}
      <div className="space-y-3">
        {filteredEvents.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-300 hover:shadow-sm"
          >
            {/* HÀNG TIÊU ĐỀ: TÁC VỤ & THỜI GIAN */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800 border border-teal-100 mt-0.5 sm:mt-0">
                  <ShieldCheck className="size-4.5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${item.badgeColor}`}>
                      {item.badgeLabel}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Đối tượng: {item.entityType}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {item.actionTitle}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0 self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                <Clock className="size-3.5 text-slate-400" />
                <time dateTime={item.createdAt}>{item.timeStr}</time>
              </div>
            </div>

            {/* HÀNG CHI TIẾT: AI ĐANG HÀNH ĐỘNG GÌ */}
            <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              {/* NGƯỜI THỰC HIỆN */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 max-w-fit">
                <span className="grid size-6 place-items-center rounded-full bg-teal-100 text-teal-800">
                  <User className="size-3.5" />
                </span>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Người thực hiện
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {item.actorRole ? `${item.actorRole}: ` : ""}{item.actorName}
                  </span>
                </div>
              </div>

              {/* HÀNH ĐỘNG CỤ THỂ CHI TIẾT */}
              <div className="flex-1 rounded-xl bg-teal-50/70 p-2.5 sm:px-3 sm:py-2 border border-teal-100 text-xs text-teal-950 font-medium">
                <div className="flex items-start gap-2">
                  <Activity className="size-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <b className="block text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      Hành động cụ thể đã xác nhận:
                    </b>
                    <p className="mt-0.5 leading-relaxed font-semibold">
                      {item.summary}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MỞ RỘNG THÔNG SỐ TRUY VẾT ISO */}
            <details className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-50">
              <summary className="cursor-pointer font-bold hover:text-teal-700 select-none">
                Xem mã truy vết &amp; Thông số hệ thống
              </summary>
              <div className="mt-2 grid gap-1.5 rounded-xl bg-slate-50/90 p-3 font-mono text-[11px] text-slate-700 border border-slate-200">
                <div className="flex flex-wrap justify-between gap-1">
                  <span><b>Mã sự kiện:</b> {item.id}</span>
                  <span><b>Thời gian chuẩn ISO:</b> {item.createdAt}</span>
                </div>
                {item.technicalDetails.locationName && (
                  <p><b>Khu vực:</b> {item.technicalDetails.locationName}</p>
                )}
                {item.technicalDetails.assetName && (
                  <p><b>Thiết bị / Tủ:</b> {item.technicalDetails.assetName}</p>
                )}
                {item.technicalDetails.targetDate && (
                  <p><b>Ngày làm việc:</b> {item.technicalDetails.targetDate} {item.technicalDetails.slotCode ? `· Ca: ${item.technicalDetails.slotCode}` : ""}</p>
                )}
                {item.technicalDetails.periodLabel && (
                  <p><b>Sổ kỳ liên quan:</b> {item.technicalDetails.periodLabel}</p>
                )}
                <p><b>Mã hành động kỹ thuật:</b> {item.technicalDetails.actionCode}</p>
              </div>
            </details>
          </div>
        ))}

        {!filteredEvents.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-white">
            <ShieldCheck className="mx-auto size-10 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">Không tìm thấy sự kiện kiểm toán nào phù hợp.</p>
            <p className="mt-1 text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục "Tất cả".</p>
          </div>
        )}
      </div>
    </div>
  );
}
