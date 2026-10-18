import { createClient } from "@/lib/supabase/server";
import { currentShift, SHIFT_DEFINITIONS } from "@/lib/forms/domain";
import { buildOperationalSummary } from "./domain";
import { getUnreadNotificationCount } from "./queries";

const todayInVietnam = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const isValidIsoDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

type DashboardOccurrence = { status: string; register_periods: { form_template_versions: { form_templates: { code: string } } } };
type DecontaminationOccurrence = { id: string; status: string; fulfilled_by_record_id?: string | null; register_periods: { id?: string; location_id: string | null } };

const BM01_KNBM_AREA_CODES = ["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"] as const;

export interface DecontaminationWorkspaceArea {
  id: string;
  code: string;
  name: string;
  sort_order: number | null;
  periodId: string;
  occurrenceId: string | null;
  status: string;
  recordId: string | null;
  daily: boolean;
  weekly: boolean;
  spill: boolean;
  note: string;
}

export async function getOperationalDashboard() {
  const supabase = await createClient();
  const today = todayInVietnam();
  const shift = currentShift();
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: today });
  if (ensureError) console.warn("ensure_operational_month warning:", ensureError.message);
  const [occurrencesResult, measurementsResult, shiftsResult, periodsResult, incidentsResult, unread] = await Promise.all([
    supabase.from("schedule_occurrences").select("status,register_periods!inner(form_template_versions!inner(form_templates!inner(code)))").eq("business_date", today),
    supabase.from("measurement_details").select("temperature_abnormal,humidity_abnormal,records!inner(business_date,is_effective)").eq("records.business_date", today).eq("records.is_effective", true),
    supabase.from("equipment_shift_statuses").select("status_code,equipment_shift_details!inner(records!inner(business_date,slot_code,is_effective))").eq("equipment_shift_details.records.business_date", shift.businessDate).eq("equipment_shift_details.records.slot_code", shift.code).eq("equipment_shift_details.records.is_effective", true),
    supabase.from("register_periods").select("status"),
    supabase.from("incidents").select("id", { count: "exact", head: true }).in("status", ["OPEN", "IN_REVIEW"]),
    getUnreadNotificationCount(),
  ]);
  if ([occurrencesResult.error, measurementsResult.error, shiftsResult.error, periodsResult.error, incidentsResult.error].some(Boolean)) throw new Error("Không tải được Dashboard vận hành");
  const occurrences = (occurrencesResult.data ?? []) as unknown as DashboardOccurrence[];
  const maintenancePending = occurrences.filter((row) => row.status === "PENDING" && row.register_periods.form_template_versions.form_templates.code === "BM.02/QL.TRTB.01").length;
  const decontaminationPending = occurrences.filter((row) => row.status === "PENDING" && row.register_periods.form_template_versions.form_templates.code === "BM.01_KNBM").length;
  const periods = periodsResult.data ?? [];
  return buildOperationalSummary({
    occurrences,
    measurements: measurementsResult.data ?? [],
    shiftStatuses: shiftsResult.data ?? [],
    maintenancePending,
    decontaminationPending,
    readyPeriods: periods.filter((row) => row.status === "READY_FOR_REVIEW").length,
    returnedPeriods: periods.filter((row) => row.status === "RETURNED").length,
    openIncidents: incidentsResult.count ?? 0,
    unreadNotifications: unread,
  });
}

export async function getTemperatureOverview() {
  const supabase = await createClient();
  const today = todayInVietnam();
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: today });
  if (ensureError) console.warn("ensure_operational_month temperature warning:", ensureError.message);
  const [{ data: occurrences, error: occurrenceError }, { data: records, error: recordError }] = await Promise.all([
    supabase.from("schedule_occurrences").select("id,status,business_date,slot_code,window_start,window_end,fulfilled_by_record_id,register_periods!inner(id,locations(code,name),assets(id,source_name,source_code,storage_purpose),form_template_versions!inner(form_templates!inner(code,name)))").eq("business_date", today).in("register_periods.form_template_versions.form_templates.code", ["BM.01/QL.HTAT.01", "BM.02/QL.HTAT.01", "BM.03/QL.HTAT.01"]).order("window_start"),
    supabase.from("records").select("id,business_date,slot_code,performed_at,entered_at,entered_by,location_id,asset_id,form_template_versions!inner(form_templates!inner(code)),profiles!records_entered_by_fkey(full_name),measurement_details(temperature_c,humidity_pct,temperature_min_snapshot,temperature_max_snapshot,humidity_min_snapshot,humidity_max_snapshot,temperature_abnormal,humidity_abnormal)").eq("business_date", today).eq("is_effective", true),
  ]);
  if (occurrenceError || recordError) throw new Error("Không tải được dữ liệu nhiệt độ");
  return { today, occurrences: occurrences ?? [], records: records ?? [] };
}

