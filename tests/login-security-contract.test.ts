import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = () => readFileSync(resolve(process.cwd(), "src/app/login/actions.ts"), "utf8");

describe("login security contract", () => {
  it("never tries fallback/default passwords after a failed login", () => {
    const code = source();
    expect(code).not.toContain("altPass");
    expect(code).not.toContain('"admin123"');
    expect(code).not.toMatch(/for\s*\(const .*Pass/);
  });

  it("supports username aliases without bypassing password verification", () => {
    const code = source();
    expect(code).toContain('@sh103.hospital');
    expect(code).toContain("signInWithPassword");
  });
});
