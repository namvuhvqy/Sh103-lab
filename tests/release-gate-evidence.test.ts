import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Release Gate & 4-Level Test Standards Verification", () => {
  it("Gate 1: .github/workflows/ci.yml must trigger on master branch", () => {
    const ciPath = path.resolve(process.cwd(), ".github/workflows/ci.yml");
    expect(fs.existsSync(ciPath)).toBe(true);

    const ciContent = fs.readFileSync(ciPath, "utf8");
    // Verify push branches include master
    expect(ciContent).toMatch(/push:[\s\S]*?branches:[\s\S]*?"master"/);
    // Verify pull_request branches include master
    expect(ciContent).toMatch(/pull_request:[\s\S]*?branches:[\s\S]*?"master"/);
    // Verify release evidence step is configured
    expect(ciContent).toContain("pnpm run release:evidence");
    expect(ciContent).toContain(".release-evidence.json");
  });

  it("Gate 2: package.json must define 4-level test scripts and release:evidence", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    expect(pkg.scripts["test:l1"]).toBeDefined();
    expect(pkg.scripts["test:l2"]).toBeDefined();
    expect(pkg.scripts["test:l3"]).toBeDefined();
    expect(pkg.scripts["release:evidence"]).toBeDefined();
    expect(pkg.scripts["release:gate"]).toBeDefined();
  });

  it("Gate 3: Script scripts/generate-release-evidence.mts must exist and define proper schema", () => {
    const scriptPath = path.resolve(process.cwd(), "scripts/generate-release-evidence.mts");
    expect(fs.existsSync(scriptPath)).toBe(true);

    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    expect(scriptContent).toContain("schemaVersion");
    expect(scriptContent).toContain("ISO 15189:2022");
    expect(scriptContent).toContain("L1");
    expect(scriptContent).toContain("L2");
    expect(scriptContent).toContain("L3");
    expect(scriptContent).toContain("L4");
    expect(scriptContent).toContain(".release-evidence.json");
  });

  it("Gate 4: BM.06 route and measurements route must log entry errors to audit events", () => {
    const bm06RoutePath = path.resolve(process.cwd(), "src/app/api/forms/bm06/route.ts");
    const bm06Content = fs.readFileSync(bm06RoutePath, "utf8");
    expect(bm06Content).toContain("BM06_ENTRY_ERROR");

    const measurementRoutePath = path.resolve(process.cwd(), "src/app/api/measurements/quick-save/route.ts");
    const measurementContent = fs.readFileSync(measurementRoutePath, "utf8");
    expect(measurementContent).toContain("MEASUREMENT_ENTRY_ERROR");
  });

  it("Gate 5: Admin audit page must categorize and display entry errors", () => {
    const auditPagePath = path.resolve(process.cwd(), "src/app/admin/audit/page.tsx");
    const auditContent = fs.readFileSync(auditPagePath, "utf8");
    expect(auditContent).toContain("BM06_ENTRY_ERROR");
    expect(auditContent).toContain("MEASUREMENT_ENTRY_ERROR");
    expect(auditContent).toContain("Lỗi nhập liệu");
  });
});
