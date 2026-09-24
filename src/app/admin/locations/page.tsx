import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function LocationsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: locations }, { data: assignments }] = await Promise.all([
    supabase.from("locations").select("id,code,name,active,sort_order").order("sort_order"),
    supabase.from("monitoring_assignments").select("location_id, monitoring_devices(source_code)").is("valid_to", null),
  ]);
  const monitorByLocation = new Map(
    (assignments ?? []).map((item) => {
      const device = item.monitoring_devices as unknown as { source_code: string } | null;
      return [item.location_id, device?.source_code];
    }),
  );
  return <AdminPageShell title="Quản lý Khu vực & Điểm đo" description="S18 · Danh mục 5 khu vực làm việc và Kho, nạp trực tiếp từ Supabase.">
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><SummaryCard label="Tổng vị trí" value={locations?.length ?? 0}/><SummaryCard label="Khu vực làm việc" value={(locations ?? []).filter((x) => x.code !== "KHO").length}/><SummaryCard label="Điểm đo môi trường" value={assignments?.length ?? 0}/></div>
    <div className="overflow-hidden rounded-2xl border bg-white"><ul className="divide-y">{(locations ?? []).map((location) => <li key={location.id} className="grid gap-2 p-4 sm:grid-cols-[5rem_1fr_9rem_6rem] sm:items-center"><span className="text-sm font-bold text-teal-700">{location.code}</span><span className="font-semibold">{location.name}</span><span className="text-sm text-zinc-600">{monitorByLocation.get(location.id) ?? "Chưa gán điểm đo"}</span><span className="text-sm">{location.active ? "Đang dùng" : "Ngừng dùng"}</span></li>)}</ul></div>
  </AdminPageShell>;
}
