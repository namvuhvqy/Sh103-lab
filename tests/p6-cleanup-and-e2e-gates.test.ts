import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P6 cleanup/simplification gate", () => {
  it("retires standalone BM.06 entry routes into /equipment legacy redirects", () => {
    expect(read("src/app/bm06/page.tsx")).toMatch(/redirect\("\/equipment#bm06-entry"\)/);
    expect(read("src/app/bm06/[occurrenceId]/page.tsx")).toMatch(/redirect\("\/equipment#bm06-entry"\)/);
  });

  it("primary navigation and task contracts do not route technicians to legacy /bm06", () => {
    expect(read("src/components/shell/DesktopSidebar.tsx")).not.toContain('href: "/bm06"');
    expect(read("src/app/more/page.tsx")).not.toContain('href="/bm06"');
    expect(read("tests/tasks-unified-flow.test.ts")).not.toContain("/bm06");
  });
});

describe("P6 mutation state and E2E evidence gates", () => {
  it("ShiftRegisterForm exposes Draft/Saving/Saved/Error/Completed state labels", () => {
    const form = read("src/components/forms/ShiftRegisterForm.tsx");
    expect(form).toMatch(/Draft|Bản nháp|Lưu nháp/);
    expect(form).toMatch(/Saving|Đang lưu/);
    expect(form).toMatch(/Saved|Đã lưu/);
    expect(form).toMatch(/Error|Lỗi/);
    expect(form).toMatch(/Completed|Hoàn tất/);
  });

  it("BM.06 save redirects preserve date and shift filters for refresh/read-back on equipment", () => {
    const route = read("src/app/api/forms/bm06/route.ts");
    expect(route).toMatch(/searchParams\.set\("date"/);
    expect(route).toMatch(/searchParams\.set\("shift"/);
    expect(route).toMatch(/refererUrl\?\.searchParams\.get\("date"\)/);
    expect(route).toMatch(/refererUrl\?\.searchParams\.get\("shift"\)/);
  });

  it("P6 E2E plan covers Home to quick-duty roster, save, refresh, state, and export", () => {
    const docs = read("docs/07_UNIFIED_SHIFT_ENTRY_OWNER_DECISIONS_FINAL.md") + read("docs/04_IMPLEMENTATION_PLAN_FINAL.md");
    expect(docs).toMatch(/Home → Phiên làm việc/);
    expect(docs).toMatch(/roster/);
    expect(docs).toMatch(/save → refresh → trạng thái đúng → export đúng/);
    expect(docs).toMatch(/BEFORE/);
    expect(docs).toMatch(/AFTER/);
  });
});
