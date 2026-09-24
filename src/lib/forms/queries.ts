import { createClient } from "@/lib/supabase/server";
import { currentShift } from "./domain";
import type { TaskView } from "@/components/forms/TaskList";

export interface OccurrenceView {
  id: string; business_date: string | null; slot_code: string | null; status: string; window_start: string; window_end: string;
  register_periods: { id: string; location_id: string | null; asset_id: string | null; form_version_id: string; locations: { name: string; code: string } | null; assets: { source_name: string; source_code: string | null; storage_purpose: string | null } | null; form_template_versions: { version_label: string; form_templates: { code: string; name: string; form_kind: string } } };
}
export interface PeriodView { id: string; period_label: string | null; status: string; period_start: string; period_end: string; locations: { code: string; name: string } | null; assets: { source_name: string } | null; form_template_versions: { form_templates: { code: string; name: string } }; }
export interface RecordView { id: string; record_type: string; business_date: string; slot_code: string | null; record_state: string; is_na: boolean; note: string | null; measurement_details: unknown; decontamination_details: unknown; maintenance_details: unknown; equipment_shift_details: unknown; equipment_shift_statuses: Array<{ asset_display_order_snapshot: number; status_code: string; asset_label_snapshot: string }>; }
export interface AssetView { id: string; source_name: string; source_code: string | null; source_order: number; asset_type: string; active: boolean; locations: { id: string; code: string; name: string } | null; }

export async function getAreaSummaries() {
  const supabase = await createClient();
  const { data: locations } = await supabase.from("locations").select("id,code,name,sort_order").in("code", ["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"]).order("sort_order");
  const { data: assets } = await supabase.from("assets").select("id,location_id").eq("asset_type", "LAB_EQUIPMENT").eq("active", true);
  return (locations ?? []).map((location) => ({ ...location, deviceCount: (assets ?? []).filter((asset) => asset.location_id === location.id).length, completed: 0, total: (assets ?? []).filter((asset) => asset.location_id === location.id).length }));
}
export async function getArea(code: string) {
  const supabase = await createClient();
  const { data: location } = await supabase.from("locations").select("id,code,name").eq("code", code).single();
  if (!location) return null;
  const { data: assets } = await supabase.from("assets").select("id,source_name,source_code,source_order,active").eq("location_id", location.id).eq("asset_type", "LAB_EQUIPMENT").order("source_order");
  return { location, assets: assets ?? [], shift: currentShift() };
}
export async function getOccurrence(id: string): Promise<OccurrenceView | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("schedule_occurrences").select("id,business_date,slot_code,status,window_start,window_end,register_periods(id,location_id,asset_id,form_version_id,locations(name,code),assets(source_name,source_code,storage_purpose),form_template_versions(version_label,form_templates(code,name,form_kind)))").eq("id", id).single();
  return data as unknown as OccurrenceView | null;
}
export async function getTodayTasks(date?: string): Promise<TaskView[]> {
  const supabase = await createClient();
  const today = date ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: today });
  if (ensureError) throw new Error(ensureError.message);
  const { data, error } = await supabase.from("schedule_occurrences").select("id,business_date,slot_code,status,window_start,window_end,register_periods(id,locations(code,name),assets(source_name,location_id,locations(code,name)),form_template_versions(form_templates(code,name)))").eq("business_date", today).order("window_start");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TaskView[];
}
export async function getPeriods(): Promise<PeriodView[]> {
  const supabase = await createClient(); const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const { error } = await supabase.rpc("ensure_operational_month", { target_date: today }); if (error) throw new Error(error.message);
  const { data } = await supabase.from("register_periods").select("id,period_label,status,period_start,period_end,locations(code,name),assets(source_name),form_template_versions(form_templates(code,name))").order("period_start", { ascending: false });
  return (data ?? []) as unknown as PeriodView[];
}
export async function getPeriod(id: string): Promise<{ period: PeriodView; occurrences: Array<{ id: string; business_date: string | null; slot_code: string | null; status: string; window_start: string; window_end: string; fulfilled_by_record_id: string | null }>; records: RecordView[] } | null> {
  const supabase = await createClient();
  const [{ data: period }, { data: occurrences }, { data: records }] = await Promise.all([
    supabase.from("register_periods").select("id,period_label,status,period_start,period_end,locations(code,name),assets(source_name),form_template_versions(form_templates(code,name))").eq("id", id).single(),
    supabase.from("schedule_occurrences").select("id,business_date,slot_code,status,window_start,window_end,fulfilled_by_record_id").eq("period_id", id).order("window_start"),
    supabase.from("records").select("id,record_type,business_date,slot_code,record_state,is_na,note,measurement_details(temperature_c,humidity_pct,temperature_abnormal,humidity_abnormal),decontamination_details(daily_done,weekly_done,spill_event_done),maintenance_details(cadence,result),equipment_shift_details(usage_value,usage_unit),equipment_shift_statuses(asset_display_order_snapshot,status_code,asset_label_snapshot)").eq("period_id", id).eq("is_effective", true).order("business_date"),
  ]);
  return period ? { period: period as unknown as PeriodView, occurrences: occurrences ?? [], records: (records ?? []) as unknown as RecordView[] } : null;
}
export async function getAsset(id: string): Promise<{ asset: AssetView; records: Array<{ id: string; business_date: string; slot_code: string | null; record_type: string; record_state: string; note: string | null }>; shifts: Array<{ status_code: string; records: { id: string; business_date: string; slot_code: string | null; record_state: string } }> } | null> {
  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("id,source_name,source_code,source_order,asset_type,active,locations(id,code,name)").eq("id", id).single();
  if (!asset) return null;
  const [{ data: records }, { data: shifts }] = await Promise.all([
    supabase.from("records").select("id,business_date,slot_code,record_type,record_state,note").eq("asset_id", id).eq("is_effective", true).order("business_date", { ascending: false }).limit(20),
    supabase.from("equipment_shift_statuses").select("status_code,records!inner(id,business_date,slot_code,record_state)").eq("asset_id", id).order("created_at", { ascending: false }).limit(4),
  ]);
  type ShiftView = { status_code: string; records: { id: string; business_date: string; slot_code: string | null; record_state: string } };
  return { asset: asset as unknown as AssetView, records: records ?? [], shifts: (shifts ?? []) as unknown as ShiftView[] };
}
