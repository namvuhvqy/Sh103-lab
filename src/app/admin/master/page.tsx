import Link from "next/link";
import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function MasterPage() {
  const { supabase } = await requireAdmin();
  const [locations, assets, devices, templates] = await Promise.all([
    supabase.from("locations").select("id", { count: "exact", head: true }),
    supabase.from("assets").select("id", { count: "exact", head: true }),
    supabase.from("monitoring_devices").select("id", { count: "exact", head: true }),
    supabase.from("form_templates").select("id", { count: "exact", head: true }),
  ]);
  return <AdminPageShell title="Master Data & Cài đặt" description="S22 foundation · Chỉ các nhóm thuộc phạm vi Core Pilot; không có patient, incident, attachment, LIS/HIS hay n8n secret.">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SummaryCard label="Locations" value={locations.count ?? 0}/><SummaryCard label="Assets" value={assets.count ?? 0}/><SummaryCard label="Monitoring devices" value={devices.count ?? 0}/><SummaryCard label="Form templates" value={templates.count ?? 0}/></div>
    <section className="mt-5 rounded-2xl border bg-white p-5"><h2 className="font-bold">Điều hướng dữ liệu gốc</h2><div className="mt-3 flex flex-wrap gap-2"><Link className="rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white" href="/admin/locations">Quản lý khu vực</Link><Link className="rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white" href="/admin/assets">Quản lý thiết bị</Link></div></section>
  </AdminPageShell>;
}
