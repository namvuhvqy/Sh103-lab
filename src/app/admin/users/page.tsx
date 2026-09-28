import Link from "next/link";
import { AdminPageShell, SummaryCard } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { roleLabel, type BusinessRole } from "@/lib/auth/access";
import { checkAuthAdminPrerequisites } from "@/lib/admin/staff-actions";
import { Lock, Plus, Trash2 } from "lucide-react";

export default async function UsersPage() {
  const { supabase } = await requireAdmin();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id,full_name,business_role,account_kind,source_order,is_admin,active")
    .order("source_order", { ascending: true, nullsFirst: false });

  const staffList = profiles ?? [];
  const staffKindCount = staffList.filter((p) => p.account_kind === "STAFF").length;
  const headCount = staffList.filter((p) => p.business_role === "DEPARTMENT_HEAD").length;
  const testCount = staffList.filter((p) => p.account_kind === "TEST").length;

  const authPrereqs = checkAuthAdminPrerequisites();

  return (
    <AdminPageShell
      title="Quản lý Tài khoản & Nhân sự"
      description="Quản lý danh sách nhân sự chính thức Phụ lục (STT 1–25), phân loại tài khoản (STAFF / SYSTEM / TEST), và cấu hình quyền kỹ thuật. Quyền Admin không tự cấp quyền phê duyệt thay Trưởng khoa."
    >
      {!authPrereqs.available && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <Lock className="size-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <span className="font-black">Thông báo Chế độ An toàn: </span>
            <span>{authPrereqs.reason}</span>
          </div>
        </div>
      )}

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <SummaryCard label="Tổng tài khoản" value={staffList.length} />
        <SummaryCard label="Nhân sự STAFF (1-25)" value={staffKindCount} />
        <SummaryCard label="Lãnh đạo khoa" value={headCount} />
        <SummaryCard label="Tài khoản TEST" value={testCount} />
      </div>

      <section className="mb-5 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Tạo và xoá tài khoản</h2>
            <p className="text-xs font-medium text-slate-600">
              API tạo tài khoản: <code className="rounded bg-white px-1 py-0.5">POST /api/admin/staff</code>. Xóa cứng tài khoản sạch tham chiếu: <code className="rounded bg-white px-1 py-0.5">DELETE /api/admin/staff/[userId]</code>; tài khoản đã phát sinh dữ liệu phải dùng vô hiệu hóa để giữ audit.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users/new"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-teal-800 px-4 text-xs font-black text-white shadow-sm transition hover:bg-teal-900"
            >
              <Plus className="size-4" />
              Tạo tài khoản
            </Link>
            <span className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-white px-4 text-xs font-black text-rose-700">
              <Trash2 className="size-4" />
              Xóa tài khoản sạch tham chiếu
            </span>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900">Danh bạ nhân sự &amp; Phân quyền</h2>
            <p className="text-xs text-slate-500">Hiển thị theo thứ tự STT Phụ lục quy chuẩn</p>
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {staffList.map((profile) => {
            const isStaff = profile.account_kind === "STAFF";
            const isTest = profile.account_kind === "TEST";

            return (
              <li
                key={profile.user_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-teal-50/30 transition"
              >
                <div className="flex items-center gap-3">
                  {profile.source_order ? (
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-black text-teal-800 border border-teal-200">
                      #{profile.source_order}
                    </span>
                  ) : (
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                      –
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900 text-sm">{profile.full_name}</p>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                          isStaff
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : isTest
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}
                      >
                        {profile.account_kind}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-600">
                        {roleLabel(profile.business_role as BusinessRole)}
                      </span>
                      {profile.is_admin && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                            Admin Kỹ thuật
                          </span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className={profile.active ? "text-emerald-700 font-bold" : "text-slate-400 font-semibold"}>
                        {profile.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <Link
                    href={`/admin/users/${profile.user_id}`}
                    className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:border-teal-500 hover:text-teal-900 shadow-2xs transition"
                  >
                    Chi tiết &amp; Phân quyền
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminPageShell>
  );
}
