import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("technician-first unified workflow", () => {
  it("retires Calendar as a standalone workflow and routes legacy URLs to Work Session", () => {
    const calendar = source("src/app/calendar/page.tsx");
    const sidebar = source("src/components/shell/DesktopSidebar.tsx");
    const more = source("src/app/more/page.tsx");
    expect(calendar).toContain('redirect("/quick-duty")');
    expect(sidebar).not.toContain('href: "/calendar"');
    expect(more).not.toContain('href: "/calendar"');
  });

  it("keeps all four shift choices and self-roster entry inside Quick Duty", () => {
    const view = source("src/components/work-session/WorkSessionView.tsx");
    const roster = source("src/components/work-session/WorkSessionRosterCard.tsx");
    expect(view).toContain("Chọn ca khác");
    expect(view).toContain("SHIFT_4");
    expect(roster).not.toContain("Tôi nhận ca này");
    expect(roster).toContain("Chọn người cùng kíp");
    expect(roster).toContain("currentUserId");
  });

  it("marks a session as having an official record only after a fulfilled occurrence exists", () => {
    const context = source("src/lib/work-session/server-context.ts");
    expect(context).toContain("occurrences.some((o) => !!o.fulfilledByRecordId)");
  });

  it("keeps approval in one screen and permits incomplete periods with an explicit audit label", () => {
    const workflow = source("src/lib/forms/workflow.ts");
    const approvals = source("src/components/approvals/BatchApprovalSection.tsx");
    const migration = source("supabase/migrations/20260927143000_p6_simplify_technician_workflow.sql");
    expect(workflow).toContain('"OPEN", "RETURNED", "READY_FOR_REVIEW"');
    expect(approvals).toContain("Phê duyệt ngay");
    expect(migration).toContain("APPROVE_INCOMPLETE");
    expect(migration).not.toContain("Period has pending obligations");
  });
});
