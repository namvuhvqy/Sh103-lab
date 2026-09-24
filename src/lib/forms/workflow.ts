import { createClient } from "@/lib/supabase/server";

export interface ApprovalPeriod {
  id: string;
  period_label: string | null;
  period_start: string;
  period_end: string;
  status: string;
  lock_version: number;
  returned_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  locations: { name: string; code: string } | null;
  assets: { source_name: string } | null;
  form_template_versions: { form_templates: { code: string; name: string } };
}

export interface ReviewSummary {
  total: number;
  completed: number;
  na: number;
  pending: number;
  abnormal: number;
  broken: number;
  returned: boolean;
}

export async function getCurrentAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("business_role,is_admin,active").eq("user_id", user.id).single();
  if (error || !data?.active) return null;
  return { userId: user.id, role: data.business_role as string, isAdmin: data.is_admin as boolean, canApprove: data.business_role === "DEPARTMENT_HEAD" };
}

export interface PendingCorrection {
  id: string;
  reason: string;
  requested_at: string;
  original_record_id: string;
  replacement_record_id: string;
  requested_by: string;
}

export async function getPendingCorrections(): Promise<PendingCorrection[]> {
  const access = await getCurrentAccess();
  if (!access?.canApprove) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("correction_requests").select("id,reason,requested_at,original_record_id,replacement_record_id,requested_by").eq("status", "PENDING").order("requested_at");
  if (error) throw new Error(`Không tải được đính chính chờ duyệt: ${error.message}`);
  return data ?? [];
}

export async function getApprovalQueue(): Promise<ApprovalPeriod[]> {
  const access = await getCurrentAccess();
  if (!access?.canApprove) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("register_periods")
    .select("id,period_label,period_start,period_end,status,lock_version,returned_reason,approved_at,approved_by,locations(name,code),assets(source_name),form_template_versions(form_templates(code,name))")
    .eq("status", "READY_FOR_REVIEW").order("period_start", { ascending: true });
  if (error) throw new Error(`Không tải được hàng đợi phê duyệt: ${error.message}`);
  return (data ?? []) as unknown as ApprovalPeriod[];
}

export async function getApprovalPeriod(id: string): Promise<{ period: ApprovalPeriod; summary: ReviewSummary; exceptions: Array<{ id: string; type: string; label: string }> } | null> {
  const access = await getCurrentAccess();
  if (!access?.canApprove) return null;
  const supabase = await createClient();
  const [{ data: period, error: periodError }, { data: occurrences, error: occurrenceError }, { data: measurements, error: measurementError }, { data: broken, error: brokenError }, { data: actions, error: actionError }] = await Promise.all([
    supabase.from("register_periods").select("id,period_label,period_start,period_end,status,lock_version,returned_reason,approved_at,approved_by,locations(name,code),assets(source_name),form_template_versions(form_templates(code,name))").eq("id", id).single(),
    supabase.from("schedule_occurrences").select("id,status,fulfilled_by_record_id").eq("period_id", id),
    supabase.from("measurement_details").select("record_id,temperature_abnormal,humidity_abnormal,records!inner(period_id)").eq("records.period_id", id),
    supabase.from("equipment_shift_statuses").select("shift_record_id,asset_label_snapshot,status_code,equipment_shift_details!inner(records!inner(period_id))").eq("equipment_shift_details.records.period_id", id).eq("status_code", "H"),
    supabase.from("period_actions").select("action").eq("period_id", id).eq("action", "RETURN"),
  ]);
  if (periodError) return null;
  if (occurrenceError || measurementError || brokenError || actionError) throw new Error("Không tải được dữ liệu rà soát kỳ");
  const all = occurrences ?? [];
  const abnormal = (measurements ?? []).filter(item => item.temperature_abnormal || item.humidity_abnormal);
  const exceptions = [
    ...all.filter(item => item.status === "N_A").map(item => ({ id: item.id, type: "N/A", label: "Nghĩa vụ được đánh dấu Không áp dụng" })),
    ...abnormal.map(item => ({ id: item.record_id, type: "Bất thường", label: "Giá trị vượt ngưỡng" })),
    ...(broken ?? []).map(item => ({ id: item.shift_record_id, type: "Máy hỏng", label: item.asset_label_snapshot })),
  ];
  return {
    period: period as unknown as ApprovalPeriod,
    summary: {
      total: all.length,
      completed: all.filter(item => item.status === "COMPLETED").length,
      na: all.filter(item => item.status === "N_A").length,
      pending: all.filter(item => item.status === "PENDING").length,
      abnormal: abnormal.length,
      broken: (broken ?? []).length,
      returned: (actions ?? []).length > 0,
    },
    exceptions,
  };
}

export async function getCorrectionContext(recordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("records")
    .select("id,record_type,business_date,slot_code,note,revision_no,is_effective,period_id,register_periods!inner(status),measurement_details(temperature_c,humidity_pct),decontamination_details(daily_done,weekly_done,spill_event_done),maintenance_details(cadence,result),equipment_shift_details(usage_value,usage_unit,equipment_shift_statuses(asset_id,asset_display_order_snapshot,status_code,asset_label_snapshot))")
    .eq("id", recordId).eq("register_periods.status", "APPROVED").maybeSingle();
  if (error) throw new Error(`Không tải được bản ghi đính chính: ${error.message}`);
  return data;
}
