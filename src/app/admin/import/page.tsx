import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const steps = ["Chọn loại", "Upload", "Preview", "Validate", "Danh sách trùng", "Xác nhận", "Commit", "Tóm tắt"];
export default async function ImportPage() {
  await requireAdmin();
  return <AdminPageShell title="Seed / Import" description="S24 foundation · Luồng kiểm soát trước khi ghi; tuyệt đối không tự gộp tên trùng.">
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{steps.map((step, index) => <li key={step} className="rounded-2xl border bg-white p-4"><span className="text-sm font-bold text-teal-700">Bước {index + 1}</span><p className="mt-1 font-semibold">{step}</p></li>)}</ol>
    <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><b>Import chưa bật trong P2 foundation.</b> Cần preview, validation, xác nhận duplicate và audit trước khi commit. Các tên trùng được giữ thành từng identity riêng.</aside>
  </AdminPageShell>;
}
