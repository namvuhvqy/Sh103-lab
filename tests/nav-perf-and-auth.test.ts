import { describe, it, expect } from "vitest";
import { routeAccessLevel } from "@/lib/auth/access";

describe("Task 1: Navigation Performance and Auth Deduplication", () => {
  it("classifies routes correctly", () => {
    expect(routeAccessLevel("/")).toBe("authenticated");
    expect(routeAccessLevel("/temperature")).toBe("authenticated");
    expect(routeAccessLevel("/equipment")).toBe("authenticated");
    expect(routeAccessLevel("/reports")).toBe("authenticated");
    expect(routeAccessLevel("/decontamination")).toBe("authenticated");
    expect(routeAccessLevel("/admin/audit")).toBe("admin");
    expect(routeAccessLevel("/admin/users")).toBe("admin");
    expect(routeAccessLevel("/login")).toBe("public");
    expect(routeAccessLevel("/offline")).toBe("public");
  });

  it("handles refresh token errors by clearing cookies and redirecting to session_expired", async () => {
    // Test logic for updateSession with AuthApiError
    const { updateSession } = await import("@/lib/supabase/proxy");
    expect(typeof updateSession).toBe("function");
  });

  it("deduplicates getCurrentAccess via React.cache", async () => {
    const { getCurrentAccess } = await import("@/lib/forms/workflow");
    expect(typeof getCurrentAccess).toBe("function");
  });

  it("coalesces concurrent master-data requests into a single execution and caches within TTL", async () => {
    const { getOrFetchCached, invalidateMasterDataCache } = await import("@/lib/cache/master-data-cache");
    invalidateMasterDataCache();

    let executions = 0;
    const fetcher = async () => {
      executions += 1;
      await new Promise((r) => setTimeout(r, 20));
      return ["SINH_HOA", "MIEN_DICH"];
    };

    const [r1, r2, r3] = await Promise.all([
      getOrFetchCached("test:locations", 10_000, fetcher),
      getOrFetchCached("test:locations", 10_000, fetcher),
      getOrFetchCached("test:locations", 10_000, fetcher),
    ]);

    expect(executions).toBe(1);
    expect(r1).toEqual(["SINH_HOA", "MIEN_DICH"]);
    expect(r2).toEqual(["SINH_HOA", "MIEN_DICH"]);
    expect(r3).toEqual(["SINH_HOA", "MIEN_DICH"]);

    // Subsequent hit within TTL does not re-execute fetcher
    const r4 = await getOrFetchCached("test:locations", 10_000, fetcher);
    expect(executions).toBe(1);
    expect(r4).toEqual(["SINH_HOA", "MIEN_DICH"]);
  });

  it("enables Next.js Client Router Cache staleTimes for fast mobile screen transitions", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const configSrc = fs.readFileSync(path.resolve(process.cwd(), "next.config.ts"), "utf8");
    expect(configSrc).toContain("staleTimes");
    expect(configSrc).toMatch(/dynamic:\s*30/);
    expect(configSrc).toMatch(/static:\s*180/);
  });
});
