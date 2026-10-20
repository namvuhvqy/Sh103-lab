import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { MaintenanceWorkspace } from "@/components/maintenance/MaintenanceWorkspace";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";
import type { MaintenanceWorkspaceData } from "@/lib/maintenance/queries";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/app/maintenance/actions", () => ({
  saveMaintenanceAction: vi.fn(),
}));

describe("HOTFIX P1: Maintenance 404 & Flow Integrity", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("1. Route & Home Page KPI Contract", () => {
    it("Home page KPI card for Bảo dưỡng points directly to /maintenance, not /quick-duty", () => {
      const homeSrc = fs.readFileSync(path.resolve(process.cwd(), "src/app/page.tsx"), "utf8");
      // Must not link Bảo dưỡng to /quick-duty
      expect(homeSrc).not.toMatch(/label="Bảo dưỡng"[\s\S]*?href="\/quick-duty"/);
      // Must link Bảo dưỡng to /maintenance
      expect(homeSrc).toMatch(/label="Bảo dưỡng"[\s\S]*?href="\/maintenance"/);
    });

    it("WorkSessionView BM.02 section card links to /maintenance?date=... and never produces /maintenance/", () => {
      const wsSrc = fs.readFileSync(path.resolve(process.cwd(), "src/components/work-session/WorkSessionView.tsx"), "utf8");
      expect(wsSrc).not.toMatch(/href:\s*`\/maintenance\/\${getOccurrencesForForm\("BM\.02\/QL\.TRTB\.01"\)\[0\]\?\.id \?\? ""}`/);
      expect(wsSrc).toMatch(/\/maintenance\?date=\${businessDate}/);
    });

    it("WorkSessionSectionCard guards against empty/broken trailing slash hrefs", () => {
      const cardSrc = fs.readFileSync(path.resolve(process.cwd(), "src/components/work-session/WorkSessionSectionCard.tsx"), "utf8");
      expect(cardSrc).toMatch(/safeHref/);
      expect(cardSrc).toMatch(/href !== "\/maintenance\/"/);
    });

    it("actions.ts redirects to /maintenance?saved=..., not /tasks?saved=maintenance", () => {
      const actionSrc = fs.readFileSync(path.resolve(process.cwd(), "src/app/maintenance/actions.ts"), "utf8");
      expect(actionSrc).not.toContain('"/tasks?saved=maintenance"');
      expect(actionSrc).toMatch(/\/maintenance\?saved=/);
    });
  });

  describe("2. MaintenanceWorkspace Hub - 0, 1, and Multiple Occurrences", () => {
    it("handles 0 occurrences gracefully with empty state and NO 404 or broken links", () => {
      const emptyData: MaintenanceWorkspaceData = {
        businessDate: "2026-10-20",
        items: [],
        counts: {
          total: 0,
          completed: 0,
          pending: 0,
          daily: 0,
          weekly: 0,
          monthly: 0,
        },
      };

      render(<MaintenanceWorkspace data={emptyData} />);

      expect(screen.getByText("Chưa có lịch bảo dưỡng cho ngày này")).toBeInTheDocument();
      expect(screen.getByText("0/0 máy đã bảo dưỡng")).toBeInTheDocument();
      expect(screen.queryByText("404")).toBeNull();
    });

    it("handles 1 occurrence correctly with asset name, cadence, and direct entry link", () => {
      const singleData: MaintenanceWorkspaceData = {
        businessDate: "2026-10-20",
        items: [
          {
            id: "occ-single-1",
            periodId: "p-1",
            periodStatus: "OPEN",
            assetId: "a-1",
            assetName: "Máy Sinh Hóa ARCHITECT-2",
            assetCode: "ARCH-2",
            locationName: "Khu Sinh Hóa",
            cadence: "DAILY",
            slotCode: "DAILY",
            status: "PENDING",
            businessDate: "2026-10-20",
            fulfilledByRecordId: null,
            record: null,
          },
        ],
        counts: {
          total: 1,
          completed: 0,
          pending: 1,
          daily: 1,
          weekly: 0,
          monthly: 0,
        },
      };

      render(<MaintenanceWorkspace data={singleData} />);

      expect(screen.getByText("Máy Sinh Hóa ARCHITECT-2")).toBeInTheDocument();
      expect(screen.getByText("Khu Sinh Hóa")).toBeInTheDocument();
      expect(screen.getByText("Chưa ghi")).toBeInTheDocument();
      expect(screen.getByText("Ghi nhận bảo dưỡng")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /Ghi nhận bảo dưỡng/ });
      expect(link).toHaveAttribute("href", "/maintenance/occ-single-1");
    });

    it("handles multiple occurrences across DAILY, WEEKLY, and MONTHLY with accurate filtering", () => {
      const multiData: MaintenanceWorkspaceData = {
        businessDate: "2026-10-20",
        items: [
          {
            id: "occ-d1",
            periodId: "p-1",
            periodStatus: "OPEN",
            assetId: "a-1",
            assetName: "Máy ARCHITECT-2",
            assetCode: "ARCH-2",
            cadence: "DAILY",
            slotCode: "DAILY",
            status: "COMPLETED",
            businessDate: "2026-10-20",
            fulfilledByRecordId: "rec-1",
            record: {
              id: "rec-1",
              performedAt: "2026-10-20T08:00:00Z",
              result: "PASS",
              note: "Vệ sinh kim hút tốt",
            },
          },
          {
            id: "occ-w1",
            periodId: "p-2",
            periodStatus: "OPEN",
            assetId: "a-2",
            assetName: "Máy Alinity c",
            assetCode: "ALIN-C",
            cadence: "WEEKLY",
            slotCode: "WEEKLY_ONCE",
            status: "PENDING",
            businessDate: null,
            fulfilledByRecordId: null,
            record: null,
          },
          {
            id: "occ-m1",
            periodId: "p-3",
            periodStatus: "OPEN",
            assetId: "a-3",
            assetName: "Máy Cobas E602",
            assetCode: "COB-602",
            cadence: "MONTHLY",
            slotCode: "MONTHLY_ONCE",
            status: "COMPLETED",
            businessDate: null,
            fulfilledByRecordId: "rec-3",
            record: {
              id: "rec-3",
              performedAt: "2026-10-05T09:00:00Z",
              result: "FAIL",
              note: "Cần thay cảm biến áp suất",
            },
          },
        ],
        counts: {
          total: 3,
          completed: 2,
          pending: 1,
          daily: 1,
          weekly: 1,
          monthly: 1,
        },
      };

      render(<MaintenanceWorkspace data={multiData} />);

      // All 3 displayed on default "Tất cả" tab
      expect(screen.getByText("Máy ARCHITECT-2")).toBeInTheDocument();
      expect(screen.getByText("Máy Alinity c")).toBeInTheDocument();
      expect(screen.getByText("Máy Cobas E602")).toBeInTheDocument();

      // Check results reflecting real Supabase data
      expect(screen.getByText("Đạt (PASS)")).toBeInTheDocument();
      expect(screen.getByText("Không đạt (FAIL)")).toBeInTheDocument();
      expect(screen.getByText("Chưa ghi")).toBeInTheDocument();

      // Click "Hằng ngày" tab
      const dailyTab = screen.getByRole("button", { name: "Hằng ngày (1)" });
      fireEvent.click(dailyTab);

      expect(screen.getByText("Máy ARCHITECT-2")).toBeInTheDocument();
      expect(screen.queryByText("Máy Alinity c")).toBeNull();
      expect(screen.queryByText("Máy Cobas E602")).toBeNull();

      // Click "Hằng tuần" tab
      const weeklyTab = screen.getByRole("button", { name: "Hằng tuần (1)" });
      fireEvent.click(weeklyTab);

      expect(screen.queryByText("Máy ARCHITECT-2")).toBeNull();
      expect(screen.getByText("Máy Alinity c")).toBeInTheDocument();
      expect(screen.queryByText("Máy Cobas E602")).toBeNull();
    });

    it("displays saved confirmation banner when savedId matches an occurrence", () => {
      const data: MaintenanceWorkspaceData = {
        businessDate: "2026-10-20",
        items: [
          {
            id: "occ-saved-1",
            periodId: "p-1",
            periodStatus: "OPEN",
            assetId: "a-1",
            assetName: "Máy ARCHITECT-2",
            assetCode: "ARCH-2",
            cadence: "DAILY",
            slotCode: "DAILY",
            status: "COMPLETED",
            businessDate: "2026-10-20",
            fulfilledByRecordId: "rec-1",
            record: {
              id: "rec-1",
              performedAt: "2026-10-20T08:00:00Z",
              result: "PASS",
              note: null,
            },
          },
        ],
        counts: {
          total: 1,
          completed: 1,
          pending: 0,
          daily: 1,
          weekly: 0,
          monthly: 0,
        },
      };

      render(<MaintenanceWorkspace data={data} savedId="occ-saved-1" />);

      expect(screen.getByText("Đã lưu kết quả bảo dưỡng thành công!")).toBeInTheDocument();
      expect(screen.getAllByText(/Máy ARCHITECT-2/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. MaintenanceForm Review & Edit with Real Supabase Data", () => {
    it("pre-fills existing completed record data when reviewing saved occurrence", () => {
      render(
        <MaintenanceForm
          occurrenceId="occ-edit-1"
          cadence="DAILY"
          assetName="Máy Ly Tâm Lạnh 320"
          initialRecord={{
            performedAt: "2026-10-20T08:30:00.000Z",
            result: "PASS",
            note: "Kiểm tra chốt nắp, buồng lạnh đạt 4°C",
            isCompleted: true,
          }}
        />
      );

      // Status badge indicates completed
      expect(screen.getByText(/Đã hoàn thành \(Đạt\)/)).toBeInTheDocument();

      // Form inputs pre-filled with real data
      const passRadio = screen.getByLabelText(/Đạt \(PASS\)/);
      expect((passRadio as HTMLInputElement).checked).toBe(true);

      const noteTextarea = screen.getByPlaceholderText(/Ghi chú các hạng mục/);
      expect((noteTextarea as HTMLTextAreaElement).value).toBe("Kiểm tra chốt nắp, buồng lạnh đạt 4°C");
    });

    it("allows editing existing record and changes status to dirty", () => {
      render(
        <MaintenanceForm
          occurrenceId="occ-edit-1"
          cadence="DAILY"
          assetName="Máy Ly Tâm Lạnh 320"
          initialRecord={{
            performedAt: "2026-10-20T08:30:00.000Z",
            result: "PASS",
            note: "Kiểm tra chốt nắp",
            isCompleted: true,
          }}
        />
      );

      const failRadio = screen.getByLabelText(/Không đạt \(FAIL\)/);
      fireEvent.click(failRadio);

      // Status changes to dirty
      expect(screen.getByText(/Chưa lưu: Có thay đổi chưa gửi/)).toBeInTheDocument();
      expect((failRadio as HTMLInputElement).checked).toBe(true);
    });
  });
});