export async function getEquipmentOverview(date?: string, slot?: string) {
  const supabase = await createClient();
  const current = currentShift();
  const businessDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : current.businessDate;
  const slotCode = slot && /^SHIFT_[1-4]$/.test(slot) ? slot : current.code;
  const shiftDef = SHIFT_DEFINITIONS.find((s) => s.code === slotCode) ?? current;
  const shift = { ...shiftDef, businessDate };

  const [{ data: assets, error: assetError }, { data: statuses, error: statusError }] = await Promise.all([
    supabase.from("assets").select("id,source_name,source_code,source_order,locations(code,name)").eq("asset_type", "LAB_EQUIPMENT").eq("active", true).order("source_order"),
    supabase.from("equipment_shift_statuses").select("asset_id,status_code,updated_at,equipment_shift_details!inner(records!inner(id,business_date,slot_code,is_effective))").eq("equipment_shift_details.records.business_date", businessDate).eq("equipment_shift_details.records.slot_code", slotCode).eq("equipment_shift_details.records.is_effective", true),
  ]);
  if (assetError || statusError) throw new Error("Không tải được dữ liệu thiết bị");
  const latest = new Map((statuses ?? []).map((row) => [row.asset_id, row]));
  return { shift, assets: (assets ?? []).map((asset) => ({ ...asset, latest: latest.get(asset.id) ?? null })) };
}

export async function getDecontaminationWorkspace(date?: string) {
  const supabase = await createClient();
  const today = isValidIsoDate(date) ? date! : todayInVietnam();
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: today });
  if (ensureError) console.warn("ensure_operational_month decontamination warning:", ensureError.message);

  const [{ data: locations, error: locationError }, { data: occurrences, error: occurrenceError }] = await Promise.all([
    supabase.from("locations").select("id,code,name,sort_order").in("code", [...BM01_KNBM_AREA_CODES]).order("sort_order"),
    supabase
      .from("schedule_occurrences")
      .select("id,status,fulfilled_by_record_id,register_periods!inner(id,location_id,form_template_versions!inner(form_templates!inner(code)))")
      .eq("business_date", today)
      .eq("register_periods.form_template_versions.form_templates.code", "BM.01_KNBM"),
  ]);
  if (locationError || occurrenceError) throw new Error("Không tải được dữ liệu khử nhiễm");

  const typedOccurrences = (occurrences ?? []) as unknown as DecontaminationOccurrence[];
  const byLocation = new Map<string, DecontaminationOccurrence>();
  const recordIds = typedOccurrences.map((occurrence) => occurrence.fulfilled_by_record_id).filter(Boolean) as string[];

  for (const occurrence of typedOccurrences) {
    const locationId = occurrence.register_periods.location_id;
    if (locationId) byLocation.set(locationId, occurrence);
  }

  const { data: records, error: recordError } = recordIds.length
    ? await supabase
      .from("records")
      .select("id,note,decontamination_details(daily_done,weekly_done,spill_event_done)")
      .in("id", recordIds)
      .eq("is_effective", true)
    : { data: [], error: null };
  if (recordError) throw new Error("Không đọc lại được dữ liệu đã lưu khử nhiễm");

  type SavedRecord = {
    id: string;
    note: string | null;
    decontamination_details: { daily_done: boolean; weekly_done: boolean; spill_event_done: boolean } | null;
  };
  const byRecordId = new Map(((records ?? []) as unknown as SavedRecord[]).map((record) => [record.id, record]));

  const areas: DecontaminationWorkspaceArea[] = (locations ?? []).map((location) => {
    const occurrence = byLocation.get(location.id);
    const record = occurrence?.fulfilled_by_record_id ? byRecordId.get(occurrence.fulfilled_by_record_id) : null;
    return {
      id: location.id,
      code: location.code,
      name: location.name,
      sort_order: location.sort_order,
      periodId: occurrence?.register_periods.id ?? "",
      occurrenceId: occurrence?.id ?? null,
      status: occurrence?.status ?? "PENDING",
      recordId: occurrence?.fulfilled_by_record_id ?? null,
      daily: Boolean(record?.decontamination_details?.daily_done),
      weekly: Boolean(record?.decontamination_details?.weekly_done),
      spill: Boolean(record?.decontamination_details?.spill_event_done),
      note: record?.note ?? "",
    };
  });

  return { today, areas };
}

