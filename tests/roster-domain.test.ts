import { describe, expect, it } from "vitest";
import {
  validateRosterRequirements,
  getEligibleRosterStaff,
  type RosterStaffMember,
} from "@/lib/roster/domain";

describe("Roster domain & validation rules", () => {
  const mockStaff: RosterStaffMember[] = [
    {
      user_id: "user-1",
      full_name: "Huỳnh Quang Thuận",
      business_role: "DEPARTMENT_HEAD",
      account_kind: "STAFF",
      source_order: 1,
      active: true,
    },
    {
      user_id: "user-2",
      full_name: "Lê Thanh Hà",
      business_role: "DOCTOR",
      account_kind: "STAFF",
      source_order: 2,
      active: true,
    },
    {
      user_id: "user-11",
      full_name: "Nguyễn Văn Cường",
      business_role: "TECHNICIAN",
      account_kind: "STAFF",
      source_order: 11,
      active: true,
    },
    {
      user_id: "user-12",
      full_name: "Nguyễn Thị Bích Hạnh",
      business_role: "TECHNICIAN",
      account_kind: "STAFF",
      source_order: 12,
      active: true,
    },
    {
      user_id: "user-system",
      full_name: "Admin Sinh Hóa",
      business_role: "DOCTOR",
      account_kind: "SYSTEM",
      source_order: null,
      active: true,
    },
    {
      user_id: "user-test",
      full_name: "TS.BS Vũ Văn Nam",
      business_role: "DOCTOR",
      account_kind: "TEST",
      source_order: null,
      active: true,
    },
    {
      user_id: "user-inactive",
      full_name: "Inactive Staff",
      business_role: "TECHNICIAN",
      account_kind: "STAFF",
      source_order: 26,
      active: false,
    },
  ];

  it("filters eligible roster staff: active STAFF only, ordered by source_order, excluding TEST/SYSTEM/inactive", () => {
    const eligible = getEligibleRosterStaff(mockStaff);
    expect(eligible).toHaveLength(4);
    expect(eligible.map((s) => s.user_id)).toEqual(["user-1", "user-2", "user-11", "user-12"]);
    expect(eligible.map((s) => s.source_order)).toEqual([1, 2, 11, 12]);
  });

  it("validates lunch duty requires exactly 2 distinct members: 1 doctor-class (DOCTOR/DEPARTMENT_HEAD) and 1 technician", () => {
    // Valid: 1 Head + 1 Tech
    const res1 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[0], mockStaff[2]]);
    expect(res1.valid).toBe(true);

    // Valid: 1 Doctor + 1 Tech
    const res2 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[1], mockStaff[2]]);
    expect(res2.valid).toBe(true);

    // Invalid: 2 Doctors
    const res3 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[0], mockStaff[1]]);
    expect(res3.valid).toBe(false);
    expect(res3.error).toMatch(/bác sĩ.*kỹ thuật viên/i);

    // Invalid: 2 Techs
    const res4 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[2], mockStaff[3]]);
    expect(res4.valid).toBe(false);
    expect(res4.error).toMatch(/bác sĩ.*kỹ thuật viên/i);

    // Invalid: same user twice
    const res5 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[0], mockStaff[0]]);
    expect(res5.valid).toBe(false);
    expect(res5.error).toMatch(/khác nhau/i);

    // Invalid: less than 2
    const res6 = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[0]]);
    expect(res6.valid).toBe(false);
    expect(res6.error).toMatch(/đúng 2 nhân sự/i);
  });

  it("validates night duty and holiday 24h also require 1 doctor-class + 1 technician", () => {
    const resNight = validateRosterRequirements("WEEKDAY_NIGHT", [mockStaff[1], mockStaff[2]]);
    expect(resNight.valid).toBe(true);

    const resHoliday = validateRosterRequirements("HOLIDAY_24H", [mockStaff[0], mockStaff[3]]);
    expect(resHoliday.valid).toBe(true);

    const resNightInvalid = validateRosterRequirements("WEEKDAY_NIGHT", [mockStaff[2], mockStaff[3]]);
    expect(resNightInvalid.valid).toBe(false);
  });

  it("validates afternoon duty accepts any 2 distinct active STAFF members (e.g. 2 technicians or 2 doctors or 1+1)", () => {
    // 2 Techs in afternoon is valid
    const resAfternoonTechs = validateRosterRequirements("WEEKDAY_AFTERNOON", [mockStaff[2], mockStaff[3]]);
    expect(resAfternoonTechs.valid).toBe(true);

    // 2 Doctors in afternoon is valid
    const resAfternoonDocs = validateRosterRequirements("WEEKDAY_AFTERNOON", [mockStaff[0], mockStaff[1]]);
    expect(resAfternoonDocs.valid).toBe(true);

    // 1 Doc + 1 Tech in afternoon is valid
    const resAfternoonMixed = validateRosterRequirements("WEEKDAY_AFTERNOON", [mockStaff[0], mockStaff[2]]);
    expect(resAfternoonMixed.valid).toBe(true);

    // Duplicate not allowed
    const resAfternoonDup = validateRosterRequirements("WEEKDAY_AFTERNOON", [mockStaff[2], mockStaff[2]]);
    expect(resAfternoonDup.valid).toBe(false);
    expect(resAfternoonDup.error).toMatch(/khác nhau/i);
  });

  it("rejects non-STAFF or inactive users in roster validation", () => {
    const resTest = validateRosterRequirements("WEEKDAY_LUNCH", [mockStaff[5], mockStaff[2]]);
    expect(resTest.valid).toBe(false);
    expect(resTest.error).toMatch(/TEST.*SYSTEM.*không được phân công/i);

    const resInactive = validateRosterRequirements("WEEKDAY_AFTERNOON", [mockStaff[0], mockStaff[6]]);
    expect(resInactive.valid).toBe(false);
    expect(resInactive.error).toMatch(/hoạt động/i);
  });
});
