import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const credentialScripts = [
  "scripts/run-e2e-suite.mjs",
  "scripts/test-export-and-features-e2e.mjs",
  "scripts/test-login.mjs",
  "scripts/test-auth-export.mjs",
  "scripts/setup-admin-user.mjs",
  "scripts/seed-staff-users.mjs",
];

describe("repository credential hygiene", () => {
  it("does not commit credential literals in operational scripts", () => {
    for (const path of credentialScripts) {
      const source = read(path);
      expect(source, path).not.toMatch(/(?:PASSWORD|targetPassword|passwordForSupabase)\s*=\s*["'][^"']+["']/);
      expect(source, path).not.toMatch(/password:\s*["'][^"']+["']/);
      expect(source, path).not.toContain("P3-Handover");
    }
  });

  it("requires E2E credentials from environment variables", () => {
    for (const path of ["scripts/run-e2e-suite.mjs", "scripts/test-export-and-features-e2e.mjs"]) {
      const source = read(path);
      expect(source).toContain("process.env.E2E_EMAIL");
      expect(source).toContain("process.env.E2E_PASSWORD");
    }
  });

  it("does not publish shared default passwords in the staff appendix", () => {
    for (const path of ["docs/PHU_LUC_DANH_MUC_TTB_NHAN_SU.md", "scripts/extract_phuluc.py"]) {
      const source = read(path);
      expect(source, path).not.toContain("Mật khẩu mặc định");
      expect(source, path).not.toMatch(/Mật khẩu khởi tạo:\*\*\s*`[^`]+`/);
      expect(source, path).toContain("Cấp riêng");
    }
  });
});
