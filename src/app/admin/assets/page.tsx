import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AssetsPage() {
  const { supabase } = await requireAdmin();
  const { data: assets } = await supabase.from("assets").select("id,asset_type,source_code,source_name,source_order,active,locations(code,name)").order("source_order");
  const machines = (assets ?? []).filter((item) => item.asset_type === "LAB_EQUIPMENT" && item.active);
  const fridges = (assets ?? []).filter((item) => item.asset_type !== "LAB_EQUIPMENT" && item.active);
  return <AdminPageShell title="Thiết bị & 13 Tủ" description="Danh mục 20 máy xét nghiệm hoạt động và 13 tủ bảo quản theo chuẩn ISO 15189.">
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Máy xét nghiệm hoạt động" value={machines.length} detail="20 máy xét nghiệm chuẩn BM.06" />
      <SummaryCard label="Tủ / ngăn bảo quản" value={fridges.length} detail="13 tủ chuẩn BM.02 & BM.03" />
      <SummaryCard label="Tổng thiết bị active" value={machines.length + fridges.length} />
    </div>
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="text-lg font-bold">20 máy xét nghiệm theo thứ tự Phụ lục chuẩn ISO 15189</h2>
      <ol className="mt-3 grid gap-2">{machines.map((asset) => { const location = Array.isArray(asset.locations) ? asset.locations[0] : asset.locations; return <li key={asset.id} className="grid gap-1 rounded-xl bg-zinc-50 p-3 sm:grid-cols-[3rem_1fr_8rem]"><b>#{asset.source_order}</b><span>{asset.source_name}</span><span className="text-sm font-semibold text-teal-700">{location?.code}</span></li>; })}</ol>
    </section>
    <section className="mt-5 rounded-2xl border bg-white p-4"><h2 className="text-lg font-bold">13 dòng tủ / ngăn</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{fridges.map((asset) => <li key={asset.id} className="rounded-xl bg-zinc-50 p-3"><b>{asset.source_code ?? "Không mã"}</b><p>{asset.source_name}</p></li>)}</ul></section>
  </AdminPageShell>;
}
