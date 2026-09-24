import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const app = join(process.cwd(), "src/app");

describe("P3 navigation route contract", () => {
  it.each([
    ["more", "more/page.tsx"],
    ["record detail", "records/[recordId]/page.tsx"],
  ])("has a real page for %s links", (_label, relativePath) => {
    expect(existsSync(join(app, relativePath))).toBe(true);
  });
});
