import { redirect } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { AuditLogClientView, type FormattedAuditEvent } from "@/components/admin/AuditLogClientView";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HEAD: "Chỉ huy Bộ môn - Khoa",
  DOCTOR: "Bác sĩ",
  TECHNICIAN: "Kỹ thuật viên",
  ADMIN: "Quản trị viên",
};

const SLOT_LABELS: Record<string, string> = {
  SHIFT_1: "Ca 1 - Sáng (07:00–11:30)",
  SHIFT_2: "Ca 2 - Trực trưa (11:30–13:30)",
  SHIFT_3: "Ca 3 - Chiều (13:30–16:40)",
  SHIFT_4: "Ca 4 - Trực đêm (16:40–07:00 hôm sau)",
  MORNING: "Ca Sáng (08:00)",
  AFTERNOON: "Ca Chiều (14:00)",
};

const ENTITY_LABELS: Record<string, string> = {
  record: "Bản ghi xét nghiệm",
  records: "Bản ghi xét nghiệm",
  register_period: "Sổ kỳ theo dõi ISO",
  register_periods: "Sổ kỳ theo dõi ISO",
  schedule_occurrences: "Phiên làm việc / Ca trực",
  duty_rosters: "Kíp trực lâm sàng",
  profiles: "Hồ sơ nhân viên",
  assets: "Trang thiết bị & Tủ",
  locations: "Khu vực phòng xét nghiệm",
  measurement_details: "Số đo nhiệt độ / độ ẩm",
  equipment_shift_statuses: "Trạng thái máy xét nghiệm",
  incidents: "Báo cáo sự cố y tế",
  announcements: "Thông báo nội bộ",
};

