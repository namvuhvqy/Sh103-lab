import { describe, expect, it } from "vitest";
import {
  evaluateAccountLifecycleSafety,
  validateStaffProfilePayload,
  type StaffProfileFormData,
  type StaffReferenceSummary,
} from "@/lib/admin/staff-domain";

describe("Admin Staff Domain & Lifecycle Rules", () => {
  it("evaluates hard delete safety: allowed ONLY when all reference counts are 0", () => {
    const cleanRef: StaffReferenceSummary = {
      user_id: "u1",
      records_count: 0,
      approvals_count: 0,
      roster_assignments_count: 0,
      audit_events_count: 0,
      incidents_count: 0,
      can_hard_delete: true,
    };

    const evaluated = evaluateAccountLifecycleSafety(cleanRef);
    expect(evaluated.canHardDelete).toBe(true);
    expect(evaluated.recommendedAction).toBe("HARD_DELETE_OR_DEACTIVATE");

    const activeRef: StaffReferenceSummary = {
      user_id: "u2",
      records_count: 15,
      approvals_count: 2,
      roster_assignments_count: 4,
      audit_events_count: 8,
      incidents_count: 0,
      can_hard_delete: false,
    };

    const evaluatedActive = evaluateAccountLifecycleSafety(activeRef);
    expect(evaluatedActive.canHardDelete).toBe(false);
    expect(evaluatedActive.recommendedAction).toBe("DEACTIVATE_ONLY");
    expect(evaluatedActive.blockReason).toMatch(/15 bản ghi.*2 phê duyệt.*4 ca trực/i);
  });

  it("validates staff profile payload: requires valid role, kind, and non-empty name", () => {
    const validData: StaffProfileFormData = {
      full_name: "Lê Thanh Hà",
      business_role: "DOCTOR",
      account_kind: "STAFF",
      is_admin: false,
      source_order: 2,
    };

    const resValid = validateStaffProfilePayload(validData);
    expect(resValid.valid).toBe(true);

    const emptyName: StaffProfileFormData = {
      full_name: "   ",
      business_role: "DOCTOR",
      account_kind: "STAFF",
      is_admin: false,
      source_order: 2,
    };
    const resEmpty = validateStaffProfilePayload(emptyName);
    expect(resEmpty.valid).toBe(false);
    expect(resEmpty.error).toMatch(/họ tên/i);

    const invalidRole = {
      ...validData,
      business_role: "SUPER_USER" as unknown as StaffProfileFormData["business_role"],
    };
    const resRole = validateStaffProfilePayload(invalidRole);
    expect(resRole.valid).toBe(false);
    expect(resRole.error).toMatch(/vai trò nghiệp vụ/i);

    const invalidKind = {
      ...validData,
      account_kind: "UNKNOWN" as unknown as StaffProfileFormData["account_kind"],
    };
    const resKind = validateStaffProfilePayload(invalidKind);
    expect(resKind.valid).toBe(false);
    expect(resKind.error).toMatch(/phân loại tài khoản/i);
  });

  it("clarifies that is_admin is an IT permission flag and does not grant approval role", () => {
    const adminTech: StaffProfileFormData = {
      full_name: "Vũ Viết Nam",
      business_role: "TECHNICIAN",
      account_kind: "STAFF",
      is_admin: true,
      source_order: 20,
    };
    const res = validateStaffProfilePayload(adminTech);
    expect(res.valid).toBe(true);
    // Role remains TECHNICIAN despite is_admin = true
    expect(adminTech.business_role).toBe("TECHNICIAN");
  });
});
