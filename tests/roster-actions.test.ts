import { describe, expect, it, vi, beforeEach } from "vitest";
import { saveDutyRosterAction, fetchActiveRosterForDate, fetchRosterStaffCandidates } from "@/lib/roster/actions";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

describe("Roster RPC & actions integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchRosterStaffCandidates queries only active profiles with account_kind=STAFF ordered by source_order", async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        { user_id: "u1", full_name: "Huỳnh Quang Thuận", business_role: "DEPARTMENT_HEAD", account_kind: "STAFF", source_order: 1, active: true },
        { user_id: "u2", full_name: "Lê Thanh Hà", business_role: "DOCTOR", account_kind: "STAFF", source_order: 2, active: true },
      ],
      error: null,
    });
    const mockEqAccountKind = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqActive = vi.fn().mockReturnValue({ eq: mockEqAccountKind });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqActive });
    mockFrom.mockReturnValue({ select: mockSelect });

    const candidates = await fetchRosterStaffCandidates();
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockSelect).toHaveBeenCalledWith("user_id, full_name, business_role, account_kind, source_order, active");
    expect(mockEqActive).toHaveBeenCalledWith("active", true);
    expect(mockEqAccountKind).toHaveBeenCalledWith("account_kind", "STAFF");
    expect(mockOrder).toHaveBeenCalledWith("source_order", { ascending: true, nullsFirst: false });
    expect(candidates).toHaveLength(2);
    expect(candidates[0].user_id).toBe("u1");
  });

  it("saveDutyRosterAction calls save_duty_roster RPC with date, duty_kind, user_ids and expected_lock", async () => {
    mockRpc.mockResolvedValue({ data: "new-roster-uuid", error: null });

    const result = await saveDutyRosterAction({
      businessDate: "2026-09-28",
      dutyKind: "WEEKDAY_LUNCH",
      userIds: ["u1", "u11"],
      expectedLock: 1,
    });

    expect(result.success).toBe(true);
    expect(result.rosterId).toBe("new-roster-uuid");
    expect(mockRpc).toHaveBeenCalledWith("save_duty_roster", {
      target_date: "2026-09-28",
      target_duty_kind: "WEEKDAY_LUNCH",
      target_user_ids: ["u1", "u11"],
      target_expected_lock: 1,
    });
  });

  it("saveDutyRosterAction returns error message when RPC fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Shift requires 1 Doctor/Head and 1 Technician" } });

    const result = await saveDutyRosterAction({
      businessDate: "2026-09-28",
      dutyKind: "WEEKDAY_LUNCH",
      userIds: ["u1", "u2"],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Shift requires 1 Doctor/Head and 1 Technician");
  });

  it("fetchActiveRosterForDate retrieves active duty_rosters with member profiles", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "r1",
                  business_date: "2026-09-28",
                  duty_kind: "WEEKDAY_LUNCH",
                  status: "ACTIVE",
                  revision_no: 1,
                  lock_version: 1,
                  duty_roster_members: [
                    { member_order: 1, profiles: { user_id: "u1", full_name: "Huỳnh Quang Thuận", business_role: "DEPARTMENT_HEAD", source_order: 1 } },
                    { member_order: 2, profiles: { user_id: "u11", full_name: "Nguyễn Văn Cường", business_role: "TECHNICIAN", source_order: 11 } },
                  ],
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    });

    const rosters = await fetchActiveRosterForDate("2026-09-28");
    expect(rosters).toHaveLength(1);
    expect(rosters[0].duty_kind).toBe("WEEKDAY_LUNCH");
  });
});
