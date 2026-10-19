import type { SupabaseClient } from "@supabase/supabase-js";

// Cache for months that have already been initialized in the current server instance.
const initializedMonths = new Set<string>();

// In-flight promise tracker to deduplicate concurrent calls within the same process
const inflightPromises = new Map<string, Promise<void>>();

/**
 * Ensures operational occurrences and periods exist for the given month.
 * Uses an in-memory cache and in-flight mutex to prevent redundant PL/pgSQL RPC calls
 * on concurrent requests in the same process, dramatically cutting down DB roundtrips
 * and eliminating lock contention while remaining 100% safe.
 */
export async function ensureOperationalMonthSafe(
  supabase: SupabaseClient,
  targetDate: string
): Promise<void> {
  if (!targetDate || typeof targetDate !== "string") return;
  const monthKey = targetDate.slice(0, 7); // e.g. "2026-10"

  // 1. Fast path: already completed in this process
  if (initializedMonths.has(monthKey)) {
    return;
  }

  // 2. Concurrency path: an RPC is already in-flight for this month in this process, await it!
  const existing = inflightPromises.get(monthKey);
  if (existing) {
    return existing;
  }

  // 3. Initiate single-flight promise
  const promise = (async () => {
    try {
      const { error } = await supabase.rpc("ensure_operational_month", {
        target_date: targetDate,
      });
      if (!error) {
        initializedMonths.add(monthKey);
      } else {
        console.warn(`[ensureOperationalMonthSafe] warning for ${monthKey}:`, error.message);
      }
    } catch (err) {
      console.warn(`[ensureOperationalMonthSafe] error for ${monthKey}:`, err);
    } finally {
      inflightPromises.delete(monthKey);
    }
  })();

  inflightPromises.set(monthKey, promise);
  return promise;
}