export default async function AuditPage() {
  const access = await getCurrentAccess();
  if (!access || (!access.canApprove && !access.isAdmin)) {
    redirect("/");
  }

  const supabase = await createClient();

  const [
    { data: events, error },
    { data: profiles },
    { data: locations },
    { data: assets },
    { data: periods },
    { data: templates },
  ] = await Promise.all([
    supabase
      .from("audit_events")
      .select("id,created_at,actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id")
      .order("created_at", { ascending: false })
      .limit(150),
    supabase.from("profiles").select("user_id,full_name,business_role"),
    supabase.from("locations").select("id,name,code"),
    supabase.from("assets").select("id,display_name,source_name,source_order"),
    supabase.from("register_periods").select("id,period_label"),
    supabase.from("form_templates").select("id,code,name"),
  ]);

  if (error) {
    throw new Error(`Không tải được nhật ký kiểm toán: ${error.message}`);
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const locMap = new Map((locations ?? []).map((l) => [l.id, l.name]));
  const assetMap = new Map((assets ?? []).map((a) => [a.id, a.display_name || a.source_name]));
  const periodMap = new Map((periods ?? []).map((p) => [p.id, p.period_label || "Sổ kỳ"]));

  const formattedEvents: FormattedAuditEvent[] = (events ?? []).map((item) => {
    const after = (item.after_data as Record<string, unknown> | null) ?? {};
    const before = (item.before_data as Record<string, unknown> | null) ?? {};

    // 1. Xác định Người thực hiện
    const effectiveActorId =
      item.actor_user_id ||
      (typeof after.entered_by === "string" ? after.entered_by : null) ||
      (typeof after.created_by === "string" ? after.created_by : null) ||
      (typeof after.approved_by === "string" ? after.approved_by : null) ||
      (typeof before.entered_by === "string" ? before.entered_by : null);

    const profile = effectiveActorId ? profileMap.get(effectiveActorId) : null;
    const actorName = profile?.full_name || (effectiveActorId ? "Cán bộ chuyên môn" : "Hệ thống tự động");
    const actorRole = profile?.business_role ? ROLE_LABELS[profile.business_role] ?? profile.business_role : "";

    // 2. Tra cứu thực thể liên quan
    const locationName = after.location_id ? locMap.get(String(after.location_id)) : before.location_id ? locMap.get(String(before.location_id)) : undefined;
    const assetName = after.asset_id ? assetMap.get(String(after.asset_id)) : before.asset_id ? assetMap.get(String(before.asset_id)) : (item.entity_type === "assets" ? assetMap.get(item.entity_id) : undefined);
    const periodLabel = after.period_id ? periodMap.get(String(after.period_id)) : item.entity_type === "register_period" || item.entity_type === "register_periods" ? periodMap.get(item.entity_id) : undefined;
    const slotCode = (after.slot_code as string) || (before.slot_code as string) || undefined;
    const slotName = slotCode ? (SLOT_LABELS[slotCode] ?? slotCode) : "";
    const targetDate = (after.business_date as string) || (before.business_date as string) || undefined;
    const lockVersion = typeof after.lock_version === "number" ? after.lock_version : undefined;

    // 3. Phân loại tác vụ và xây dựng tóm tắt hành động người dùng
    let actionTitle = item.action;
    let badgeLabel = "Hệ thống";
    let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
    let category: FormattedAuditEvent["category"] = "OTHER";
    let summary = "Thao tác đã được ghi nhận và bảo vệ bất biến theo chuẩn ISO 15189.";

    const action = item.action;
    const recordType = (after.record_type as string) || (before.record_type as string) || "";

    if (action === "CREATE_RECORD" || action === "EDIT_RECORD") {
      const isEdit = action === "EDIT_RECORD";
      if (recordType === "EQUIPMENT_SHIFT") {
        category = "BM06";
        actionTitle = isEdit ? "Cập nhật nhật ký ca thiết bị (BM.06)" : "Ghi nhận nhật ký ca thiết bị (BM.06)";
        badgeLabel = "BM.06 - 20 Thiết bị";
        badgeColor = "bg-indigo-50 text-indigo-800 border-indigo-200";
        const state = (after.record_state as string) || "COMPLETED";
        summary = `${isEdit ? "Cập nhật" : "Lưu"} nhật ký 20 thiết bị xét nghiệm ${slotName ? `[${slotName}]` : ""} ngày ${targetDate ?? ""}. Trạng thái: ${state === "COMPLETED" ? "Đã chốt hoàn tất" : "Lưu nháp"}.`;
      } else if (recordType === "MEASUREMENT") {
        category = "TEMPERATURE";
        actionTitle = isEdit ? "Cập nhật số đo nhiệt độ / độ ẩm" : "Ghi nhận số đo nhiệt độ / độ ẩm";
        badgeLabel = "BM.01/02/03 - Nhiệt ẩm";
        badgeColor = "bg-blue-50 text-blue-800 border-blue-200";
        const target = assetName || locationName || "phòng xét nghiệm";
        summary = `${isEdit ? "Hiệu chỉnh" : "Ghi nhận"} số đo nhiệt độ/độ ẩm tại ${target} ${slotName ? `[${slotName}]` : ""} ngày ${targetDate ?? ""}.`;
      } else if (recordType === "DECONTAMINATION") {
        category = "DECONTAMINATION";
        actionTitle = isEdit ? "Cập nhật khử nhiễm bề mặt" : "Ghi nhận khử nhiễm bề mặt (BM.01_KNBM)";
        badgeLabel = "BM.01_KNBM - Khử nhiễm";
        badgeColor = "bg-purple-50 text-purple-800 border-purple-200";
        const target = locationName || "khu vực làm việc";
        summary = `${isEdit ? "Cập nhật" : "Thực hiện"} khử nhiễm bề mặt tại ${target} ngày ${targetDate ?? ""} theo quy trình khử trùng chuẩn ISO.`;
      } else if (recordType === "MAINTENANCE") {
        category = "BM06";
        actionTitle = isEdit ? "Cập nhật bảo dưỡng thiết bị (BM.02)" : "Ghi nhận bảo dưỡng thiết bị (BM.02)";
        badgeLabel = "BM.02 - Bảo dưỡng";
        badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
        const target = assetName || "thiết bị y tế";
        summary = `${isEdit ? "Cập nhật" : "Hoàn thành"} bảo dưỡng định kỳ thiết bị ${target} ngày ${targetDate ?? ""}.`;
      } else {
        actionTitle = isEdit ? "Chỉnh sửa bản ghi xét nghiệm" : "Tạo bản ghi xét nghiệm mới";
        badgeLabel = "Bản ghi ISO";
        badgeColor = "bg-teal-50 text-teal-800 border-teal-200";
        summary = `Ghi nhận bản ghi loại ${recordType || item.entity_type} ngày ${targetDate ?? ""}.`;
      }
    } else if (action === "MARK_READY") {
      category = "APPROVAL";
      actionTitle = "Khóa sổ kỳ & Gửi duyệt chuyên môn";
      badgeLabel = "Chờ duyệt";
      badgeColor = "bg-teal-50 text-teal-800 border-teal-200";
      summary = `Đã hoàn thành số liệu và gửi sổ kỳ "${periodLabel || "sổ theo dõi"}" lên Ban chỉ huy khoa xem xét ký duyệt.`;
    } else if (action === "APPROVE" || action === "APPROVE_PERIOD" || action === "APPROVE_INCOMPLETE") {
      category = "APPROVAL";
      actionTitle = "Phê duyệt chính thức sổ kỳ theo dõi";
      badgeLabel = "Phê duyệt ISO";
      badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
      summary = `Chỉ huy BMK / Bác sĩ đã kiểm tra toàn bộ hồ sơ và ký số phê duyệt chính thức sổ kỳ "${periodLabel || "sổ theo dõi"}".`;
    } else if (action === "RETURN" || action === "RETURN_PERIOD") {
      category = "APPROVAL";
      actionTitle = "Yêu cầu chỉnh sửa sổ kỳ (Trả về)";
      badgeLabel = "Trả về";
      badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
      const reason = (after.returned_reason as string) || (before.returned_reason as string) || "Cần bổ sung số liệu";
      summary = `Lãnh đạo BMK đã từ chối phê duyệt và trả lại sổ kỳ "${periodLabel || "sổ theo dõi"}". Lý do: "${reason}".`;
    } else if (action === "INTERNAL_CONFIRMATION_CHECK") {
      category = "APPROVAL";
      actionTitle = "Xác nhận nội bộ sổ kỳ theo dõi";
      badgeLabel = "Xác nhận BMK";
      badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
      summary = `Chỉ huy BMK đã rà soát và xác nhận nội bộ đạt chuẩn đối với sổ kỳ "${periodLabel || "sổ theo dõi"}".`;
    } else if (action === "INTERNAL_CONFIRMATION_UNCHECK") {
      category = "APPROVAL";
      actionTitle = "Hủy xác nhận nội bộ sổ kỳ";
      badgeLabel = "Hủy xác nhận";
      badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
      summary = `Chỉ huy BMK đã hủy trạng thái xác nhận nội bộ để tiếp tục kiểm tra rà soát.`;
    } else if (action === "MASTER_DATA_CHANGE") {
      category = "MASTER";
      actionTitle = "Cập nhật dữ liệu danh mục gốc";
      badgeLabel = "Cấu hình hệ thống";
      badgeColor = "bg-slate-100 text-slate-800 border-slate-300";
      const target = assetName || locationName || item.entity_type;
      summary = `Quản trị viên đã thay đổi cấu hình danh mục gốc đối với [${target}]. Trạng thái thiết bị / vị trí đã được đồng bộ.`;
    } else if (action === "DUTY_ROSTER_SAVE") {
      category = "BM06";
      actionTitle = "Phân công kíp trực chuyên môn";
      badgeLabel = "Kíp trực";
      badgeColor = "bg-teal-50 text-teal-800 border-teal-200";
      summary = `Cập nhật danh sách kíp trực chuyên môn ngày ${targetDate ?? ""}.`;
    } else if (action === "ANNOUNCEMENT_PUBLISH" || action === "CREATE_ANNOUNCEMENT") {
      category = "OTHER";
      actionTitle = "Phát hành thông báo nội bộ khoa";
      badgeLabel = "Thông báo";
      badgeColor = "bg-blue-50 text-blue-800 border-blue-200";
      const title = (after.title as string) || "Thông báo nội bộ";
      summary = `Đã phát hành thông báo: "${title}".`;
    } else if (action === "LOGIN") {
      category = "OTHER";
      actionTitle = "Đăng nhập hệ thống phòng xét nghiệm";
      badgeLabel = "Truy cập";
      badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
      summary = `Đăng nhập thành công vào hệ thống quản lý ISO 15189 Khoa Sinh Hóa.`;
    } else if (action === "EXPORT_REPORT") {
      category = "OTHER";
      actionTitle = "Xuất biểu mẫu báo cáo chuẩn ISO (Excel/PDF)";
      badgeLabel = "Xuất file";
      badgeColor = "bg-teal-50 text-teal-800 border-teal-200";
      summary = `Đã tải về file biểu mẫu chuẩn ISO đối với ${periodLabel || "kỳ báo cáo"}.`;
    }

    const timeStr = new Date(item.created_at).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      id: item.id,
      createdAt: item.created_at,
      timeStr,
      actorName,
      actorRole,
      actionTitle,
      badgeLabel,
      badgeColor,
      category,
      summary,
      entityType: ENTITY_LABELS[item.entity_type] ?? item.entity_type,
      entityId: item.entity_id,
      technicalDetails: {
        actionCode: item.action,
        targetDate,
        slotCode,
        locationName,
        assetName,
        periodLabel,
        lockVersion,
      },
    };
  });

  return (
    <AdminPageShell
      title="Nhật ký kiểm toán y tế (Audit Log)"
      description="Ghi nhận toàn bộ thao tác nhập liệu, điều chỉnh, phê duyệt và thay đổi cấu hình theo chuẩn quốc tế ISO 15189:2022 (Bảo vệ bất biến, minh bạch và chống chối bỏ)."
    >
      <AuditLogClientView events={formattedEvents} />
    </AdminPageShell>
  );
}
