import { describe, expect, it, vi } from "vitest";
import { resolveWorkSessionParams, getWorkSessionData } from "@/lib/work-session/server-context";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("Work Session Server Context", () => {
  it("resolves date and slot code server-side from query params or falls back to current Vietnam shift", () => {
    const fallback = resolveWorkSessionParams();
    expect(fallback.businessDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["SHIFT_1", "SHIFT_2", "SHIFT_3", "SHIFT_4", "HOLIDAY_24H"]).toContain(fallback.slotCode);

    const explicit = resolveWorkSessionParams({ date: "2026-09-27", slot: "SHIFT_2" });
    expect(explicit.businessDate).toBe("2026-09-27");
    expect(explicit.slotCode).toBe("SHIFT_2");
  });

  it("fetches work session context with occurrences, actual records, and duty roster via Supabase", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        business_date: "2026-09-27",
        slot_code: "SHIFT_1",
        roster: {
          roster_id: "roster-1",
          duty_kind: "WEEKDAY_LUNCH",
          business_date: "2026-09-27",
          members: [
            { user_id: "u-1", full_name: "BS. Nguyễn Văn A", business_role: "DOCTOR", member_order: 1 },
            { user_id: "u-2", full_name: "KTV. Trần Thị B", business_role: "TECHNICIAN", member_order: 2 }
          ]
        },
        user_id: "u-2",
        is_head: false,
        is_admin: false
      },
      error: null
    });

    const mockSupabase = {
      rpc: mockRpc,
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    };

    const sessionData = await getWorkSessionData(
      "2026-09-27",
      "SHIFT_1",
      mockSupabase as unknown as SupabaseClient
    );
    expect(mockRpc).toHaveBeenCalledWith("get_work_session_context", {
      target_date: "2026-09-27",
      target_slot_code: "SHIFT_1"
    });
    expect(sessionData.businessDate).toBe("2026-09-27");
    expect(sessionData.slotCode).toBe("SHIFT_1");
    expect(sessionData.roster?.members).toHaveLength(2);
    expect(sessionData.isOfficialRecordCreated).toBe(false);
  });
});
