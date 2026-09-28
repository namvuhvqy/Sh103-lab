import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/shell/AppShell";
import { KpiCard } from "@/components/p5/KpiCard";
import { StatusDistribution } from "@/components/p5/OperationalChart";
import { ShiftRegisterForm } from "@/components/forms/ShiftRegisterForm";
import { getBm06ByDateShift } from "@/lib/forms/context";
import { getEquipmentOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { SHIFT_DEFINITIONS, vietnamParts } from "@/lib/forms/domain";
import { HOSPITAL_FRIDGES_13 } from "@/constants/fridges";
import { Activity, CircleAlert, TestTube2, Wrench, Sparkles, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

function getEquipmentImage(locCode?: string, name?: string) {
  const n = (name ?? "").toLowerCase();
  const c = (locCode ?? "").toUpperCase();
  if (c.includes("MIEN_DICH") || n.includes("miễn dịch")) {
    return "/images/equipment/immunology-analyzer.jpg";
  }
  if (c.includes("LY_TAM") || n.includes("ly tâm")) {
    return "/images/equipment/centrifuge-machine.jpg";
  }
  if (c.includes("NUOC_TIEU") || n.includes("khí máu") || n.includes("nước tiểu") || n.includes("gem")) {
    return "/images/equipment/bloodgas-analyzer.jpg";
  }
  return "/images/equipment/biochemistry-analyzer.jpg";
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; shift?: string }>;
}) {
  const query = (await searchParams) ?? {};
  const todayIso = vietnamParts(new Date()).date;
  const selectedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : todayIso;
  const selectedShift = query.shift && /^SHIFT_[1-4]$/.test(query.shift) ? query.shift : undefined;

  const [data, unread, bm06Data] = await Promise.all([
    getEquipmentOverview(selectedDate, selectedShift),
    getUnreadNotificationCount(),
    getBm06ByDateShift(selectedDate, selectedShift),
  ]);

  type Asset = {
    id: string;
    source_name: string;
    source_code: string | null;
    source_order: number;
    locations: { code: string; name: string } | null;
    latest: { status_code: string; updated_at: string } | null;
  };
  const assets = data.assets as unknown as Asset[];
  const active = assets.filter((item) => item.latest?.status_code === "BT").length;
  const broken = assets.filter((item) => item.latest?.status_code === "H").length;
  const unavailable = assets.filter((item) => item.latest?.status_code === "KSD").length;
  const recorded = assets.filter((item) => item.latest).length;

  return (
    <AppShell
      headerTitle="Thiết bị / Nhật ký 4 ca"
      headerSubtitle={`BM.06 · ${data.shift.label}`}
      unreadCount={unread}
    >
      <div className="space-y-6">
        {/* Header & Feature banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-400/30">
              <Sparkles className="size-3.5" />
              Tiêu chuẩn Quản lý Trang thiết bị y tế BM.06/QL.TRTB.01
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              Hệ thống 25 Thiết bị Xét nghiệm
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Theo dõi vận hành 4 ca trực liên tục: Sinh hóa (9 máy), Miễn dịch (8 máy),
              Nước tiểu (4 máy), Ly tâm (4 máy). Báo cáo sự cố và bảo dưỡng máy định kỳ.
            </p>
          </div>
        </div>

        {/* Date & Shift Filter Form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-teal-700" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Xem theo ngày &amp; ca:</span>
              <p className="text-sm font-black text-slate-900">{data.shift.label} ({selectedDate.split("-").reverse().join("/")})</p>
            </div>
          </div>
          <form method="GET" action="/equipment" className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-600"
            />
            <input type="hidden" name="shift" value={data.shift.code} />
            <button type="submit" className="min-h-10 rounded-xl bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 transition">
              Xem
            </button>
          </form>
        </div>

        {/* 4 Ca trực Switcher */}
        <div className="flex flex-wrap gap-2" aria-label="Bốn ca BM.06">
          {SHIFT_DEFINITIONS.map((shift) => (
            <Link
              key={shift.code}
              href={`/equipment?date=${selectedDate}&shift=${shift.code}`}
              className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-xs ${
                shift.code === data.shift.code
                  ? "bg-teal-700 text-white shadow-sm ring-2 ring-teal-600/30"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-300"
              }`}
            >
              {shift.code.replace("SHIFT_", "Ca ")} · {shift.label}
            </Link>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            label="Tổng thiết bị"
            value={assets.length}
            status="4 khu vực có máy"
            href="/equipment"
            icon={<TestTube2 className="size-5" />}
          />
          <KpiCard
            label="Đã ghi ca"
            value={`${recorded}/25`}
            status={recorded === 25 ? "Hoàn tất" : "Chưa hoàn tất"}
            tone={recorded === 25 ? "success" : "warning"}
            href={`/equipment?date=${selectedDate}&shift=${data.shift.code}#bm06-entry`}
            icon={<Activity className="size-5" />}
          />
          <KpiCard
            label="H · Hỏng"
            value={broken}
            status="Theo ca hiện tại"
            tone={broken ? "danger" : "success"}
            href="/equipment"
            icon={<CircleAlert className="size-5" />}
          />
          <KpiCard
            label="KSD · Không sử dụng"
            value={unavailable}
            status="Theo ca hiện tại"
            tone="neutral"
            href="/equipment"
            icon={<CircleAlert className="size-5" />}
          />
          <KpiCard
            label="BT · Bình thường"
            value={active}
            status="Theo ca hiện tại"
            tone="success"
            href="/equipment"
            icon={<Wrench className="size-5" />}
          />
        </div>

        {/* Biểu đồ phân bố */}
        <StatusDistribution
          title={`Trạng thái 25 thiết bị (${data.shift.label})`}
          items={[
            { label: "BT", value: active, tone: "green" },
            { label: "KSD", value: unavailable, tone: "slate" },
            { label: "H", value: broken, tone: "red" },
            { label: "Chưa ghi", value: Math.max(assets.length - recorded, 0), tone: "amber" },
          ]}
        />

        {/* Danh sách 25 thiết bị kèm hình ảnh chuyên nghiệp */}
        <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
          <div className="border-b border-cyan-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Danh sách thiết bị{" "}
                <span className="text-sm font-semibold text-slate-500">
                  ({assets.length} thiết bị)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhật ký 4 ca vận hành BM.06 theo thứ tự quy định 1–25
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống ISO 15189</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {assets.map((asset) => {
              const status = asset.latest?.status_code ?? "Chưa ghi";
              const isH = status === "H";
              const isBT = status === "BT";
              const isKSD = status === "KSD";

              const statusBadge = isH
                ? "bg-red-50 text-red-700 border-red-200"
                : isBT
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isKSD
                ? "bg-slate-100 text-slate-700 border-slate-200"
                : "bg-amber-50 text-amber-700 border-amber-200";

              const statusText = isH
                ? "Trạng thái H"
                : isBT
                ? "Hoạt động"
                : isKSD
                ? "Không dùng"
                : "Chưa ghi";

              const imgUrl = getEquipmentImage(asset.locations?.code, asset.source_name);

              return (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 transition hover:bg-teal-50/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* STT */}
                    <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs sm:text-sm font-black text-teal-800 border border-teal-200">
                      {asset.source_order}
                    </span>

                    {/* Thumbnail máy */}
                    <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-white">
                      <Image
                        src={imgUrl}
                        alt={asset.source_name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>

                    {/* Tên máy & Khu vực */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <b className="truncate text-sm sm:text-base text-slate-900 font-black">
                          {asset.source_name}
                        </b>
                        {asset.source_code ? (
                          <span className="hidden sm:inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                            {asset.source_code}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="rounded-md bg-teal-50/80 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-100">
                          {asset.locations?.name ?? "Toàn khoa"}
                        </span>
                        <span>•</span>
                        <span className="truncate">Thứ tự #{asset.source_order}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái được truy vấn cho đúng ca đang chọn */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500">
                      {asset.latest?.updated_at
                        ? `Ghi nhận ${new Date(asset.latest.updated_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                        : "Chưa ghi ca này"}
                    </span>

                    {/* Badge trạng thái */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black border ${statusBadge}`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isH ? "bg-red-500" : isBT ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="bm06-entry" className="overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-sm">
          <div className="border-b border-teal-100 bg-teal-50/60 p-5">
            <p className="text-xs font-black uppercase tracking-wider text-teal-800">BM.06/QL.TRTB.01 · nhập ngay trong Thiết bị</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Nhập trạng thái 25 thiết bị — {data.shift.label}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Chọn ca ở bộ lọc phía trên; SHIFT_1, SHIFT_2, SHIFT_3, SHIFT_4 đều nhập và lưu ngay tại màn hình này.</p>
          </div>
          <div className="p-4 sm:p-5">
            {bm06Data ? (
              <ShiftRegisterForm
                occurrenceId={bm06Data.occurrence.id}
                assets={bm06Data.assets}
                initialStatuses={bm06Data.initialStatuses}
                lockVersion={bm06Data.lockVersion}
              />
            ) : (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Chưa tìm thấy occurrence BM.06 cho ngày/ca đang chọn.</p>
            )}
          </div>
        </section>

        {/* Danh mục 13 Tủ bảo quản / Tủ lạnh theo Phụ lục */}
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          <div className="border-b border-sky-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50 to-indigo-50/30">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Danh mục 13 Tủ bảo quản / Tủ lạnh &amp; Tủ đá
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Theo Phụ lục quy chuẩn BM.02/QL.HTAT.01 (Tủ mát) &amp; BM.03/QL.HTAT.01 (Tủ đá)
              </p>
            </div>
            <Link
              href="/temperature"
              className="inline-flex min-h-9 items-center justify-center rounded-xl bg-teal-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              Ghi nhật ký nhiệt độ tủ lạnh
            </Link>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {HOSPITAL_FRIDGES_13.map((f) => (
              <div
                key={f.code}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 transition hover:border-teal-300 hover:bg-white shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black text-slate-600">{f.code}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      f.type === "FREEZER"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-sky-50 text-sky-800 border-sky-200"
                    }`}
                  >
                    {f.tempRange}
                  </span>
                </div>
                <p className="mt-1 text-xs font-black text-slate-950 leading-snug">{f.name}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                  <span>{f.locationName}</span>
                  <span className="font-semibold text-teal-700">{f.trackingDevice}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
