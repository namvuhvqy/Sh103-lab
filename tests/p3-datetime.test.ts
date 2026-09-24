import { describe, expect, it } from "vitest";
import { vietnamLocalDateTimeToIso } from "@/lib/forms/datetime";

describe("Vietnam business datetime", () => {
  it("interprets datetime-local values as Asia/Ho_Chi_Minh independent of server timezone", () => {
    expect(vietnamLocalDateTimeToIso("2026-09-25T02:00")).toBe("2026-09-24T19:00:00.000Z");
  });

  it("rejects malformed datetime-local values", () => {
    expect(() => vietnamLocalDateTimeToIso("2026-09-25")).toThrow("Ngày giờ không hợp lệ");
  });
});