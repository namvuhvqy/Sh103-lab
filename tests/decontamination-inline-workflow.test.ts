import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = (path: string) => readFileSync(join(root, path), "utf8");

const BM01_KNBM_AREAS = ["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"];

describe("/decontamination inline BM.01_KNBM workflow", () => {
  it("renders all BM.01_KNBM areas inline on /decontamination without linking out to per-area entry routes", () => {
    const page = src("src/app/decontamination/page.tsx");
    expect(page).toContain("getDecontaminationWorkspace");
    expect(page).toContain("DecontaminationWorkspace");
    expect(page).not.toContain("href={`/areas/${area.code}/knbm`}");
    expect(page).not.toContain("/areas/${area.code}/knbm");
  });

  it("loads the exact five applicable BM.01_KNBM work areas with period, occurrence and saved values for refresh read-back", () => {
    const queries = src("src/lib/p5/operational-queries.ts");
    expect(queries).toContain("getDecontaminationWorkspace");
    for (const areaCode of BM01_KNBM_AREAS) expect(queries).toContain(areaCode);
    expect(queries).toContain("records");
    expect(queries).toContain("decontamination_details");
    expect(queries).toContain("fulfilled_by_record_id");
    expect(queries).toContain("periodId");
  });

  it("allows direct per-area Daily / Weekly / Spill entry on the same screen", () => {
    const form = src("src/components/forms/DecontaminationForm.tsx");
    expect(form).toContain("Daily");
    expect(form).toContain("Weekly");
    expect(form).toContain("Spill");
    expect(form).toContain("daily");
    expect(form).toContain("weekly");
    expect(form).toContain("spill");
    expect(form).toContain("submitLabel");
    expect(form).toContain("defaultValues");
  });

  it("redirects saves back to /decontamination with date/shift context so refresh shows saved completion", () => {
    const action = src("src/app/areas/[areaCode]/knbm/actions.ts");
    expect(action).toContain("returnTo");
    expect(action).toContain("/decontamination");
    expect(action).toContain("date=");
    expect(action).toContain("shift=");
    expect(action).toContain("#knbm-");
  });

  it("keeps legacy per-area KNBM URLs as backward-compatible, not the primary workflow", () => {
    const legacy = src("src/app/areas/[areaCode]/knbm/page.tsx");
    expect(legacy).toContain("redirect(");
    expect(legacy).toContain("/decontamination");
  });
});
