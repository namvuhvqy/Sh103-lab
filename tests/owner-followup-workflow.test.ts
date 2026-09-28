import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Owner follow-up workflow contracts", () => {
  it("embeds BM.06 SHIFT_1..SHIFT_4 data entry in /equipment without routing users to /bm06", () => {
    const equipment = read("src/app/equipment/page.tsx");
    expect(equipment).toMatch(/ShiftRegisterForm/);
    expect(equipment).toMatch(/SHIFT_DEFINITIONS/);
    expect(equipment).toMatch(/getBm06ByDateShift/);
    expect(equipment).not.toMatch(/href=\{`\/bm06/);
    expect(equipment).not.toMatch(/Nhật ký trang thiết bị \(\$\{data\.shift\.label\}\)/);
  });

  it("home page removes the main-functions module grid to leave room for stream notifications", () => {
    const home = read("src/app/page.tsx");
    expect(home).not.toContain("Chức năng chính");
    expect(home).not.toContain("const modules = [");
  });

  it("/tasks is not a business screen and legacy links are not exposed from primary navigation", () => {
    expect(read("src/app/tasks/page.tsx")).toMatch(/redirect\("\/quick-duty"\)/);
    expect(read("src/components/shell/DesktopSidebar.tsx")).not.toContain('href: "/tasks"');
    expect(read("src/app/page.tsx")).not.toContain('href="/tasks"');
  });

  it("temperature page keeps legacy chart/list UI, hides only overview tab, and entry requires the input button", () => {
    const dashboard = read("src/components/forms/TemperatureLabDashboard.tsx");
    const page = read("src/app/temperature/page.tsx");
    expect(page).toMatch(/chartPoints/);
    expect(dashboard).toMatch(/QCTrendChart/);
    expect(dashboard).toMatch(/Nhập số liệu/);
    expect(dashboard).not.toMatch(/>\s*Tổng quan\s*</);
    expect(dashboard).not.toMatch(/handleInlineCellChange/);
    expect(dashboard).not.toMatch(/onBlur=\{\(e\) => handleInlineCellChange/);
  });

  it("admin users surface exposes create and delete account capabilities", () => {
    const users = read("src/app/admin/users/page.tsx");
    const postApi = read("src/app/api/admin/staff/route.ts");
    const detailApi = read("src/app/api/admin/staff/[userId]/route.ts");
    expect(postApi).toMatch(/createUser/);
    expect(detailApi).toMatch(/export async function DELETE/);
    expect(users).toMatch(/Tạo tài khoản|Thêm tài khoản/);
    expect(users).toMatch(/Xóa tài khoản|xóa vĩnh viễn|DELETE/);
  });
});
