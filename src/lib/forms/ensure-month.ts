import type { SupabaseClient } from "@supabase/supabase-js";

// Cache for months that have already been initialized in the current server instance.
const initializedMonths = new Set<string>();

/**
 * Ensures operational occurrences and periods exist for the given month.
 * Uses an in-memory cache to prevent redundant PL/pgSQL RPC calls on every single GET request,
 * dramatically cutting down DB roundtrips and blocking time while remaining 100% safe.
 */
export async function ensureOperationalMonthSafe(
  supabase: SupabaseClient,
  targetDate: string
): Promise<void> {
  if (!targetDate || typeof targetDate !== "string") return;
  const monthKey = targetDate.slice(0, 7); // e.g. "2026-10"

  if (initializedMonths.has(monthKey)) {
    return;
  }

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
  }
}
