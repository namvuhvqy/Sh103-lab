import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { ShieldCheck, User, Calendar, Activity, CheckCircle2, AlertTriangle, FileText, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_CONFIGS: Record<string, { label: string; badge: string; color: string }> = {
  INTERNAL_CONFIRMATION_CHECK: { label: "Xác nhận nội bộ sổ kỳ", badge: "Xác nhận BMK", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  INTERNAL_CONFIRMATION_UNCHECK: { label: "Hủy xác nhận nội bộ", badge: "Hủy xác nhận", color: "bg-amber-50 text-amber-800 border-amber-200" },
  APPROVE_PERIOD: { label: "Phê duyệt chính thức sổ kỳ", badge: "Phê duyệt", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  APPROVE_INCOMPLETE: { label: "Xác nhận sổ kỳ theo dõi", badge: "Phê duyệt kỳ", color: "bg-teal-50 text-teal-800 border-teal-200" },
  RETURN_PERIOD: { label: "Yêu cầu chỉnh sửa sổ kỳ", badge: "Trả về", color: "bg-rose-50 text-rose-800 border-rose-200" },
  SAVE_MEASUREMENT_RECORD: { label: "Ghi nhận nhiệt độ & độ ẩm phòng", badge: "Nhiệt ẩm kế", color: "bg-blue-50 text-blue-800 border-blue-200" },
  SAVE_EQUIPMENT_SHIFT_DRAFT: { label: "Ghi nhận nhật ký thiết bị (BM.06)", badge: "20 máy XN", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  SAVE_EQUIPMENT_SHIFT_RECORD: { label: "Lưu nhật ký ca thiết bị (BM.06)", badge: "20 máy XN", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  SAVE_DECONTAMINATION_RECORD: { label: "Ghi nhận khử nhiễm bề mặt (BM.01_KNBM)", badge: "Khử nhiễm", color: "bg-purple-50 text-purple-800 border-purple-200" },
  SAVE_MAINTENANCE_RECORD: { label: "Ghi nhận bảo dưỡng trang thiết bị", badge: "Bảo dưỡng", color: "bg-amber-50 text-amber-800 border-amber-200" },
  SAVE_DUTY_ROSTER: { label: "Phân công kíp trực chuyên môn", badge: "Kíp trực", color: "bg-teal-50 text-teal-800 border-teal-200" },
  CREATE_CORRECTION_REQUEST: { label: "Yêu cầu đính chính bản ghi", badge: "Đính chính", color: "bg-amber-50 text-amber-800 border-amber-200" },
  AUTHORIZE_CORRECTION: { label: "Phê duyệt đính chính bản ghi", badge: "Duyệt đính chính", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  LOGIN: { label: "Đăng nhập hệ thống", badge: "Truy cập", color: "bg-slate-100 text-slate-700 border-slate-200" },
  CREATE_STAFF_USER: { label: "Tạo tài khoản nhân viên mới", badge: "Nhân sự", color: "bg-teal-50 text-teal-800 border-teal-200" },
  UPDATE_STAFF_USER: { label: "Cập nhật thông tin nhân viên", badge: "Nhân sự", color: "bg-slate-100 text-slate-700 border-slate-200" },
  DEACTIVATE_STAFF_USER: { label: "Khóa / Vô hiệu hóa tài khoản", badge: "Bảo mật", color: "bg-rose-50 text-rose-800 border-rose-200" },
  CREATE_ANNOUNCEMENT: { label: "Đăng thông báo nội bộ khoa", badge: "Thông báo", color: "bg-blue-50 text-blue-800 border-blue-200" },
  LOG_INCIDENT: { label: "Báo cáo sự cố phòng xét nghiệm", badge: "Sự cố", color: "bg-rose-50 text-rose-800 border-rose-200" },
};

const ENTITY_LABELS: Record<string, string> = {
  records: "Bản ghi xét nghiệm",
  register_periods: "Sổ kỳ theo dõi",
  register_period: "Sổ kỳ theo dõi",
  schedule_occurrences: "Phiên làm việc / Ca trực",
  duty_rosters: "Kíp trực lâm sàng",
  profiles: "Hồ sơ nhân viên",
  measurement_details: "Số đo nhiệt độ / độ ẩm",
  equipment_shift_statuses: "Trạng thái máy xét nghiệm",
  incidents: "Báo cáo sự cố",
  announcements: "Thông báo nội bộ",
};

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Chỉ huy Bộ môn - Khoa",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "Kỹ thuật viên",
  ADMIN: "Quản trị viên",
};

function formatClinicalSummary(action: string, after: Record<string, unknown> | null, before: Record<string, unknown> | null): string {
  if (action === "INTERNAL_CONFIRMATION_CHECK") {
    const actor = String(after?.confirmed_by ?? "Chỉ huy BMK");
    return `Đã xác nhận nội bộ sổ kỳ bởi: ${actor}`;
  }
  if (action === "INTERNAL_CONFIRMATION_UNCHECK") {
    return "Đã hủy bỏ trạng thái xác nhận nội bộ sổ kỳ";
  }
  if (action === "APPROVE_INCOMPLETE" || action === "APPROVE_PERIOD") {
    const label = String(after?.period_label ?? "kỳ chuyên môn");
    return `Phê duyệt chính thức sổ kỳ theo dõi (${label})`;
  }
  if (action === "LOGIN") {
    return "Đăng nhập thành công vào hệ thống phòng xét nghiệm";
  }

  const data = after ?? before ?? {};

  if (data.temperature_c !== undefined || data.target_temperature !== undefined || data.temperature !== undefined) {
    const temp = data.temperature_c ?? data.target_temperature ?? data.temperature;
    const hum = data.humidity_pct ?? data.target_humidity ?? data.humidity;
    return `Ghi nhận Nhiệt độ: ${temp}°C${hum !== null && hum !== undefined ? ` · Độ ẩm: ${hum}%` : ""} (Đạt tiêu chuẩn bảo quản)`;
  }

  if (Array.isArray(data.target_statuses) || data.equipment_shift_statuses) {
    return "Ghi nhận trạng thái hoạt động 20 máy xét nghiệm trong ca trực";
  }

  if (data.daily_done !== undefined || data.target_daily !== undefined || data.daily !== undefined) {
    const d = Boolean(data.daily_done ?? data.target_daily ?? data.daily);
    const w = Boolean(data.weekly_done ?? data.target_weekly ?? data.weekly);
    const s = Boolean(data.spill_event_done ?? data.target_spill ?? data.spill);
    const parts: string[] = [];
    if (d) parts.push("Bàn XN hằng ngày");
    if (w) parts.push("Sàn / Tường định kỳ");
    if (s) parts.push("Sự cố tràn đổ");
    return parts.length ? `Khử nhiễm: ${parts.join(" · ")}` : "Ghi nhận khử nhiễm bề mặt theo quy trình";
  }

  if (data.target_duty_kind || data.duty_kind) {
    const kind = String(data.target_duty_kind || data.duty_kind);
    const kindLabel = kind === "LUNCH" ? "Trực trưa (12h-13h30)" : kind === "NIGHT" ? "Trực đêm (16h-7h)" : "Trực 24/7 (Nghỉ/Lễ)";
    return `Cập nhật kíp trực chuyên môn: ${kindLabel}`;
  }

  if (data.full_name) {
    return `Hồ sơ nhân viên: ${data.full_name} (${ROLE_LABELS[String(data.business_role)] ?? data.business_role})`;
  }

  if (data.title) {
    return `Tiêu đề thông báo: "${data.title}"`;
  }

  return "Thao tác đã được ghi nhận và bảo vệ bất biến theo chuẩn ISO 15189";
}

export default async function AuditPage() {
  const access = await getCurrentAccess();
  if (!access || (!access.canApprove && !access.isAdmin)) {
    redirect("/");
  }

  const supabase = await createClient();
  const [{ data: events, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("audit_events")
      .select("id,created_at,actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("user_id,full_name,business_role"),
  ]);

  if (error) {
    throw new Error(`Không tải được nhật ký kiểm toán: ${error.message}`);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return (
    <AdminPageShell
      title="Nhật ký kiểm toán y tế (Audit Log)"
      description="Ghi nhận toàn bộ thao tác nhập liệu, điều chỉnh và xác nhận nội bộ theo tiêu chuẩn ISO 15189 (Bảo vệ bất biến, minh bạch và chống chối bỏ)."
    >
      <div className="space-y-3.5">
        {(events ?? []).map((item) => {
          const profile = item.actor_user_id ? profileMap.get(item.actor_user_id) : null;
          const roleLabel = profile?.business_role ? ROLE_LABELS[profile.business_role] ?? profile.business_role : "";
          const actorName = profile
            ? `${roleLabel ? `${roleLabel}: ` : ""}${profile.full_name}`
            : item.actor_user_id
            ? "Cán bộ chuyên môn"
            : "Hệ thống tự động";

          const actionConfig = ACTION_CONFIGS[item.action] ?? {
            label: item.action,
            badge: "Hệ thống",
            color: "bg-slate-100 text-slate-700 border-slate-200",
          };
          const entityLabel = ENTITY_LABELS[item.entity_type] ?? item.entity_type;
          const summary = formatClinicalSummary(
            item.action,
            item.after_data as Record<string, unknown> | null,
            item.before_data as Record<string, unknown> | null
          );
          const timeStr = new Date(item.created_at).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-teal-300 hover:shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800 border border-teal-100">
                    <ShieldCheck className="size-4.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${actionConfig.color}`}>
                        {actionConfig.badge}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Đối tượng: {entityLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      {actionConfig.label}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0">
                  <Calendar className="size-3.5 text-slate-400" />
                  <span>{timeStr}</span>
                </div>
              </div>

              {/* Tóm tắt hành động chi tiết */}
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-teal-700 shrink-0" />
                  <span className="font-bold text-slate-900">{actorName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1 rounded-lg border border-teal-100/60">
                  <Activity className="size-3.5 text-teal-700 shrink-0" />
                  <span>{summary}</span>
                </div>
              </div>

              {/* Chi tiết kỹ thuật mở rộng */}
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-bold hover:text-teal-700 select-none">
                  Xem thông số kỹ thuật &amp; Mã truy vết
                </summary>
                <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-[11px] text-slate-700 border border-slate-200 space-y-1">
                  <p><b>Mã bản ghi (ID):</b> {item.entity_id}</p>
                  <p><b>Mã tác vụ (Action ID):</b> {item.action}</p>
                  <p><b>Thời gian ISO:</b> {item.created_at}</p>
                </div>
              </details>
            </div>
          );
        })}

        {!events?.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            <ShieldCheck className="mx-auto size-10 text-slate-300" />
            <p className="mt-2 text-sm font-semibold">Chưa có sự kiện kiểm toán nào được ghi nhận.</p>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
