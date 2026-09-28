import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { checkAuthAdminPrerequisites } from "@/lib/admin/staff-actions";
import { Lock } from "lucide-react";

export default async function NewUserPage() {
  await requireAdmin();
  const prereqs = checkAuthAdminPrerequisites();

  return (
    <AdminPageShell
      title="Tạo tài khoản mới"
      description="Tạo Supabase Auth user và hồ sơ nhân sự trong một giao dịch có rollback khi tạo profile lỗi. Mật khẩu dùng chung theo quyết định hiện tại của Owner."
    >
      {!prereqs.available ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <Lock className="mb-2 size-5 text-amber-700" />
          {prereqs.reason}
        </div>
      ) : null}
      <form method="post" action="/api/admin/staff" className="max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">Email đăng nhập
            <input required name="email" type="email" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">Mật khẩu dùng chung
            <input required name="password" type="password" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>
        <label className="block text-xs font-bold text-slate-700">Họ tên
          <input required name="full_name" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold text-slate-700">Vai trò
            <select name="business_role" defaultValue="TECHNICIAN" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="TECHNICIAN">Kỹ thuật viên</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="DEPARTMENT_HEAD">Trưởng khoa</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">Loại tài khoản
            <select name="account_kind" defaultValue="STAFF" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="STAFF">STAFF</option>
              <option value="TEST">TEST</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">STT Phụ lục
            <input name="source_order" type="number" min="1" max="25" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
          <input type="checkbox" name="is_admin" value="true" /> Admin kỹ thuật
        </label>
        <button disabled={!prereqs.available} className="min-h-11 rounded-2xl bg-teal-800 px-5 text-sm font-black text-white disabled:bg-slate-300">
          Tạo tài khoản
        </button>
      </form>
    </AdminPageShell>
  );
}
