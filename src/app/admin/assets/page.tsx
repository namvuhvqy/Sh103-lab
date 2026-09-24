import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AssetsPage() {
  const { supabase } = await requireAdmin();
  const { data: assets } = await supabase.from("assets").select("id,asset_type,source_code,source_name,source_order,active,locations(code,name)").order("source_order");
  const machines = (assets ?? []).filter((item) => item.asset_type === "LAB_EQUIPMENT");
  const fridges = (assets ?? []).filter((item) => item.asset_type !== "LAB_EQUIPMENT");
  return <AdminPageShell title="Thiết bị & 13 Tủ" description="S19 foundation · Bảo toàn source_order, tên nguồn và các dòng trùng tên.">
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><SummaryCard label="Máy xét nghiệm" value={machines.length} detail="9 Sinh hóa · 8 Miễn dịch · 4 Nước tiểu · 4 Ly tâm"/><SummaryCard label="Tủ / ngăn" value={fridges.length}/><SummaryCard label="Tổng asset" value={assets?.length ?? 0}/></div>
    <section className="rounded-2xl border bg-white p-4"><h2 className="text-lg font-bold">25 máy theo thứ tự nguồn</h2><ol className="mt-3 grid gap-2">{machines.map((asset) => { const location = Array.isArray(asset.locations) ? asset.locations[0] : asset.locations; return <li key={asset.id} className="grid gap-1 rounded-xl bg-zinc-50 p-3 sm:grid-cols-[3rem_1fr_8rem]"><b>#{asset.source_order}</b><span>{asset.source_name}</span><span className="text-sm font-semibold text-teal-700">{location?.code}</span></li>; })}</ol></section>
    <section className="mt-5 rounded-2xl border bg-white p-4"><h2 className="text-lg font-bold">13 dòng tủ / ngăn</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{fridges.map((asset) => <li key={asset.id} className="rounded-xl bg-zinc-50 p-3"><b>{asset.source_code ?? "Không mã"}</b><p>{asset.source_name}</p></li>)}</ul></section>
  </AdminPageShell>;
}
