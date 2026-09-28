export type BusinessRole = "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
export type AccountKind = "STAFF" | "SYSTEM" | "TEST";

export interface StaffReferenceSummary {
  user_id: string;
  records_count: number;
  approvals_count: number;
  roster_assignments_count: number;
  audit_events_count: number;
  incidents_count: number;
  can_hard_delete: boolean;
}

export interface StaffProfileFormData {
  full_name: string;
  business_role: BusinessRole;
  account_kind: AccountKind;
  is_admin: boolean;
  source_order?: number | null;
  form_template_ids?: string[];
  location_ids?: string[];
  asset_ids?: string[];
}

export interface SafetyEvaluation {
  canHardDelete: boolean;
  recommendedAction: "HARD_DELETE_OR_DEACTIVATE" | "DEACTIVATE_ONLY";
  blockReason?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function evaluateAccountLifecycleSafety(summary: StaffReferenceSummary): SafetyEvaluation {
  if (
    summary.can_hard_delete &&
    summary.records_count === 0 &&
    summary.approvals_count === 0 &&
    summary.roster_assignments_count === 0 &&
    summary.audit_events_count === 0 &&
    summary.incidents_count === 0
  ) {
    return {
      canHardDelete: true,
      recommendedAction: "HARD_DELETE_OR_DEACTIVATE",
    };
  }

  const reasons: string[] = [];
  if (summary.records_count > 0) reasons.push(`${summary.records_count} bản ghi`);
  if (summary.approvals_count > 0) reasons.push(`${summary.approvals_count} phê duyệt`);
  if (summary.roster_assignments_count > 0) reasons.push(`${summary.roster_assignments_count} ca trực`);
  if (summary.audit_events_count > 0) reasons.push(`${summary.audit_events_count} nhật ký kiểm toán`);
  if (summary.incidents_count > 0) reasons.push(`${summary.incidents_count} sự cố`);

  return {
    canHardDelete: false,
    recommendedAction: "DEACTIVATE_ONLY",
    blockReason: `Tài khoản đã có dữ liệu tham chiếu lịch sử (${reasons.join(", ")}). Để đảm bảo tính toàn vẹn và bất biến của dữ liệu ISO, chỉ được phép Vô hiệu hóa (Deactivate), tuyệt đối không xóa cứng.`,
  };
}

export function validateStaffProfilePayload(data: StaffProfileFormData): ValidationResult {
  if (!data.full_name || data.full_name.trim().length === 0) {
    return { valid: false, error: "Họ tên nhân sự không được để trống" };
  }

  const validRoles: BusinessRole[] = ["DEPARTMENT_HEAD", "DOCTOR", "TECHNICIAN"];
  if (!validRoles.includes(data.business_role)) {
    return { valid: false, error: "Vai trò nghiệp vụ không hợp lệ" };
  }

  const validKinds: AccountKind[] = ["STAFF", "SYSTEM", "TEST"];
  if (!validKinds.includes(data.account_kind)) {
    return { valid: false, error: "Phân loại tài khoản không hợp lệ" };
  }

  return { valid: true };
}
