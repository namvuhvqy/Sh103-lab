import { describe, expect, it } from "vitest";
import { summarizeAreaProgress } from "@/lib/forms/area-progress";

const locations = [
  { id: "l1", code: "SINH_HOA", name: "Sinh hóa", sort_order: 1 },
  { id: "l2", code: "MIEN_DICH", name: "Miễn dịch", sort_order: 2 },
  { id: "l3", code: "NHAN_BENH_PHAM", name: "Nhận bệnh phẩm", sort_order: 3 },
];
const assets = [
  { id: "a1", location_id: "l1" },
  { id: "a2", location_id: "l1" },
  { id: "a3", location_id: "l2" },
];

describe("P3 area shift progress", () => {
  it("aggregates current BM.06 statuses by asset location", () => {
    const result = summarizeAreaProgress(locations, assets, new Set(["a1", "a3"]));
    expect(result).toEqual([
      expect.objectContaining({ code: "SINH_HOA", deviceCount: 2, total: 2, completed: 1 }),
      expect.objectContaining({ code: "MIEN_DICH", deviceCount: 1, total: 1, completed: 1 }),
      expect.objectContaining({ code: "NHAN_BENH_PHAM", deviceCount: 0, total: 0, completed: 0 }),
    ]);
  });

  it("ignores status ids outside the visible area asset snapshot", () => {
    const [area] = summarizeAreaProgress(locations.slice(0, 1), assets.slice(0, 2), new Set(["unknown"]));
    expect(area.completed).toBe(0);
  });
});
