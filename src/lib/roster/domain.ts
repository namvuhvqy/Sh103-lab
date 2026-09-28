export type DutyKind = "WEEKDAY_LUNCH" | "WEEKDAY_AFTERNOON" | "WEEKDAY_NIGHT" | "HOLIDAY_24H";

export interface DutyKindDefinition {
  code: DutyKind;
  label: string;
  timeRange: string;
  description: string;
  doctorRequired: boolean;
  technicianRequired: boolean;
  staffCount: number;
}

export const DUTY_KINDS: Record<DutyKind, DutyKindDefinition> = {
  WEEKDAY_LUNCH: {
    code: "WEEKDAY_LUNCH",
    label: "Trực trưa ngày thường",
    timeRange: "11:30 – 13:30",
    description: "1 Bác sĩ / Trưởng khoa + 1 Kỹ thuật viên",
    doctorRequired: true,
    technicianRequired: true,
    staffCount: 2,
  },
  WEEKDAY_AFTERNOON: {
    code: "WEEKDAY_AFTERNOON",
    label: "Trực chiều ngày thường",
    timeRange: "13:30 – 16:30",
    description: "2 nhân sự STAFF bất kỳ",
    doctorRequired: false,
    technicianRequired: false,
    staffCount: 2,
  },
  WEEKDAY_NIGHT: {
    code: "WEEKDAY_NIGHT",
    label: "Trực đêm ngày thường",
    timeRange: "16:30 – 07:00 hôm sau",
    description: "1 Bác sĩ + 1 Kỹ thuật viên",
    doctorRequired: true,
    technicianRequired: true,
    staffCount: 2,
  },
  HOLIDAY_24H: {
    code: "HOLIDAY_24H",
    label: "Trực ngày nghỉ / Lễ 24H",
    timeRange: "07:00 – 07:00 hôm sau",
    description: "1 Bác sĩ + 1 Kỹ thuật viên (24 giờ)",
    doctorRequired: true,
    technicianRequired: true,
    staffCount: 2,
  },
};

export interface RosterStaffMember {
  user_id: string;
  full_name: string;
  business_role: "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
  account_kind: "STAFF" | "SYSTEM" | "TEST";
  source_order: number | null;
  active: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function getEligibleRosterStaff(staffList: RosterStaffMember[]): RosterStaffMember[] {
  return staffList
    .filter((s) => s.active && s.account_kind === "STAFF")
    .sort((a, b) => (a.source_order ?? 999) - (b.source_order ?? 999));
}

export function validateRosterRequirements(
  dutyKind: DutyKind,
  members: RosterStaffMember[]
): ValidationResult {
  if (members.length !== 2) {
    return { valid: false, error: "Ca trực yêu cầu đúng 2 nhân sự" };
  }

  const [m1, m2] = members;
  if (m1.user_id === m2.user_id) {
    return { valid: false, error: "2 nhân sự trong ca trực phải khác nhau" };
  }

  for (const m of members) {
    if (!m.active) {
      return { valid: false, error: `Nhân sự ${m.full_name} không ở trạng thái hoạt động` };
    }
    if (m.account_kind !== "STAFF") {
      return {
        valid: false,
        error: `Tài khoản loại ${m.account_kind} (TEST hoặc SYSTEM) không được phân công trực`,
      };
    }
  }

  const hasDoctor = members.some(
    (m) => m.business_role === "DOCTOR" || m.business_role === "DEPARTMENT_HEAD"
  );
  const hasTechnician = members.some((m) => m.business_role === "TECHNICIAN");

  if (dutyKind === "WEEKDAY_LUNCH" || dutyKind === "WEEKDAY_NIGHT" || dutyKind === "HOLIDAY_24H") {
    if (!hasDoctor || !hasTechnician) {
      return {
        valid: false,
        error: "Ca trực yêu cầu 1 Bác sĩ / Lãnh đạo khoa và 1 Kỹ thuật viên",
      };
    }
  }

  return { valid: true };
}
