import { currentShift } from "@/lib/forms/domain";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type DutyKind, type RosterStaffMember } from "@/lib/roster/domain";

export interface RosterMember {
  user_id: string;
  full_name: string;
  business_role: "DEPARTMENT_HEAD" | "DOCTOR" | "TECHNICIAN";
  member_order: number;
  source_order?: number;
}

export interface DutyRosterInfo {
  roster_id: string;
  duty_kind: string;
  business_date: string;
  revision_no?: number;
  lock_version?: number;
  members: RosterMember[];
}

export interface WorkSessionContextResult {
  businessDate: string;
  slotCode: string;
  roster: DutyRosterInfo | null;
  userId: string | null;
  isHead: boolean;
  isAdmin: boolean;
  isOfficialRecordCreated: boolean;
  availableStaff: RosterStaffMember[];
  occurrences: Array<{
    id: string;
    formCode: string;
    locationCode?: string;
    locationName?: string;
    assetName?: string;
    status: string;
    fulfilledByRecordId?: string | null;
  }>;
}

export interface WorkSessionParams {
  businessDate: string;
  slotCode: string;
}

interface RawWorkSessionOccurrence {
  id: string;
  status: string;
  fulfilled_by_record_id: string | null;
  register_periods: {
    locations: { code: string; name: string } | null;
    assets: { source_name: string; source_code: string | null } | null;
    form_template_versions: {
      form_templates: { code: string; name: string } | null;
    } | null;
  } | null;
}

export function isHolidayOrWeekendForDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00+07:00`);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function resolveDutyKindForDateSlot(businessDate: string, slotCode: string): DutyKind | null {
  if (isHolidayOrWeekendForDate(businessDate)) return "HOLIDAY_24H";
  switch (slotCode) {
    case "SHIFT_2":
      return "WEEKDAY_LUNCH";
    case "SHIFT_3":
      return "WEEKDAY_AFTERNOON";
    case "SHIFT_4":
      return "WEEKDAY_NIGHT";
    default:
      return null;
  }
}

export function resolveWorkSessionParams(searchParams?: { date?: string; slot?: string }): WorkSessionParams {
  const shift = currentShift();
  const dateStr = searchParams?.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? searchParams.date
    : shift.businessDate;

  const validSlots = ["SHIFT_1", "SHIFT_2", "SHIFT_3", "SHIFT_4", "MORNING", "AFTERNOON", "HOLIDAY_24H"];
  const slotCode = searchParams?.slot && validSlots.includes(searchParams.slot)
    ? searchParams.slot
    : (isHolidayOrWeekendForDate(dateStr) ? "HOLIDAY_24H" : shift.code);

  return {
    businessDate: dateStr,
    slotCode,
  };
}

export async function getWorkSessionData(
  businessDate: string,
  slotCode: string,
  supabase: SupabaseClient
): Promise<WorkSessionContextResult> {
  const [{ data: contextData, error: rpcError }, { data: staffData }] = await Promise.all([
    supabase.rpc("get_work_session_context", {
      target_date: businessDate,
      target_slot_code: slotCode,
    }),
    supabase
      .from("profiles")
      .select("user_id, full_name, business_role, is_admin, account_kind, source_order, active")
      .eq("active", true)
      .eq("account_kind", "STAFF")
      .order("source_order", { ascending: true, nullsFirst: false }),
  ]);

  if (rpcError) {
    console.error("Failed to load work session context RPC:", rpcError);
  }

  const availableStaff = (staffData ?? []) as unknown as RosterStaffMember[];

  // Fetch occurrences matching the date and relevant forms
  const { data: occs } = await supabase
    .from("schedule_occurrences")
    .select(`
      id,
      status,
      business_date,
      slot_code,
      fulfilled_by_record_id,
      register_periods!inner (
        locations (code, name),
        assets (source_name, source_code),
        form_template_versions!inner (
          form_templates!inner (code, name)
        )
      )
    `)
    .eq("business_date", businessDate)
    .in("slot_code", [slotCode, slotCode === "SHIFT_1" ? "MORNING" : slotCode === "SHIFT_3" ? "AFTERNOON" : slotCode]);

  const occurrences = ((occs ?? []) as unknown as RawWorkSessionOccurrence[]).map((o) => {
    const template = o.register_periods?.form_template_versions?.form_templates;
    const loc = o.register_periods?.locations;
    const asset = o.register_periods?.assets;

    return {
      id: o.id,
      formCode: template?.code || "",
      locationCode: loc?.code,
      locationName: loc?.name,
      assetName: asset?.source_name,
      status: o.status,
      fulfilledByRecordId: o.fulfilled_by_record_id,
    };
  });

  const hasFulfilled = occurrences.some((o) => !!o.fulfilledByRecordId);

  return {
    businessDate,
    slotCode,
    roster: contextData?.roster ?? null,
    userId: contextData?.user_id ?? null,
    isHead: Boolean(contextData?.is_head),
    isAdmin: Boolean(contextData?.is_admin),
    isOfficialRecordCreated: hasFulfilled,
    availableStaff,
    occurrences,
  };
}
