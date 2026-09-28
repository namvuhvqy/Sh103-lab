import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const src = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Owner final UX simplification contracts", () => {
  it("does not expose Tasks as a standalone workflow in navigation or CTAs", () => {
    const sidebar = src("src/components/shell/DesktopSidebar.tsx");
    const home = src("src/app/page.tsx");
    const dashboard = src("src/app/dashboard/page.tsx");
    const tasksPage = src("src/app/tasks/page.tsx");
    expect(sidebar).not.toContain('href: "/tasks"');
    expect(home).not.toContain('href: "/tasks"');
    expect(dashboard).not.toContain('href: "/tasks"');
    expect(tasksPage).toContain('redirect("/quick-duty")');
  });

  it("keeps maintenance inside the work session without linking through /tasks", () => {
    const workSession = src("src/components/work-session/WorkSessionView.tsx");
    expect(workSession).not.toContain("/tasks");
    expect(workSession).toContain("/maintenance/");
  });

  it("uses staff self-assignment language instead of Admin-only roster language", () => {
    const roster = src("src/components/work-session/WorkSessionRosterCard.tsx");
    expect(roster).not.toContain("Tôi nhận ca này");
    expect(roster).toContain("Chọn người cùng kíp");
    expect(roster).toMatch(/Tự nhận kíp|tự nhận kíp/);
    expect(roster).not.toContain("Bác sĩ, Trưởng khoa hoặc Admin có thể bấm nút");
  });

  it("temperature screen keeps chart/list UX, hides only the overview button, and lower point list is read-only", () => {
    const temp = src("src/components/forms/TemperatureLabDashboard.tsx");
    expect(temp).not.toMatch(/>\s*Tổng quan\s*</);
    expect(temp).toContain("QCTrendChart");
    expect(temp).toContain("Nhập số liệu");
    expect(temp).not.toContain("handleInlineCellChange");
    expect(temp).not.toContain("type=\"number\"");
    expect(temp).toContain("InlineTemperatureList");
  });
});
