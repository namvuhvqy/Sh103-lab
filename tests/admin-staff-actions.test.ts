import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchStaffReferenceSummary,
  updateStaffProfileAndScopesAction,
  deactivateStaffProfileAction,
  checkAuthAdminPrerequisites,
} from "@/lib/admin/staff-actions";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockUpdateUserById = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { updateUserById: mockUpdateUserById, signOut: mockSignOut } },
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

describe("Admin Staff Actions & RPC Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    };
    mockUpdateUserById.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("fetchStaffReferenceSummary calls staff_reference_summary RPC", async () => {
    mockRpc.mockResolvedValue({
      data: {
        user_id: "u1",
        records_count: 5,
        approvals_count: 0,
        roster_assignments_count: 2,
        audit_events_count: 1,
        incidents_count: 0,
        can_hard_delete: false,
      },
      error: null,
    });

    const summary = await fetchStaffReferenceSummary("u1");
    expect(mockRpc).toHaveBeenCalledWith("staff_reference_summary", {
      target_user_id: "u1",
    });
    expect(summary.can_hard_delete).toBe(false);
    expect(summary.records_count).toBe(5);
  });

  it("updateStaffProfileAndScopesAction invokes set_staff_profile_and_scopes RPC", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await updateStaffProfileAndScopesAction({
      userId: "u1",
      data: {
        full_name: "Huỳnh Quang Thuận",
        business_role: "DEPARTMENT_HEAD",
        account_kind: "STAFF",
        is_admin: true,
        source_order: 1,
        form_template_ids: ["f1"],
        location_ids: ["l1"],
        asset_ids: ["a1"],
      },
    });

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("set_staff_profile_and_scopes", {
      target_user_id: "u1",
      target_full_name: "Huỳnh Quang Thuận",
      target_business_role: "DEPARTMENT_HEAD",
      target_is_admin: true,
      target_account_kind: "STAFF",
      target_source_order: 1,
      target_form_template_ids: ["f1"],
      target_location_ids: ["l1"],
      target_asset_ids: ["a1"],
    });
  });

  it("deactivateStaffProfileAction invokes deactivate_staff_profile RPC with reason", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await deactivateStaffProfileAction({
      userId: "u1",
      reason: "Nhân sự chuyển công tác",
    });

    expect(result.success).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith("u1", { ban_duration: "876000h" });
    expect(mockRpc).toHaveBeenCalledWith("deactivate_staff_profile", {
      target_user_id: "u1",
      target_reason: "Nhân sự chuyển công tác",
    });
    expect(mockSignOut).toHaveBeenCalledWith("u1", "global");
  });

  it("deactivateStaffProfileAction fails closed before database mutation without service-role prerequisites", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const result = await deactivateStaffProfileAction({ userId: "u1", reason: "Chuyển công tác" });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("checkAuthAdminPrerequisites verifies SUPABASE_SERVICE_ROLE_KEY existence securely without exposing it to client", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    const prereq = checkAuthAdminPrerequisites();
    expect(prereq.available).toBe(true);
    expect(prereq.reason).toBeUndefined();

    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const prereqMissing = checkAuthAdminPrerequisites();
    expect(prereqMissing.available).toBe(false);
    expect(prereqMissing.reason).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
  });
});
