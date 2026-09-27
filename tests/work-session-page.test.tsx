import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QuickDutyPage from "@/app/quick-duty/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/quick-duty",
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    rpc: vi.fn().mockResolvedValue({
      data: {
        business_date: "2026-09-27",
        slot_code: "SHIFT_1",
        roster: null,
        user_id: "user-test",
        is_head: false,
        is_admin: false,
      },
      error: null,
    }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));

describe("QuickDutyPage Orchestrator Integration", () => {
  it("renders server-resolved work session page successfully", async () => {
    const Component = await QuickDutyPage({
      searchParams: Promise.resolve({ date: "2026-09-27", slot: "SHIFT_1" }),
    });

    render(Component);

    expect(screen.getByText("Phiên hiện tại")).toBeInTheDocument();
    expect(screen.getByText("Phiên làm việc / Nhập nhanh")).toBeInTheDocument();
    expect(screen.getByText("Chưa tạo hồ sơ chính thức")).toBeInTheDocument();
  });
});
