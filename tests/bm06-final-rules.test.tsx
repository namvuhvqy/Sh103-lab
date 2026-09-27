import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShiftRegisterForm } from "@/components/forms/ShiftRegisterForm";
import fs from "node:fs";
import path from "node:path";

const mockAssets = Array.from({ length: 25 }, (_, index) => ({
  id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
  sourceOrder: index + 1,
  name: `Thiết bị ${index + 1}`,
  locationCode: index < 9 ? "SINH_HOA" : index < 17 ? "MIEN_DICH" : index < 21 ? "NUOC_TIEU" : "LY_TAM",
}));

describe("BM.06 v4.1 UI Contracts (ShiftRegisterForm)", () => {
  it("removes 16:40 and numeric usage editing from calendar and correction UI", () => {
    const calendar = fs.readFileSync(path.resolve(process.cwd(), "src/app/calendar/page.tsx"), "utf8");
    const correctionPage = fs.readFileSync(path.resolve(process.cwd(), "src/app/records/[recordId]/correction/page.tsx"), "utf8");
    const correctionAction = fs.readFileSync(path.resolve(process.cwd(), "src/app/records/[recordId]/correction/actions.ts"), "utf8");

    expect(calendar).not.toContain("16:40");
    expect(correctionPage).not.toMatch(/name="usage_(?:value|unit)"/);
    expect(correctionAction).not.toMatch(/["']usage_(?:value|unit)["']/);
  });
  it("has NO numeric usage input field, NO usage unit select, and NO default 4.5", () => {
    render(
      <ShiftRegisterForm
        occurrenceId="occ-bm06-1"
        assets={mockAssets}
        initialStatuses={{}}
        lockVersion={1}
      />
    );

    // Rule: Không có numeric usage input, không dùng usage_unit làm input và không gán mặc định 4.5
    expect(screen.queryByLabelText(/lượng sử dụng/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/4\.5/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("4.5")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/đơn vị tính/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /đơn vị tính/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/số giờ chạy thực tế/i)).not.toBeInTheDocument();
  });

  it("has NO bulk/all-BT or fill-remaining shortcut buttons", () => {
    render(
      <ShiftRegisterForm
        occurrenceId="occ-bm06-1"
        assets={mockAssets}
        initialStatuses={{}}
        lockVersion={1}
      />
    );

    // Rule: Tuyệt đối cấm các nút điền hàng loạt mù quáng như "Đặt tất cả = BT", "Điền còn lại = BT"
    expect(screen.queryByText(/đặt tất cả = bt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/điền còn lại = bt/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tất cả = bt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /còn lại = bt/i })).not.toBeInTheDocument();
  });

  it("retains per-machine BT/KSD/H status selectors and 25/25 finalize gate", () => {
    const allFilled = Object.fromEntries(mockAssets.map((a) => [a.id, "BT"]));
    const { rerender } = render(
      <ShiftRegisterForm
        occurrenceId="occ-bm06-1"
        assets={mockAssets}
        initialStatuses={{}}
        lockVersion={1}
      />
    );

    expect(screen.getAllByRole("group", { name: /trạng thái máy/i })).toHaveLength(25);

    const finalizeBtn = screen.getByRole("button", { name: /hoàn tất ca/i });
    expect(finalizeBtn).toBeDisabled();

    // Render with all 25 machines filled in initialStatuses
    rerender(
      <ShiftRegisterForm
        key="all-filled"
        occurrenceId="occ-bm06-1"
        assets={mockAssets}
        initialStatuses={allFilled}
        lockVersion={1}
      />
    );

    expect(screen.getByRole("button", { name: /hoàn tất ca/i })).not.toBeDisabled();
  });
});

describe("BM.06 v4.1 API & Source Scanning Contracts", () => {
  it("requires save path /api/forms/bm06 to send null usage compatibility and no FormData numeric input", () => {
    const routeFilePath = path.resolve(process.cwd(), "src/app/api/forms/bm06/route.ts");
    const routeContent = fs.readFileSync(routeFilePath, "utf-8");

    // The API route should not expect or read numeric usage input from FormData
    expect(routeContent).not.toMatch(/data\.get\(\s*["']usageValue["']\s*\)/);
    expect(routeContent).not.toMatch(/data\.get\(\s*["']usageUnit["']\s*\)/);

    // target_usage and target_unit passed to save_equipment_shift_draft should be null (for backwards compatibility)
    expect(routeContent).toMatch(/target_usage:\s*null/);
    expect(routeContent).toMatch(/target_unit:\s*null/);
  });
});
