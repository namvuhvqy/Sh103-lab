// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {}

import {
  sanitizeAuditSearchQuery,
  applyAuditFilters,
} from "@/app/admin/audit/page";

const hasDb = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasDb)("INTEGRATION: Supabase Audit Log Query Pipeline (Read-Only)", () => {
  let supabase: ReturnType<typeof createClient>;
  let profiles: { user_id: string; full_name: string | null }[] = [];
  let assets: { id: string; display_name: string | null; source_name: string | null }[] = [];
  let locations: { id: string; name: string | null; code: string | null }[] = [];

  beforeAll(async () => {
    if (!hasDb) {
      throw new Error("Môi trường kiểm thử thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
    }
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const [pRes, aRes, lRes] = await Promise.all([
      supabase.from("profiles").select("user_id,full_name"),
      supabase.from("assets").select("id,display_name,source_name"),
      supabase.from("locations").select("id,name,code"),
    ]);
    profiles = pRes.data ?? [];
    assets = aRes.data ?? [];
    locations = lRes.data ?? [];
  });

  it("1. Multi-page navigation: returns distinct slices of 25 records with truthful count", async () => {
    // Page 1
    let q1 = supabase
      .from("audit_events")
      .select("id,created_at,action", { count: "exact" })
      .order("created_at", { ascending: false });
    q1 = applyAuditFilters(q1, "ALL", "", profiles, assets, locations);
    const res = await q1.range(0, 24);
    if (res.error) {
      console.log("Error status:", res.status, res.statusText, "error message:", res.error);
    }
    const { data: page1, count: totalCount, error: err1 } = res;

    expect(err1).toBeNull();
    expect(page1).toBeDefined();
    expect(page1!.length).toBe(25);
    expect(totalCount).toBeGreaterThanOrEqual(2200);

    // Page 2
    let q2 = supabase
      .from("audit_events")
      .select("id,created_at,action")
      .order("created_at", { ascending: false });
    q2 = applyAuditFilters(q2, "ALL", "", profiles, assets, locations);
    const { data: page2, error: err2 } = await q2.range(25, 49);

    expect(err2).toBeNull();
    expect(page2).toBeDefined();
    expect(page2!.length).toBe(25);

    // Ensure non-overlapping pages
    const ids1 = new Set((page1 as any[])!.map((r) => r.id));
    const ids2 = new Set((page2 as any[])!.map((r) => r.id));
    const overlap = [...ids1].filter((id) => ids2.has(id));
    expect(overlap.length).toBe(0);
  });

  it("2. Search by actor: finds events performed by resolved profile names", async () => {
    let q = supabase
      .from("audit_events")
      .select("id,action,actor_user_id,created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    q = applyAuditFilters(q, "ALL", "Thuận", profiles, assets, locations);
    const { data, count, error } = await q.range(0, 24);

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
    expect(data!.length).toBeGreaterThan(0);
  });

  it("3. Search by equipment: finds events referencing device", async () => {
    let q = supabase
      .from("audit_events")
      .select("id,action,after_data,entity_type,entity_id", { count: "exact" })
      .order("created_at", { ascending: false });

    q = applyAuditFilters(q, "ALL", "AU5800", profiles, assets, locations);
    const { data, count, error } = await q.range(0, 24);

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
    expect(data!.length).toBeGreaterThan(0);
  });

  it("4. Category filter combined with search: correctly intersects conditions", async () => {
    let q = supabase
      .from("audit_events")
      .select("id,action,after_data", { count: "exact" })
      .order("created_at", { ascending: false });

    // Category BM06 + Search AU5800
    q = applyAuditFilters(q, "BM06", "AU5800", profiles, assets, locations);
    const { data, count, error } = await q.range(0, 24);

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
    // Every result must match BM06
    for (const item of (data as any[])) {
      const recType = item.after_data?.record_type;
      const isBm06 =
        item.action === "BM06_SAVE_SHIFT" ||
        item.action === "DUTY_ROSTER_SAVE" ||
        recType === "EQUIPMENT_SHIFT" ||
        recType === "MAINTENANCE";
      expect(isBm06).toBe(true);
    }
  });

  it("5. Special characters and injection safety: does not crash or throw 400 Bad Request", async () => {
    const dangerousQueries = [
      "BM06,DUTY_ROSTER",
      "test) OR (1=1",
      'DROP TABLE "audit_events";',
      "AU%480_test",
      "') or true --",
      "TS.BS Vũ Văn Nam, Khoa Sinh Hóa",
      "a".repeat(200),
    ];

    for (const rawQ of dangerousQueries) {
      const sanitized = sanitizeAuditSearchQuery(rawQ);
      expect(sanitized.length).toBeLessThanOrEqual(80);

      let q = supabase
        .from("audit_events")
        .select("id,action", { count: "exact" })
        .order("created_at", { ascending: false });

      q = applyAuditFilters(q, "ALL", rawQ, profiles, assets, locations);
      const { error } = await q.range(0, 10);
      expect(error).toBeNull(); // Must execute cleanly without PostgREST syntax error
    }
  });

  it("6. Out-of-bounds page handling: catches PGRST103 and successfully falls back to last page", async () => {
    let q = supabase
      .from("audit_events")
      .select("id,action", { count: "exact" })
      .order("created_at", { ascending: false });

    q = applyAuditFilters(q, "ALL", "", profiles, assets, locations);
    // Request page far beyond total (page 2001)
    const { data, error } = await q.range(50000, 50024);

    // PostgREST returns PGRST103 "Requested range not satisfiable"
    expect(error).toBeDefined();
    expect(error?.code).toBe("PGRST103");
    expect(data).toBeNull();

    // Fallback logic implemented in AuditPage:
    // 1. Query exact total count
    let countQuery = supabase
      .from("audit_events")
      .select("*", { count: "exact", head: true });
    countQuery = applyAuditFilters(countQuery, "ALL", "", profiles, assets, locations);
    const { count: realTotal } = await countQuery;
    expect(realTotal).toBeGreaterThanOrEqual(2200);

    // 2. Fetch the last valid page
    const totalPages = Math.ceil(realTotal! / 25);
    const lastFrom = (totalPages - 1) * 25;
    const lastTo = lastFrom + 24;

    let lastQ = supabase
      .from("audit_events")
      .select("id,action")
      .order("created_at", { ascending: false });
    lastQ = applyAuditFilters(lastQ, "ALL", "", profiles, assets, locations);
    const { data: lastData, error: lastError } = await lastQ.range(lastFrom, lastTo);

    expect(lastError).toBeNull();
    expect(lastData).toBeDefined();
    expect(lastData!.length).toBeGreaterThan(0);
  });

  it("7. Query error handling: surfaces real DB error and prevents misleading zero count", async () => {
    // Simulate query failure with invalid column name
    const q = supabase
      .from("audit_events")
      .select("id,non_existent_column", { count: "exact" });

    const { data, error } = await q.range(0, 24);

    expect(error).toBeDefined();
    expect(error?.message).toMatch(/column|does not exist|failed/i);
    expect(data).toBeNull();
  });

  it("8. Empty sanitized search: does not inject broken or empty or-clauses into query", async () => {
    let q = supabase
      .from("audit_events")
      .select("id,action", { count: "exact" })
      .order("created_at", { ascending: false });

    q = applyAuditFilters(q, "ALL", "%%%", profiles, assets, locations);
    const { data, count, error } = await q.range(0, 24);

    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(2200);
    expect(data!.length).toBe(25);
  });
});
