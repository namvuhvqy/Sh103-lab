import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import { createIncidentAction } from "@/lib/p5/actions";
import { getIncidentCategories, getUnreadNotificationCount } from "@/lib/p5/queries";

export const dynamic = "force-dynamic";

export default async function NewIncidentPage() {
  const supabase = await createClient();
  const [categories, unread, { data: locations }, { data: assets }] = await Promise.all([
    getIncidentCategories(), getUnreadNotificationCount(),
    supabase.from("locations").select("id,name").eq("active", true).order("sort_order"),
    supabase.from("assets").select("id,source_name,locations(name)").eq("active", true).order("source_order"),
  ]);
  async function submit(formData: FormData) { "use server"; const result = await createIncidentAction(formData); if (result.success && result.data?.id) redirect(`/incidents/${result.data.id}?saved=created`); redirect(`/incidents/new?error=${encodeURIComponent(result.error ?? "Không thể tạo sự cố")}`); }
  return <AppShell headerTitle="Tạo báo cáo sự cố" headerSubtitle="Nhập thủ công" unreadCount={unread}>
    <div className="mx-auto max-w-3xl space-y-5"><section><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Incident Reporting</p><h1 className="mt-1 text-3xl font-black text-slate-950">Ghi nhận sự cố</h1><p className="mt-2 text-slate-600">Không nhập tên, mã bệnh nhân hoặc dữ liệu nhận dạng người bệnh. P5 không hỗ trợ attachment/image upload.</p></section>
      <form action={submit} className="grid gap-4 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-bold">Ngày nghiệp vụ *</span><input name="business_date" type="date" required defaultValue={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())} className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" /></label>
        <label><span className="mb-1 block text-sm font-bold">Thời điểm xảy ra *</span><input name="occurred_at" type="datetime-local" required className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" /></label>
        <label><span className="mb-1 block text-sm font-bold">Danh mục *</span><select name="category_id" required className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="">Chọn danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="mb-1 block text-sm font-bold">Mức độ *</span><select name="severity" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="CRITICAL">Khẩn cấp</option></select></label>
        <label><span className="mb-1 block text-sm font-bold">Khu vực</span><select name="location_id" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="">Không chọn</option>{locations?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="mb-1 block text-sm font-bold">Thiết bị</span><select name="asset_id" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4"><option value="">Không chọn</option>{assets?.map((item) => <option key={item.id} value={item.id}>{item.source_name}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Tiêu đề *</span><input name="title" required maxLength={180} className="min-h-11 w-full rounded-2xl border border-slate-200 px-4" /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Mô tả * (tối đa 500 ký tự)</span><textarea name="description" required maxLength={500} rows={5} className="w-full rounded-2xl border border-slate-200 p-4" /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Xử trí ngay</span><textarea name="immediate_action" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" /></label>
        <button className="min-h-12 rounded-2xl bg-teal-800 px-5 font-bold text-white sm:col-span-2">Gửi báo cáo sự cố</button>
      </form>
    </div>
  </AppShell>;
}
