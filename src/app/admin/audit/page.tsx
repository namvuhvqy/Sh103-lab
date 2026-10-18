import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { ShieldCheck, User, Calendar, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }> = {
  SAVE_MEASUREMENT_RECORD: { label: "Ghi nhận nhiệt độ & độ ẩm", tone: "primary" },
  SAVE_EQUIPMENT_SHIFT_DRAFT: { label: "Cập nhật nhật ký thiết bị (BM.06)", tone: "primary" },
  SAVE_DECONTAMINATION_RECORD: { label: "Ghi nhận khử nhiễm bề mặt (BM.01_KNBM)", tone: "primary" },
  SAVE_MAINTENANCE_RECORD: { label: "Ghi nhận bảo dưỡng thiết bị", tone: "primary" },
  SAVE_DUTY_ROSTER: { label: "Phân công kíp trực", tone: "success" },
  APPROVE_PERIOD: { label: "Phê duyệt sổ kỳ", tone: "success" },
  RETURN_PERIOD: { label: "Yêu cầu xem lại sổ kỳ", tone: "warning" },
  CREATE_CORRECTION_REQUEST: { label: "Tạo yêu cầu đính chính", tone: "warning" },
  AUTHORIZE_CORRECTION: { label: "Duyệt yêu cầu đính chính", tone: "success" },
  LOGIN: { label: "Đăng nhập hệ thống", tone: "neutral" },
  CREATE_STAFF_USER: { label: "Tạo tài khoản nhân sự mới", tone: "success" },
  UPDATE_STAFF_USER: { label: "Cập nhật thông tin nhân sự", tone: "neutral" },
  DEACTIVATE_STAFF_USER: { label: "Vô hiệu hóa tài khoản", tone: "danger" },
  CREATE_ANNOUNCEMENT: { label: "Phát hành thông báo mới", tone: "primary" },
  LOG_INCIDENT: { label: "Báo cáo sự cố phòng xét nghiệm", tone: "danger" },
};

const ENTITY_LABELS: Record<string, string> = {
  records: "Bản ghi nghiệp vụ",
  schedule_occurrences: "Phiên làm việc / Ca trực",
  register_periods: "Sổ kỳ theo dõi",
  duty_rosters: "Kíp trực lâm sàng",
  profiles: "Hồ sơ nhân viên",
  measurement_details: "Số đo nhiệt độ / độ ẩm",
  equipment_shift_statuses: "Trạng thái máy phân tích",
  incidents: "Sự cố thiết bị / an toàn",
  announcements: "Thông báo nội bộ",
};

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Chỉ huy khoa",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "Kỹ thuật viên",
  ADMIN: "Quản trị viên",
};

function formatClinicalSummary(action: string, after: Record<string, unknown> | null, before: Record<string, unknown> | null): string {
  if (!after && !before) return "Thao tác hệ thống";

  const data = after ?? before ?? {};
  
  if (data.target_temperature !== undefined || data.temperature !== undefined) {
    const temp = data.target_temperature ?? data.temperature;
    const hum = data.target_humidity ?? data.humidity;
    return `Nhiệt độ: ${temp}°C${hum !== null && hum !== undefined ? ` · Độ ẩm: ${hum}%` : ""} · Đã lưu vào hệ thống`;
  }

  if (Array.isArray(data.target_statuses)) {
    return `Ghi nhận trạng thái cho ${data.target_statuses.length} máy xét nghiệm trong ca trực`;
  }

  if (data.target_daily !== undefined || data.daily !== undefined) {
    const d = Boolean(data.target_daily ?? data.daily);
    const w = Boolean(data.target_weekly ?? data.weekly);
    const s = Boolean(data.target_spill ?? data.spill);
    const parts = [];
    if (d) parts.push("Bàn XN (Hằng ngày)");
    if (w) parts.push("Sàn/Tường (Hằng tuần)");
    if (s) parts.push("Tràn đổ sinh học");
    return parts.length ? `Khử nhiễm: ${parts.join(" · ")}` : "Ghi nhận nhật ký khử nhiễm";
  }

  if (data.target_duty_kind || data.duty_kind) {
    const kind = String(data.target_duty_kind || data.duty_kind);
    const kindLabel = kind === "LUNCH" ? "Trực trưa" : kind === "NIGHT" ? "Trực đêm" : "Trực 24/7 (Nghỉ/Lễ)";
    return `Cập nhật kíp trực: ${kindLabel}`;
  }

  if (data.full_name) {
    return `Nhân viên: ${data.full_name} (${ROLE_LABELS[String(data.business_role)] ?? data.business_role})`;
  }

  if (data.title) {
    return `Nội dung: ${data.title}`;
  }

  return "Đã ghi nhận dữ liệu hợp lệ vào cơ sở dữ liệu";
}

export default async function AuditPage() {
  const access = await getCurrentAccess();
  if (!access || (access.role !== "DEPARTMENT_HEAD" && !access.isAdmin)) {
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
    throw new Error(`Không tải được audit log: ${error.message}`);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return (
    <AdminPageShell
      title="Nhật ký truy vết & Kiểm toán y tế"
      description="Lưu vết toàn bộ thao tác nhập liệu, điều chỉnh và phê duyệt theo tiêu chuẩn ISO 15189 (Dữ liệu bất biến - Append Only)."
    >
      <div className="space-y-3">
        {(events ?? []).map((item) => {
          const profile = item.actor_user_id ? profileMap.get(item.actor_user_id) : null;
          const roleLabel = profile?.business_role ? ROLE_LABELS[profile.business_role] ?? profile.business_role : "";
          const actorName = profile ? `${roleLabel ? `${roleLabel} ` : ""}${profile.full_name}` : item.actor_user_id ? "Người dùng nội bộ" : "Hệ thống tự động";
          const actionConfig = ACTION_LABELS[item.action] ?? { label: item.action, tone: "neutral" as const };
          const entityLabel = ENTITY_LABELS[item.entity_type] ?? item.entity_type;
          const summary = formatClinicalSummary(item.action, item.after_data as Record<string, unknown> | null, item.before_data as Record<string, unknown> | null);
          const timeStr = new Date(item.created_at).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          return (
            <div key={item.id} className="clinical-card overflow-hidden bg-white p-4 transition shadow-xs hover:border-teal-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div>
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      {entityLabel}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      {actionConfig.label}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Calendar className="size-3.5" />
                  <span>{timeStr}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{actorName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                  <Activity className="size-3.5" />
                  <span>{summary}</span>
                </div>
              </div>

              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-bold hover:text-teal-700">
                  Chi tiết kỹ thuật (Mã đối tượng & Dữ liệu gốc)
                </summary>
                <div className="mt-2 rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-slate-700 border border-slate-200">
                  <p><b>Mã bản ghi (ID):</b> {item.entity_id}</p>
                  <p><b>Mã yêu cầu (Request):</b> {item.request_id ?? "—"}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="font-bold mb-1">Dữ liệu ghi nhận:</p>
                    <pre className="max-h-40 overflow-x-auto rounded bg-slate-900 p-2 text-[10px] text-slate-200">
                      {JSON.stringify({ before: item.before_data, after: item.after_data }, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          );
        })}

        {!events?.length ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-slate-600">
            Chưa có sự kiện kiểm toán được ghi nhận.
          </p>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
