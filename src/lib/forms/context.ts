import { createClient } from "@/lib/supabase/server";
import { currentShift, vietnamParts } from "./domain";

function monthBounds(date = new Date()) {
  const { date: iso } = vietnamParts(date);
  const [year, month] = iso.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { start, end, today: iso };
}

export async function ensurePeriod(templateCode: string, locationId: string | null, assetId: string | null) {
  const supabase = await createClient();
  const { data: template } = await supabase.from("form_templates").select("id").eq("code", templateCode).single();
  if (!template) throw new Error("Không tìm thấy biểu mẫu");
  const { data: version } = await supabase.from("form_template_versions").select("id").eq("form_template_id", template.id).eq("status", "PUBLISHED").single();
  if (!version) throw new Error("Biểu mẫu chưa có phiên bản phát hành");
  const bounds = monthBounds();
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: bounds.today });
  if (ensureError) throw new Error(ensureError.message);
  let query = supabase.from("register_periods").select("id").eq("form_version_id", version.id).eq("period_start", bounds.start).eq("period_end", bounds.end);
  query = locationId ? query.eq("location_id", locationId) : query.is("location_id", null);
  query = assetId ? query.eq("asset_id", assetId) : query.is("asset_id", null);
  const { data: period, error } = await query.single();
  if (error || !period) throw new Error(error?.message ?? "Không tìm thấy kỳ");
  return { supabase, periodId: period.id, versionId: version.id, ...bounds };
}

export async function getBm06Occurrence(occurrenceId: string, areaCode?: string) {
  const supabase = await createClient();
  const { data: occurrence } = await supabase.from("schedule_occurrences").select("id,business_date,slot_code,status,fulfilled_by_record_id,register_periods(form_version_id)").eq("id", occurrenceId).single();
  type OccurrenceRow = { id:string; business_date:string|null; slot_code:string|null; status:string; fulfilled_by_record_id:string|null; register_periods:{form_version_id:string} };
  const typed = occurrence as unknown as OccurrenceRow | null;
  if (!typed) return null;
  const { data: rows } = await supabase.from("form_version_assets").select("display_order,asset_id,assets!inner(source_name,location_id,locations!inner(code))").eq("form_version_id", typed.register_periods.form_version_id).eq("active", true).order("display_order");
  let initialStatuses: Record<string,string> = {}; let lockVersion = 1;
  if (typed.fulfilled_by_record_id) { const [{data:record},{data:statuses}] = await Promise.all([supabase.from("records").select("lock_version").eq("id",typed.fulfilled_by_record_id).single(),supabase.from("equipment_shift_statuses").select("asset_id,status_code").eq("shift_record_id",typed.fulfilled_by_record_id)]); lockVersion=record?.lock_version??1;initialStatuses=Object.fromEntries((statuses??[]).map(s=>[s.asset_id,s.status_code])); }
  type AssetRow={asset_id:string;display_order:number;assets:{source_name:string;locations:{code:string}}};
  const assets=((rows??[]) as unknown as AssetRow[]).map(row=>({id:row.asset_id,sourceOrder:row.display_order,name:row.assets.source_name,locationCode:row.assets.locations.code}));
  return { occurrence:typed, assets, initialStatuses, lockVersion, areaCode };
}

export async function getCurrentBm06(areaCode?: string) {
  const supabase = await createClient();
  const shift = currentShift();
  const { data: version } = await supabase.from("form_template_versions").select("id,form_templates!inner(code)").eq("status", "PUBLISHED").eq("form_templates.code", "BM.06/QL.TRTB.01").single();
  if (!version) return null;
  const bounds = monthBounds();
  const { error: ensureError } = await supabase.rpc("ensure_operational_month", { target_date: bounds.today });
  if (ensureError) throw new Error(ensureError.message);
  const { data: period, error } = await supabase.from("register_periods").select("id").eq("form_version_id", version.id).eq("period_start", bounds.start).eq("period_end", bounds.end).is("location_id", null).is("asset_id", null).single();
  if (error || !period) throw new Error(error?.message ?? "Không tìm thấy kỳ BM.06");
  const periodId = period.id;
  const { data: occurrence } = await supabase.from("schedule_occurrences").select("id,business_date,slot_code,status,fulfilled_by_record_id").eq("period_id", periodId).eq("business_date", shift.businessDate).eq("slot_code", shift.code).single();
  if (!occurrence) return null;
  const { data: rows } = await supabase.from("form_version_assets").select("display_order,asset_id,assets!inner(source_name,location_id,locations!inner(code))").eq("form_version_id", version.id).eq("active", true).order("display_order");
  let initialStatuses: Record<string, string> = {}; let lockVersion = 1;
  if (occurrence.fulfilled_by_record_id) {
    const [{ data: record }, { data: statuses }] = await Promise.all([supabase.from("records").select("lock_version").eq("id", occurrence.fulfilled_by_record_id).single(), supabase.from("equipment_shift_statuses").select("asset_id,status_code").eq("shift_record_id", occurrence.fulfilled_by_record_id)]);
    lockVersion = record?.lock_version ?? 1; initialStatuses = Object.fromEntries((statuses ?? []).map(s => [s.asset_id, s.status_code]));
  }
  type AssetRow = { asset_id: string; display_order: number; assets: { source_name: string; locations: { code: string } } };
  const assets = ((rows ?? []) as unknown as AssetRow[]).map((row) => ({ id: row.asset_id, sourceOrder: row.display_order, name: row.assets.source_name, locationCode: row.assets.locations.code }));
  return { occurrence, assets, initialStatuses, lockVersion, areaCode, shift, periodId };
}
