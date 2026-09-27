import { createClient } from "@/lib/supabase/server";
import { type DutyKind, type RosterStaffMember } from "./domain";

export interface SaveRosterParams {
  businessDate: string;
  dutyKind: DutyKind;
  userIds: string[];
  expectedLock?: number;
}

export interface SaveRosterResult {
  success: boolean;
  rosterId?: string;
  error?: string;
}

export interface ActiveDutyRosterRecord {
  id: string;
  business_date: string;
  duty_kind: DutyKind;
  status: string;
  revision_no: number;
  lock_version: number;
  duty_roster_members: Array<{
    member_order: number;
    profiles: {
      user_id: string;
      full_name: string;
      business_role: "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
      source_order: number | null;
    } | null;
  }>;
}

export async function fetchRosterStaffCandidates(): Promise<RosterStaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, business_role, account_kind, source_order, active")
    .eq("active", true)
    .eq("account_kind", "STAFF")
    .order("source_order", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch staff candidates: ${error.message}`);
  }

  return (data ?? []) as RosterStaffMember[];
}

export async function saveDutyRosterAction(params: SaveRosterParams): Promise<SaveRosterResult> {
  const supabase = await createClient();
  const { businessDate, dutyKind, userIds, expectedLock } = params;

  const { data, error } = await supabase.rpc("save_duty_roster", {
    target_date: businessDate,
    target_duty_kind: dutyKind,
    target_user_ids: userIds,
    target_expected_lock: expectedLock,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    rosterId: data as string,
  };
}

export async function fetchActiveRosterForDate(dateStr: string): Promise<ActiveDutyRosterRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("duty_rosters")
    .select(
      `
      id,
      business_date,
      duty_kind,
      status,
      revision_no,
      lock_version,
      duty_roster_members (
        member_order,
        profiles (
          user_id,
          full_name,
          business_role,
          source_order
        )
      )
    `
    )
    .eq("business_date", dateStr)
    .eq("status", "ACTIVE")
    .order("duty_kind", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active rosters: ${error.message}`);
  }

  return (data ?? []) as unknown as ActiveDutyRosterRecord[];
}
