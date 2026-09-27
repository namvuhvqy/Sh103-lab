import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Tasks page & TaskList unified workflow contracts", () => {
  it("TasksPage contains prominent CTA directing to unified Quick Duty work session", () => {
    const pageSrc = fs.readFileSync(path.resolve(process.cwd(), "src/app/tasks/page.tsx"), "utf8");
    expect(pageSrc).toMatch(/\/quick-duty/);
    expect(pageSrc).toMatch(/Phiên làm việc|Nhập nhanh/);
  });

  it("TaskList provides unified work session links and clean task action routing", () => {
    const listSrc = fs.readFileSync(path.resolve(process.cwd(), "src/components/forms/TaskList.tsx"), "utf8");
    expect(listSrc).not.toContain('"Nhập ngay"');
    expect(listSrc).toMatch(/\/quick-duty|\/temperature|\/bm06|\/maintenance/);
  });
});
