import { createClient } from "@/lib/supabase/server";
import { ensureOperationalMonthSafe } from "@/lib/forms/ensure-month";

export interface MaintenanceOccurrenceItem {
  id: string;
  periodId: string;
  periodStatus: string;
  assetId: string;
  assetName: string;
  assetCode: string | null;
  locationCode?: string;
  locationName?: string;
  cadence: "DAILY" | "WEEKLY" | "MONTHLY";
  slotCode: string;
  status: "PENDING" | "COMPLETED" | string;
  businessDate: string | null;
  windowStart?: string;
  windowEnd?: string;
  fulfilledByRecordId: string | null;
  record?: {
    id: string;
    performedAt: string;
    result: "PASS" | "FAIL";
    note: string | null;
  } | null;
}

export interface MaintenanceWorkspaceData {
  businessDate: string;
  items: MaintenanceOccurrenceItem[];
  counts: {
    total: number;
    completed: number;
    pending: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export async function getMaintenanceWorkspace(date: string): Promise<MaintenanceWorkspaceData> {
  const supabase = await createClient();
  await ensureOperationalMonthSafe(supabase, date);

  // 1. Query daily occurrences for the date
  const { data: dailyOccs, error: dErr } = await supabase
    .from("schedule_occurrences")
    .select(`
      id,
      business_date,
      slot_code,
      status,
      fulfilled_by_record_id,
      window_start,
      window_end,
      register_periods!inner (
        id,
        status,
        asset_id,
        assets (
          id,
          source_name,
          source_code,
          source_order,
          locations (code, name)
        ),
        form_template_versions!inner (
          form_templates!inner (code)
        )
      )
    `)
    .eq("register_periods.form_template_versions.form_templates.code", "BM.02/QL.TRTB.01")
    .eq("business_date", date)
    .order("id", { ascending: true });

  if (dErr) {
    console.error("Failed to query daily maintenance occurrences:", dErr);
  }

  // 2. Query weekly/monthly occurrences where date falls in window
  const { data: nonDailyOccs, error: ndErr } = await supabase
    .from("schedule_occurrences")
    .select(`
      id,
      business_date,
      slot_code,
      status,
      fulfilled_by_record_id,
      window_start,
      window_end,
      register_periods!inner (
        id,
        status,
        asset_id,
        assets (
          id,
          source_name,
          source_code,
          source_order,
          locations (code, name)
        ),
        form_template_versions!inner (
          form_templates!inner (code)
        )
      )
    `)
    .eq("register_periods.form_template_versions.form_templates.code", "BM.02/QL.TRTB.01")
    .is("business_date", null)
    .lte("window_start", `${date}T23:59:59+07:00`)
    .gte("window_end", `${date}T00:00:00+07:00`)
    .order("id", { ascending: true });

  if (ndErr) {
    console.error("Failed to query weekly/monthly maintenance occurrences:", ndErr);
  }

  const rawOccs = [...(dailyOccs ?? []), ...(nonDailyOccs ?? [])];

  // 3. Batch fetch fulfilled records details if any
  const fulfilledRecordIds = rawOccs
    .map((o: any) => o.fulfilled_by_record_id)
    .filter((id: string | null): id is string => Boolean(id));

  const recordMap = new Map<string, { id: string; performedAt: string; result: "PASS" | "FAIL"; note: string | null }>();

  if (fulfilledRecordIds.length > 0) {
    const { data: recordsData } = await supabase
      .from("records")
      .select("id, performed_at, note, record_state, maintenance_details (cadence, result)")
      .in("id", fulfilledRecordIds);

    for (const r of recordsData ?? []) {
      const details = Array.isArray(r.maintenance_details)
        ? r.maintenance_details[0]
        : r.maintenance_details;
      recordMap.set(r.id, {
        id: r.id,
        performedAt: r.performed_at,
        result: details?.result === "FAIL" ? "FAIL" : "PASS",
        note: r.note,
      });
    }
  }

  // 4. Transform into structured items
  const items: MaintenanceOccurrenceItem[] = rawOccs.map((o: any) => {
    const p = o.register_periods;
    const a = p?.assets;
    const loc = a?.locations;
    const slotCode = o.slot_code || "DAILY";
    const cadence: "DAILY" | "WEEKLY" | "MONTHLY" =
      slotCode === "WEEKLY" || slotCode === "WEEKLY_ONCE"
        ? "WEEKLY"
        : slotCode === "MONTHLY" || slotCode === "MONTHLY_ONCE"
        ? "MONTHLY"
        : "DAILY";

    const rec = o.fulfilled_by_record_id ? recordMap.get(o.fulfilled_by_record_id) ?? null : null;

    return {
      id: o.id,
      periodId: p?.id ?? "",
      periodStatus: p?.status ?? "OPEN",
      assetId: a?.id ?? "",
      assetName: a?.source_name ?? "Thiết bị xét nghiệm",
      assetCode: a?.source_code ?? null,
      locationCode: loc?.code,
      locationName: loc?.name,
      cadence,
      slotCode,
      status: o.status,
      businessDate: o.business_date,
      windowStart: o.window_start,
      windowEnd: o.window_end,
      fulfilledByRecordId: o.fulfilled_by_record_id,
      record: rec,
    };
  });

  // Sort items: daily first, then weekly, then monthly, and by asset name
  const cadenceOrder: Record<string, number> = { DAILY: 1, WEEKLY: 2, MONTHLY: 3 };
  items.sort((x, y) => {
    const cDiff = (cadenceOrder[x.cadence] ?? 9) - (cadenceOrder[y.cadence] ?? 9);
    if (cDiff !== 0) return cDiff;
    return x.assetName.localeCompare(y.assetName, "vi");
  });

  const completed = items.filter((i) => i.status === "COMPLETED" || Boolean(i.fulfilledByRecordId)).length;

  return {
    businessDate: date,
    items,
    counts: {
      total: items.length,
      completed,
      pending: items.length - completed,
      daily: items.filter((i) => i.cadence === "DAILY").length,
      weekly: items.filter((i) => i.cadence === "WEEKLY").length,
      monthly: items.filter((i) => i.cadence === "MONTHLY").length,
    },
  };
}

export async function getMaintenanceOccurrenceDetail(occurrenceId: string) {
  const supabase = await createClient();
  const { data: occ, error: occError } = await supabase
    .from("schedule_occurrences")
    .select(`
      id,
      business_date,
      slot_code,
      status,
      fulfilled_by_record_id,
      window_start,
      window_end,
      register_periods!inner (
        id,
        status,
        asset_id,
        assets (
          id,
          source_name,
          source_code,
          storage_purpose,
          locations (code, name)
        ),
        form_template_versions!inner (
          version_label,
          form_templates!inner (code, name, form_kind)
        )
      )
    `)
    .eq("id", occurrenceId)
    .single();

  if (occError || !occ) return null;

  let record: { id: string; performedAt: string; result: "PASS" | "FAIL"; note: string | null } | null = null;

  if (occ.fulfilled_by_record_id) {
    const { data: recData } = await supabase
      .from("records")
      .select("id, performed_at, note, record_state, entered_by, maintenance_details (cadence, result)")
      .eq("id", occ.fulfilled_by_record_id)
      .maybeSingle();

    if (recData) {
      const details = Array.isArray(recData.maintenance_details)
        ? recData.maintenance_details[0]
        : recData.maintenance_details;
      record = {
        id: recData.id,
        performedAt: recData.performed_at,
        result: details?.result === "FAIL" ? "FAIL" : "PASS",
        note: recData.note,
      };
    }
  }

  const slotCode = occ.slot_code || "DAILY";
  const cadence: "DAILY" | "WEEKLY" | "MONTHLY" =
    slotCode === "WEEKLY" || slotCode === "WEEKLY_ONCE"
      ? "WEEKLY"
      : slotCode === "MONTHLY" || slotCode === "MONTHLY_ONCE"
      ? "MONTHLY"
      : "DAILY";

  const rawPeriod = Array.isArray(occ.register_periods)
    ? (occ.register_periods[0] as any)
    : (occ.register_periods as any);
  const rawAsset = Array.isArray(rawPeriod?.assets)
    ? rawPeriod?.assets[0]
    : rawPeriod?.assets;

  return {
    occurrence: {
      id: occ.id,
      business_date: occ.business_date,
      slot_code: occ.slot_code,
      status: occ.status,
      fulfilled_by_record_id: occ.fulfilled_by_record_id,
    },
    cadence,
    assetName: (rawAsset?.source_name as string) ?? "Thiết bị xét nghiệm",
    assetCode: (rawAsset?.source_code as string | null) ?? null,
    periodStatus: (rawPeriod?.status as string) ?? "OPEN",
    record,
  };
}
