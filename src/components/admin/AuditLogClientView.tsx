"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, 
  User, 
  Search, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  Thermometer, 
  TestTube2,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
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

export interface AuditPaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  category: string;
  query?: string;
  invalidQueryNotice?: boolean;
}

export interface AuditCategoryCounts {
  ALL: number | null;
  BM06: number | null;
  TEMPERATURE: number | null;
  DECONTAMINATION: number | null;
  APPROVAL: number | null;
  MASTER: number | null;
}

interface AuditLogClientViewProps {
  events: FormattedAuditEvent[];
  pagination: AuditPaginationInfo;
  categoryCounts: AuditCategoryCounts;
}

export function AuditLogClientView({
  events,
  pagination,
  categoryCounts,
}: AuditLogClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localSearch, setLocalSearch] = useState(pagination.query || "");

  const categories = [
    { key: "ALL", label: "Tất cả sự kiện", count: categoryCounts.ALL },
    { key: "BM06", label: "BM.06 Nhật ký máy", count: categoryCounts.BM06, icon: TestTube2 },
    { key: "TEMPERATURE", label: "BM.01-03 Nhiệt ẩm", count: categoryCounts.TEMPERATURE, icon: Thermometer },
    { key: "DECONTAMINATION", label: "Khử nhiễm BM.01", count: categoryCounts.DECONTAMINATION, icon: Sparkles },
    { key: "APPROVAL", label: "Phê duyệt & Sổ kỳ", count: categoryCounts.APPROVAL, icon: CheckCircle2 },
    { key: "MASTER", label: "Cấu hình danh mục", count: categoryCounts.MASTER, icon: Sliders },
  ];

  const navigateTo = (params: { page?: number; category?: string; q?: string }) => {
    const current = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (params.page !== undefined) {
      current.set("page", String(params.page));
    }
    if (params.category !== undefined) {
      if (params.category === "ALL") {
        current.delete("category");
      } else {
        current.set("category", params.category);
      }
      current.set("page", "1"); // Reset về trang 1 khi đổi danh mục
    }
    if (params.q !== undefined) {
      if (!params.q.trim()) {
        current.delete("q");
      } else {
        current.set("q", params.q.trim());
      }
      current.set("page", "1"); // Reset về trang 1 khi tìm kiếm
    }

    startTransition(() => {
      router.push(`/admin/audit?${current.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo({ q: localSearch });
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    navigateTo({ q: "" });
  };

  const { page, pageSize, totalCount, totalPages, category, query } = pagination;
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* THANH TÌM KIẾM VÀ BỘ LỌC PHÂN HỆ */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo người thực hiện, thao tác, thiết bị, phòng, ngày (toàn bộ lịch sử)..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 transition select-none"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              <span>Tìm kiếm</span>
            </button>
            <div className="text-xs font-bold text-slate-500 shrink-0">
              {isPending ? (
                <span className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-teal-800 font-bold border border-teal-200/60">
                  <Loader2 className="size-3.5 animate-spin" /> Đang tải...
                </span>
              ) : (
                <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-teal-800 font-black border border-teal-200/60">
                  {query
                    ? `Tìm thấy ${totalCount} sự kiện (${startItem}–${endItem})`
                    : `Hiển thị ${startItem}–${endItem} / ${totalCount} sự kiện`}
                </span>
              )}
            </div>
          </div>
        </form>

        {/* CẢNH BÁO TỪ KHÓA TÌM KIẾM CHỈ CHỨA KÝ TỰ ĐẶC BIỆT */}
        {pagination.invalidQueryNotice && (
          <div className="flex items-center justify-between rounded-xl bg-amber-50/90 px-3 py-2 text-xs text-amber-900 border border-amber-200/80">
            <span>
              Từ khóa tìm kiếm chỉ chứa ký tự đặc biệt hoặc không hợp lệ. Đang hiển thị danh sách đầy đủ (không lọc).
            </span>
            <button
              type="button"
              onClick={handleClearSearch}
              className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Xóa từ khóa
            </button>
          </div>
        )}

        {/* THÔNG BÁO TÌM KIẾM ĐANG ÁP DỤNG */}
        {query && (
          <div className="flex items-center justify-between rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-900 border border-teal-200/50">
            <span>
              Đang tìm kiếm toàn bộ lịch sử theo: <b>&ldquo;{query}&rdquo;</b> ({totalCount} kết quả)
            </span>
            <button
              type="button"
              onClick={handleClearSearch}
              className="font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}

        {/* CÁC CHIP PHÂN LOẠI DANH MỤC */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {categories.map((cat) => {
            const active = category === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => navigateTo({ category: cat.key })}
                disabled={isPending}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all select-none active:scale-95 cursor-pointer disabled:opacity-50 ${
                  active
                    ? "bg-teal-800 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {cat.icon && <cat.icon className="size-3.5" />}
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    active ? "bg-teal-950/70 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat.count === null ? "—" : cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH SỰ KIỆN AUDIT */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
              <Search className="size-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800">Không tìm thấy sự kiện kiểm toán nào</h3>
            <p className="mt-1 text-xs text-slate-500">
              {query
                ? `Không có sự kiện nào khớp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`
                : "Không có dữ liệu sự kiện nào trong danh mục đã chọn."}
            </p>
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900 cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          events.map((item) => (
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
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${item.badgeColor}`}
                    >
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

            {/* HÀNG CHI TIẾT: NGƯỜI THỰC HIỆN & TÓM TẮT HÀNH ĐỘNG */}
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
                    {item.actorRole ? `${item.actorRole}: ` : ""}
                    {item.actorName}
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
                    <p className="mt-0.5 leading-relaxed font-semibold">{item.summary}</p>
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
                  <span>
                    <b>Mã sự kiện:</b> {item.id}
                  </span>
                  <span>
                    <b>Thời gian chuẩn ISO:</b> {item.createdAt}
                  </span>
                </div>
                {item.technicalDetails.locationName && (
                  <p>
                    <b>Khu vực:</b> {item.technicalDetails.locationName}
                  </p>
                )}
                {item.technicalDetails.assetName && (
                  <p>
                    <b>Thiết bị / Tủ:</b> {item.technicalDetails.assetName}
                  </p>
                )}
                {item.technicalDetails.targetDate && (
                  <p>
                    <b>Ngày làm việc:</b> {item.technicalDetails.targetDate}{" "}
                    {item.technicalDetails.slotCode
                      ? `· Ca: ${item.technicalDetails.slotCode}`
                      : ""}
                  </p>
                )}
                {item.technicalDetails.periodLabel && (
                  <p>
                    <b>Sổ kỳ liên quan:</b> {item.technicalDetails.periodLabel}
                  </p>
                )}
                <p>
                  <b>Mã hành động kỹ thuật:</b> {item.technicalDetails.actionCode}
                </p>
              </div>
            </details>
          </div>
        )))}
      </div>

      {/* THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION) */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-xs font-semibold text-slate-600">
            Trang <b className="text-teal-900">{page}</b> / <b>{totalPages}</b> (Tổng{" "}
            <b>{totalCount}</b> sự kiện)
          </div>

          <div className="flex items-center gap-1.5">
            {/* Về trang đầu */}
            <button
              type="button"
              onClick={() => navigateTo({ page: 1 })}
              disabled={page <= 1 || isPending}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Trang đầu"
              aria-label="Trang đầu"
            >
              <ChevronsLeft className="size-4" />
            </button>

            {/* Trang trước */}
            <button
              type="button"
              onClick={() => navigateTo({ page: page - 1 })}
              disabled={page <= 1 || isPending}
              className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              <span>Trước</span>
            </button>

            {/* Trang hiện tại */}
            <span className="px-2 text-xs font-black text-teal-900">
              {page}
            </span>

            {/* Trang sau */}
            <button
              type="button"
              onClick={() => navigateTo({ page: page + 1 })}
              disabled={page >= totalPages || isPending}
              className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="size-4" />
            </button>

            {/* Đến trang cuối */}
            <button
              type="button"
              onClick={() => navigateTo({ page: totalPages })}
              disabled={page >= totalPages || isPending}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Trang cuối"
              aria-label="Trang cuối"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
