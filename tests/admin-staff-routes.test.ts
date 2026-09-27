import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getStaffRoute, DELETE as deleteStaffRoute, POST as deactivateStaffRoute } from "@/app/api/admin/staff/[userId]/route";
import { POST as createStaffRoute } from "@/app/api/admin/staff/route";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { createUser: mockCreateUser, deleteUser: mockDeleteUser } },
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      }),
    },
  })),
}));

describe("Admin Staff REST API Endpoints", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("GET /api/admin/staff/[userId] returns profile and reference summary", async () => {
    mockRpc.mockImplementation((rpcName: string) => {
      if (rpcName === "current_is_admin") return Promise.resolve({ data: true, error: null });
      if (rpcName === "staff_reference_summary") {
        return Promise.resolve({
          data: {
            user_id: "u1",
            records_count: 5,
            approvals_count: 1,
            roster_assignments_count: 2,
            audit_events_count: 4,
            incidents_count: 0,
            can_hard_delete: false,
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: "u1",
              full_name: "Huỳnh Quang Thuận",
              business_role: "DEPARTMENT_HEAD",
              account_kind: "STAFF",
              source_order: 1,
              is_admin: true,
              active: true,
            },
            error: null,
          }),
        }),
      }),
    });

    const req = new Request("http://localhost/api/admin/staff/u1");
    const res = await getStaffRoute(req, { params: Promise.resolve({ userId: "u1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.full_name).toBe("Huỳnh Quang Thuận");
    expect(json.reference_summary.records_count).toBe(5);
  });

  it("POST /api/admin/staff returns 503 with honest explanation if SUPABASE_SERVICE_ROLE_KEY is absent", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    mockRpc.mockResolvedValue({ data: true, error: null }); // admin check

    const req = new Request("http://localhost/api/admin/staff", {
      method: "POST",
      body: JSON.stringify({
        email: "staff@hospital.vn",
        password: "password123",
        full_name: "BS Mới",
        business_role: "DOCTOR",
      }),
    });

    const res = await createStaffRoute(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
  });

  it("POST rolls back the Auth user when profile creation fails", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    mockRpc.mockImplementation((rpcName: string) =>
      rpcName === "current_is_admin"
        ? Promise.resolve({ data: true, error: null })
        : Promise.resolve({ data: null, error: { message: "profile failed" } })
    );
    mockCreateUser.mockResolvedValue({ data: { user: { id: "new-user" } }, error: null });
    mockDeleteUser.mockResolvedValue({ error: null });

    const req = new Request("http://localhost/api/admin/staff", {
      method: "POST",
      body: JSON.stringify({
        email: "staff@hospital.vn",
        password: "password123",
        full_name: "BS Mới",
        business_role: "DOCTOR",
      }),
    });
    const res = await createStaffRoute(req);

    expect(res.status).toBe(500);
    expect(mockDeleteUser).toHaveBeenCalledWith("new-user");
  });

  it("POST /api/admin/staff/[userId] refuses deactivation when Auth admin prerequisites are unavailable", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    mockRpc.mockResolvedValue({ data: true, error: null });

    const req = new Request("http://localhost/api/admin/staff/u1", {
      method: "POST",
      body: JSON.stringify({ action: "DEACTIVATE", reason: "Chuyển công tác" }),
    });
    const res = await deactivateStaffRoute(req, { params: Promise.resolve({ userId: "u1" }) });
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
    expect(mockRpc).not.toHaveBeenCalledWith("deactivate_staff_profile", expect.anything());
  });

  it("DELETE /api/admin/staff/[userId] blocks hard delete when references exist and recommends deactivation", async () => {
    mockRpc.mockImplementation((rpcName: string) => {
      if (rpcName === "current_is_admin") return Promise.resolve({ data: true, error: null });
      if (rpcName === "staff_reference_summary") {
        return Promise.resolve({
          data: {
            user_id: "u1",
            records_count: 5,
            approvals_count: 1,
            roster_assignments_count: 2,
            audit_events_count: 4,
            incidents_count: 0,
            can_hard_delete: false,
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const req = new Request("http://localhost/api/admin/staff/u1", { method: "DELETE" });
    const res = await deleteStaffRoute(req, { params: Promise.resolve({ userId: "u1" }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toMatch(/không thể xóa vĩnh viễn.*vô hiệu hóa/i);
  });
});
