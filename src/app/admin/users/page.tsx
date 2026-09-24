import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { roleLabel, type BusinessRole } from "@/lib/auth/access";

export default async function UsersPage() {
  const { supabase } = await requireAdmin();
  const { data: profiles } = await supabase.from("profiles").select("user_id,full_name,business_role,is_admin,active").order("full_name");
  return <AdminPageShell title="Nhân sự & Phân quyền" description="S21 foundation · Vai trò nghiệp vụ và cờ Admin được hiển thị riêng; Admin không tự có quyền phê duyệt.">
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><SummaryCard label="Nhân sự" value={profiles?.length ?? 0}/><SummaryCard label="Admin hệ thống" value={(profiles ?? []).filter((p) => p.is_admin).length}/><SummaryCard label="Trưởng khoa" value={(profiles ?? []).filter((p) => p.business_role === "DEPARTMENT_HEAD").length}/></div>
    <ul className="grid gap-3">{(profiles ?? []).map((profile) => <li key={profile.user_id} className="rounded-2xl border bg-white p-4"><p className="font-bold">{profile.full_name}</p><div className="mt-2 flex flex-wrap gap-2 text-sm"><span className="rounded-full bg-teal-50 px-3 py-1 text-teal-800">{roleLabel(profile.business_role as BusinessRole)}</span><span className="rounded-full bg-zinc-100 px-3 py-1">Admin: {profile.is_admin ? "Có" : "Không"}</span><span className="rounded-full bg-zinc-100 px-3 py-1">{profile.active ? "Hoạt động" : "Đã khóa"}</span></div></li>)}</ul>
  </AdminPageShell>;
}
