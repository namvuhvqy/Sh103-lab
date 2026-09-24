"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optionalNumber = (raw: string) => raw === "" ? undefined : Number(raw);

export async function createCorrectionAction(form: FormData) {
  const recordId = value(form, "recordId");
  const reason = value(form, "reason");
  const path = `/records/${recordId}/correction`;
  if (!reason) redirect(`${path}?error=${encodeURIComponent("Lý do đính chính là bắt buộc")}`);
  const recordType = value(form, "recordType");
  const changes: Record<string, string | number | boolean | Array<{ asset_id: string; status: string }>> = {};
  for (const key of ["note", "cadence", "result", "usage_unit"] as const) {
    const raw = value(form, key); if (raw) changes[key] = raw;
  }
  for (const key of ["temperature_c", "humidity_pct", "usage_value"] as const) {
    const parsed = optionalNumber(value(form, key)); if (parsed !== undefined && Number.isFinite(parsed)) changes[key] = parsed;
  }
  if (recordType === "DECONTAMINATION") {
    for (const key of ["daily_done", "weekly_done", "spill_event_done"] as const) changes[key] = form.has(key);
  }
  if (recordType === "EQUIPMENT_SHIFT") {
    changes.statuses = [...form.entries()].filter(([key]) => key.startsWith("status:")).map(([key, status]) => ({ asset_id: key.slice(7), status: String(status) }));
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_correction", { target_record_id: recordId, target_reason: reason, target_changes: changes });
  if (error) redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/records/${recordId}`);
  redirect(`/records/${recordId}?saved=correction`);
}