export async function getDecontaminationOverview() {
  const workspace = await getDecontaminationWorkspace();
  return { today: workspace.today, areas: workspace.areas.map(({ id, code, name, sort_order, status }) => ({ id, code, name, sort_order, status })) };
}

export async function getReportPeriods() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("register_periods")
    .select("id,period_label,period_start,period_end,status,approved_at,approved_by,locations(name),assets(source_name),form_template_versions(version_label,form_templates(code,name)),records(count)")
    .order("period_start", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Không tải được báo cáo: ${error.message}`);
  return (data ?? []).map((p: any) => ({
    ...p,
    record_count: p.records?.[0]?.count ?? 0,
  }));
}

export async function getOfficialPeriodReport(periodId: string, filters?: { start?: string; end?: string; shift?: string }) {
  const supabase = await createClient();
  const { data: period, error: periodError } = await supabase
    .from("register_periods")
    .select("id,period_label,period_start,period_end,status,approved_at,approved_by,locations(name),assets(source_name),form_template_versions(version_label,form_templates(code,name))")
    .eq("id", periodId)
    .maybeSingle();

  if (periodError || !period) throw new Error("Không tải được thông tin sổ kỳ");

  // Determine actual effective date range: clamp within period bounds!
  let effectiveStart = period.period_start;
  let effectiveEnd = period.period_end;
  if (isValidIsoDate(filters?.start) && filters!.start! >= period.period_start && filters!.start! <= period.period_end) {
    effectiveStart = filters!.start!;
  }
  if (isValidIsoDate(filters?.end) && filters!.end! >= period.period_start && filters!.end! <= period.period_end) {
    effectiveEnd = filters!.end!;
  }

  let recordsQuery = supabase
    .from("records")
    .select("id,record_type,business_date,slot_code,performed_at,entered_at,entered_by,is_na,na_reason,note,revision_no,is_effective,profiles!records_entered_by_fkey(full_name),measurement_details(temperature_c,humidity_pct,temperature_abnormal,humidity_abnormal),decontamination_details(daily_done,weekly_done,spill_event_done),maintenance_details(cadence,result),equipment_shift_details(usage_value,usage_unit,equipment_shift_statuses(asset_display_order_snapshot,status_code,asset_label_snapshot))")
    .eq("period_id", periodId)
    .eq("is_effective", true)
    .gte("business_date", effectiveStart)
    .lte("business_date", effectiveEnd);

  if (filters?.shift && /^SHIFT_[1-4]$/.test(filters.shift)) {
    recordsQuery = recordsQuery.eq("slot_code", filters.shift);
  }

  const { data: records, error: recordsError } = await recordsQuery.order("business_date").order("performed_at");
  if (recordsError) throw new Error("Không tải được dữ liệu xuất báo cáo: " + recordsError.message);

  const isOfficial = period.status === "APPROVED";
  return { period, records: records ?? [], official: isOfficial, isDraft: !isOfficial };
}

export async function getExportWorkspace(filters: { templateCode?: string; year?: string; month?: string; day?: string; shift?: string; periodId?: string }) {
  const supabase = await createClient();
  let reqYear = /^\d{4}$/.test(filters.year ?? "") ? filters.year! : "2026";
  let reqMonth = filters.month && /^(0?[1-9]|1[0-2])$/.test(filters.month) ? String(Number(filters.month)).padStart(2, "0") : undefined;

  const [{ data: templates, error: templateError }, { data: periods, error: periodError }] = await Promise.all([
    supabase.from("form_template_versions").select("id,version_label,form_templates!inner(code,name,form_kind)").eq("status", "PUBLISHED").order("created_at"),
    supabase.from("register_periods").select("id,period_label,period_start,period_end,status,approved_at,locations(name),assets(source_name),form_template_versions!inner(id,version_label,form_templates!inner(code,name,form_kind)),records(count)").order("period_start", { ascending: false }),
  ]);
  if (templateError || periodError) throw new Error("Không tải được không gian xuất biểu mẫu");

  type Period = {
    id: string;
    period_label: string | null;
    period_start: string;
    period_end: string;
    status: string;
    approved_at: string | null;
    locations: { name: string } | null;
    assets: { source_name: string } | null;
    form_template_versions: {
      id: string;
      version_label: string;
      form_templates: { code: string; name: string; form_kind: string };
    };
    records?: Array<{ count: number }>;
    record_count: number;
  };

  const typedPeriods = ((periods ?? []) as unknown as Period[]).map((p) => ({
    ...p,
    record_count: p.records?.[0]?.count ?? 0,
  }));

  const typedTemplates = (templates ?? []) as unknown as Array<{ id: string; version_label: string; form_templates: { code: string; name: string; form_kind: string } }>;
  const CANONICAL_ORDER = [
    "BM.01/QL.HTAT.01",
    "BM.01_KNBM",
    "BM.02/QL.HTAT.01",
    "BM.03/QL.HTAT.01",
    "BM.02/QL.TRTB.01",
    "BM.06/QL.TRTB.01",
  ];
  typedTemplates.sort((a, b) => {
    const idxA = CANONICAL_ORDER.indexOf(a.form_templates.code);
    const idxB = CANONICAL_ORDER.indexOf(b.form_templates.code);
    return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
  });

  const templateCode = filters.templateCode ?? CANONICAL_ORDER[0];
  const allMatching = typedPeriods.filter((period) => period.form_template_versions.form_templates.code === templateCode);

  // If a specific periodId is requested, look it up first and ALIGN year and month directly from that period!
  const explicitTarget = filters.periodId ? allMatching.find((p) => p.id === filters.periodId) : null;
  if (explicitTarget) {
    const parts = explicitTarget.period_start.split("-");
    if (parts[0]) reqYear = parts[0];
    if (parts[1]) reqMonth = parts[1];
  }

  const year = reqYear;
  let month = reqMonth;
  if (!month) {
    const today = todayInVietnam();
    const curM = today.split("-")[1] ?? "10";
    month = curM;
  }

  const day = /^(0?[1-9]|[12]\d|3[01])$/.test(filters.day ?? "") ? String(Number(filters.day)).padStart(2, "0") : "";
  const candidateStart = `${year}-${month}-${day || "01"}`;
  const start = isValidIsoDate(candidateStart) ? candidateStart : `${year}-${month}-01`;
  const end = day && start === candidateStart ? start : new Date(Date.UTC(Number(year), Number(month), 0)).toISOString().slice(0, 10);

  let matchingInMonth = allMatching.filter((p) => p.period_start.startsWith(`${year}-${month}`));
  let matching = matchingInMonth.length > 0 ? matchingInMonth : allMatching;

  // Deduplicate by location/asset name: if multiple periods exist, keep the one with higher record_count
  const dedupMap = new Map<string, Period>();
  for (const p of matching) {
    const key = p.locations?.name ?? p.assets?.source_name ?? "GLOBAL";
    const existing = dedupMap.get(key);
    if (!existing || (p.record_count ?? 0) > (existing.record_count ?? 0)) {
      dedupMap.set(key, p);
    }
  }
  matching = Array.from(dedupMap.values());

  matching = matching.map((p) => {
    if (!p.locations?.name && !p.assets?.source_name) {
      return {
        ...p,
        locations: { name: "Toàn khoa (20 máy xét nghiệm)" },
      };
    }
    return p;
  });

  // Sort matching: higher record_count first
  matching.sort((a, b) => (b.record_count ?? 0) - (a.record_count ?? 0));

  const selectedPeriod = (filters.periodId ? matching.find((p) => p.id === filters.periodId) : null)
    ?? (explicitTarget ?? matching[0] ?? null);

  let records: unknown[] = [];
  if (selectedPeriod) {
    let query = supabase.from("records").select("id,record_type,business_date,slot_code,performed_at,entered_at,is_na,na_reason,note,revision_no,is_effective,profiles!records_entered_by_fkey(full_name),measurement_details(temperature_c,humidity_pct,temperature_abnormal,humidity_abnormal),decontamination_details(daily_done,weekly_done,spill_event_done),maintenance_details(cadence,result),equipment_shift_details(usage_value,usage_unit,equipment_shift_statuses(asset_display_order_snapshot,status_code,asset_label_snapshot))").eq("period_id", selectedPeriod.id).eq("is_effective", true);
    if (day) {
      query = query.gte("business_date", start).lte("business_date", end);
    }
    if (filters.shift && filters.shift !== "ALL") query = query.eq("slot_code", filters.shift);
    const result = await query.order("business_date").order("performed_at");
    if (result.error) throw new Error(`Không tải được preview: ${result.error.message}`);
    records = result.data ?? [];
  }
  return { year, month, day, start, end, shift: filters.shift ?? "ALL", templates: typedTemplates, periods: matching, selectedPeriod, records, templateCode };
}
