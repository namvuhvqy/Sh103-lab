import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = (path: string) => readFileSync(join(root, path), "utf8");

describe("shared holiday roster for Quick Duty and Decontamination", () => {
  it("maps weekend/holiday work sessions to HOLIDAY_24H instead of per-shift weekday rosters", () => {
    const context = src("src/lib/work-session/server-context.ts");
    expect(context).toContain("resolveDutyKindForDateSlot");
    expect(context).toContain("HOLIDAY_24H");
    expect(context).toContain("isHolidayOrWeekendForDate");
  });

  it("uses the same roster card and data source on /decontamination as /quick-duty", () => {
    const deconPage = src("src/app/decontamination/page.tsx");
    const quickDuty = src("src/app/quick-duty/page.tsx");
    expect(deconPage).toContain("getWorkSessionData");
    expect(deconPage).toContain("WorkSessionRosterCard");
    expect(quickDuty).toContain("getWorkSessionData");
    expect(quickDuty).toContain("WorkSessionView");
    expect(deconPage).not.toContain("save_duty_roster");
  });

  it("holiday roster picker requires exactly one doctor-class user and one technician from eligible STAFF, with no duplicate/free-text", () => {
    const editor = src("src/components/roster/RosterShiftEditor.tsx");
    const domain = src("src/lib/roster/domain.ts");
    expect(editor).toContain("secondPositionStaff");
    expect(editor).toContain("firstMemberNeedsDoctor");
    expect(editor).toContain("firstMemberNeedsTechnician");
    expect(editor).toContain("<select");
    expect(editor).not.toMatch(/<input[^>]+name=.*member/i);
    expect(domain).toContain("HOLIDAY_24H");
    expect(domain).toContain("staffCount: 2");
    expect(domain).toContain("account_kind === \"STAFF\"");
    expect(domain).toContain("m1.user_id === m2.user_id");
    expect(domain).toContain("hasDoctor");
    expect(domain).toContain("hasTechnician");
  });

  it("server RPC resolves HOLIDAY_24H for all shifts on weekend/holiday dates so the pair is shared across 24h", () => {
    const migration = src("supabase/migrations/20260927120000_p6_unified_shift_roster_and_version_promotions.sql");
    expect(migration).toContain("HOLIDAY_24H");
    expect(migration).toContain("extract(dow from target_date)");
    expect(migration).toContain("then 'HOLIDAY_24H'");
  });
});
