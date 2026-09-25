import { AppShell } from "@/components/shell/AppShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAnnouncementAction, deactivateAnnouncementAction, publishAnnouncementAction } from "@/lib/p5/actions";
import { getAdminAnnouncements, getUnreadNotificationCount } from "@/lib/p5/queries";
import { Megaphone, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const { supabase } = await requireAdmin();
  const [announcements, unread, { data: locations }, { data: profiles }] = await Promise.all([
    getAdminAnnouncements(),
    getUnreadNotificationCount(),
    supabase.from("locations").select("id,name").eq("active", true).order("sort_order"),
    supabase.from("profiles").select("user_id,full_name").eq("active", true).order("full_name"),
  ]);
  async function create(formData: FormData) { "use server"; await createAnnouncementAction(formData); }
  return <AppShell headerTitle="Admin Announcement" headerSubtitle="Trong Notification Center" isAdmin unreadCount={unread}>
    <div className="space-y-6">
      <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Quản trị thông báo</p><h1 className="mt-1 text-3xl font-black text-slate-950">Phát hành Announcement</h1><p className="mt-2 text-slate-600">Chỉ Admin được tạo, phát hành hoặc ngừng thông báo. Quyền này không cấp quyền phê duyệt chuyên môn.</p></section>
      <form action={create} className="grid gap-4 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm lg:grid-cols-2">
        <label className="lg:col-span-2"><span className="mb-1 block text-sm font-bold">Tiêu đề *</span><input name="title" required maxLength={180} className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" /></label>
        <label className="lg:col-span-2"><span className="mb-1 block text-sm font-bold">Nội dung *</span><textarea name="body" required rows={4} className="w-full rounded-2xl border border-slate-200 p-4" /></label>
        <label><span className="mb-1 block text-sm font-bold">Đối tượng</span><select name="audience_type" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="ALL">Toàn khoa</option><option value="ROLE">Theo vai trò</option><option value="LOCATION">Theo khu vực</option><option value="USER">Theo người dùng</option></select></label>
        <label><span className="mb-1 block text-sm font-bold">Mã đối tượng</span><input name="audience_ref" list="announcement-audiences" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" placeholder="Role, khu vực hoặc user ID" /><datalist id="announcement-audiences"><option value="DEPARTMENT_HEAD" /><option value="RESPONSIBLE_DOCTOR" /><option value="TECHNICIAN" />{locations?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}{profiles?.map((item) => <option key={item.user_id} value={item.user_id}>{item.full_name}</option>)}</datalist></label>
        <label><span className="mb-1 block text-sm font-bold">Mức độ</span><select name="severity" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="INFO">Thông tin</option><option value="SUCCESS">Thành công</option><option value="WARNING">Cảnh báo</option><option value="CRITICAL">Khẩn cấp</option></select></label>
        <label><span className="mb-1 block text-sm font-bold">Hết hạn</span><input name="expires_at" type="datetime-local" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" /></label>
        <button className="min-h-12 rounded-2xl bg-teal-800 px-5 font-bold text-white lg:col-span-2">Lưu bản nháp</button>
      </form>
      <section><h2 className="text-xl font-black">Danh sách Announcement</h2><div className="mt-4 space-y-3">{announcements.map((item) => { async function publish() { "use server"; await publishAnnouncementAction(item.id); } async function deactivate() { "use server"; await deactivateAnnouncementAction(item.id); } return <article key={item.id} className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-teal-800">{item.active ? <Radio className="size-5" /> : <Megaphone className="size-5" />}</span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{item.active ? "Đang phát hành" : "Bản nháp / Đã tắt"}</span><span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800">{item.audience_type}</span><span className="text-xs text-slate-500">{item.severity}</span></div><h3 className="mt-2 font-black">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.body}</p><div className="mt-4">{item.active ? <form action={deactivate}><button className="min-h-11 rounded-2xl border border-red-200 px-4 font-bold text-red-700">Ngừng phát hành</button></form> : <form action={publish}><button className="min-h-11 rounded-2xl bg-teal-800 px-4 font-bold text-white">Phát hành</button></form>}</div></div></div></article>; })}</div></section>
    </div>
  </AppShell>;
}
