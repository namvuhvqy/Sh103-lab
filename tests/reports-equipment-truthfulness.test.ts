import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..");
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("reports and equipment present only queried data", () => {
  it("reports has no fabricated zero-state counts, ratios, or digital-signature claims", () => {
    const page = source("src/app/reports/page.tsx");
    expect(page).not.toMatch(/rows\.length\s*>\s*0\s*\?\s*rows\.length\s*:\s*124/);
    expect(page).not.toMatch(/approved\.length\s*>\s*0\s*\?\s*approved\.length\s*:\s*116/);
    expect(page).not.toMatch(/ready\.length\s*>\s*0\s*\?\s*ready\.length\s*:\s*5/);
    expect(page).not.toMatch(/open\.length\s*>\s*0\s*\?\s*open\.length\s*:\s*3/);
    expect(page).not.toContain("Đã ký số");
    expect(page).not.toMatch(/width:\s*"(?:93\.5|4\.0|2\.5)%"/);
    expect(page).not.toMatch(/pct:\s*(?:92|88|95|90|80)/);
    expect(page).not.toMatch(/count:\s*(?:42|35|28|19)/);
  });

  it("equipment does not synthesize four shift pills from one current status", () => {
    const page = source("src/app/equipment/page.tsx");
    expect(page).not.toMatch(/\{\[1,\s*2,\s*3,\s*4\]\.map/);
    expect(page).not.toMatch(/isBT\s*\|\|\s*\(c\s*<=\s*2/);
    expect(page).not.toMatch(/isH\s*\?\s*"2\/4"\s*:\s*isBT\s*\?\s*"4\/4"/);
  });

  it("general tasks is a permanent server redirect to temperature", () => {
    const page = source("src/app/general-tasks/page.tsx");
    expect(page).toMatch(/permanentRedirect\(["']\/temperature["']\)/);
    expect(page).not.toContain("TaskList");
  });

  it("allows long report labels to shrink instead of widening the mobile viewport", () => {
    const page = source("src/app/reports/page.tsx");
    expect(page).toContain('className="min-w-0 flex flex-1 items-center gap-2"');
    expect(page).toContain('className="min-w-0 truncate text-slate-500"');
  });
});
