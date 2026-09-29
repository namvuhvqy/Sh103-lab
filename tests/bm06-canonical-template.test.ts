import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BM06_CANONICAL_TEMPLATE_PATH, BM06_CANONICAL_TEMPLATE_SHA256, BM06_FINAL_SHIFT_WINDOWS, BM06_TEMPLATE_DEVICE_COUNT, BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";

const root = resolve(__dirname, "..");

describe("BM06 Owner-approved canonical XLSX template", () => {
  it("uses the no-cover Owner-approved workbook byte-for-byte", () => {
    const bytes = readFileSync(resolve(root, BM06_CANONICAL_TEMPLATE_PATH));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(BM06_CANONICAL_TEMPLATE_SHA256);
    expect(BM06_CANONICAL_TEMPLATE_PATH).toContain("no_cover_owner_approved.xlsx");
  });

  it("contains exactly 25 horizontal device columns across source pages", () => {
    expect(BM06_TEMPLATE_DEVICE_COUNT).toBe(25);
    expect(BM06_TEMPLATE_PAGES.map((page) => page.devices.length)).toEqual([8, 9, 8]);
    expect(BM06_TEMPLATE_PAGES.flatMap((page) => page.devices.map((device) => device.order))).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
  });

  it("uses the current final 4 shift windows from the canonical workbook", () => {
    expect(BM06_FINAL_SHIFT_WINDOWS.map((shift) => shift.time)).toEqual(["07:00–11:30", "11:30–13:30", "13:30–16:30", "16:30–07:00 hôm sau"]);
  });
});
