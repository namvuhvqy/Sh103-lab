import { describe, it, expect } from "vitest";

function sanitizeAuditSearchQuery(raw: string): string {
  if (!raw) return "";
  let q = raw.trim().slice(0, 80);
  q = q.replace(/[,()"'%_\\;]/g, " ").replace(/\s+/g, " ").trim();
  return q;
}

describe("sanitizeAuditSearchQuery edge cases", () => {
  it("preserves normal text and Vietnamese diacritics", () => {
    expect(sanitizeAuditSearchQuery("TS.BS Vũ Văn Nam")).toBe("TS.BS Vũ Văn Nam");
    expect(sanitizeAuditSearchQuery("Huỳnh Quang Thuận")).toBe("Huỳnh Quang Thuận");
    expect(sanitizeAuditSearchQuery("Bảo dưỡng máy AU480")).toBe("Bảo dưỡng máy AU480");
  });

  it("strips PostgREST delimiters: commas, parentheses, semicolons", () => {
    expect(sanitizeAuditSearchQuery("BM06,DUTY_ROSTER")).toBe("BM06 DUTY ROSTER");
    expect(sanitizeAuditSearchQuery("test) or (1=1")).toBe("test or 1=1");
    expect(sanitizeAuditSearchQuery("SELECT *; DROP TABLE")).toBe("SELECT * DROP TABLE");
  });

  it("strips SQL LIKE wildcards and quotes", () => {
    expect(sanitizeAuditSearchQuery("AU%480_test")).toBe("AU 480 test");
    expect(sanitizeAuditSearchQuery("' OR '1'='1")).toBe("OR 1 = 1");
    expect(sanitizeAuditSearchQuery('"test"')).toBe("test");
  });

  it("clamps query length to 80 characters max", () => {
    const longQuery = "a".repeat(200);
    expect(sanitizeAuditSearchQuery(longQuery).length).toBe(80);
  });

  it("handles empty or purely symbol inputs gracefully", () => {
    expect(sanitizeAuditSearchQuery("")).toBe("");
    expect(sanitizeAuditSearchQuery("    ")).toBe("");
    expect(sanitizeAuditSearchQuery(",,,,,%%%((()))")).toBe("");
  });
});
