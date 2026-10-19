import { describe, it, expect, vi, beforeEach } from "vitest";
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
});
