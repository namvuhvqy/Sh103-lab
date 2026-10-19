import { describe, expect, it, vi } from "vitest";
import { ensureOperationalMonthSafe } from "@/lib/forms/ensure-month";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("ensureOperationalMonthSafe concurrency deduplication", () => {
  it("deduplicates concurrent callers in the same process into a single RPC execution", async () => {
    let rpcCalls = 0;

    const mockSupabase = {
      rpc: vi.fn().mockImplementation(async () => {
        rpcCalls++;
        // Simulate DB network delay
        await new Promise((res) => setTimeout(res, 50));
        return { error: null };
      }),
    } as unknown as SupabaseClient;

    // Call 5 times concurrently for a new month
    const targetDate = "2027-01-15";
    const callers = Array.from({ length: 5 }, () =>
      ensureOperationalMonthSafe(mockSupabase, targetDate)
    );

    await Promise.all(callers);

    // Verify only 1 RPC call was dispatched
    expect(rpcCalls).toBe(1);
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

    // Subsequent calls after completion should be instant cache hits without RPC
    await ensureOperationalMonthSafe(mockSupabase, targetDate);
    expect(rpcCalls).toBe(1);
  });
});
