import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/shell/AppShell";
import { KpiCard } from "@/components/p5/KpiCard";
import { StatusDistribution } from "@/components/p5/OperationalChart";
import { getEquipmentOverview } from "@/lib/p5/operational-queries";
import { getUnreadNotificationCount } from "@/lib/p5/queries";
import { SHIFT_DEFINITIONS } from "@/lib/forms/domain";
import { Activity, CircleAlert, TestTube2, Wrench, Sparkles } from "lucide-react";

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

export default async function EquipmentPage() {
  const [data, unread] = await Promise.all([getEquipmentOverview(), getUnreadNotificationCount()]);
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
        {/* Header & Feature banner trang trọng */}
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

        {/* 4 Ca trực */}
        <div className="flex flex-wrap gap-2" aria-label="Bốn ca BM.06">
          {SHIFT_DEFINITIONS.map((shift) => (
            <span
              key={shift.code}
              className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-xs ${
                shift.code === data.shift.code
                  ? "bg-teal-700 text-white shadow-sm ring-2 ring-teal-600/30"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-teal-300"
              }`}
            >
              {shift.code.replace("SHIFT_", "Ca ")} · {shift.label}
            </span>
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
            href="/bm06"
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
          title="Trạng thái thiết bị ca hiện tại"
          items={[
            { label: "BT", value: active, tone: "green" },
            { label: "KSD", value: unavailable, tone: "slate" },
            { label: "H", value: broken, tone: "red" },
            { label: "Chưa ghi", value: Math.max(assets.length - recorded, 0), tone: "amber" },
          ]}
        />

        {/* CTA Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/bm06"
            className="inline-flex min-h-11 items-center rounded-2xl bg-teal-800 px-6 font-bold text-white shadow-sm hover:bg-teal-900 transition"
          >
            Nhập BM.06 ca hiện tại
          </Link>
          <Link
            href="/areas"
            className="inline-flex min-h-11 items-center rounded-2xl border border-teal-200 bg-white px-6 font-bold text-teal-800 hover:bg-teal-50 transition"
          >
            Xem theo khu vực
          </Link>
        </div>

        {/* Danh sách 25 thiết bị kèm hình ảnh chuyên nghiệp */}
        <section className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
          <div className="border-b border-cyan-100 p-5 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              Danh sách thiết bị{" "}
              <span className="text-sm font-semibold text-slate-500">
                ({assets.length} máy)
              </span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Nhật ký BM.06 theo thứ tự nguồn
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {assets.map((asset) => {
              const status = asset.latest?.status_code ?? "Chưa ghi";
              const tone =
                status === "H"
                  ? "bg-red-50 text-red-800 border-red-200"
                  : status === "BT"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : status === "KSD"
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-amber-50 text-amber-800 border-amber-200";

              const imgUrl = getEquipmentImage(asset.locations?.code, asset.source_name);

              return (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="flex items-center justify-between gap-4 p-4 sm:p-5 transition hover:bg-teal-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* STT */}
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-sm font-black text-teal-800">
                      {asset.source_order}
                    </span>

                    {/* Thumbnail máy trang trọng */}
                    <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-xs bg-slate-50">
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
                      <b className="block truncate text-sm sm:text-base text-slate-900 font-bold">
                        {asset.source_name}
                      </b>
                      <span className="text-xs text-slate-500 truncate block">
                        {asset.source_code ?? "Chưa có mã chuẩn"} · {asset.locations?.name ?? "Toàn khoa"}
                      </span>
                    </div>
                  </div>

                  {/* Badge trạng thái */}
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black border ${tone}`}
                  >
                    {status}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
