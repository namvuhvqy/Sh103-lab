"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateDecontamination } from "@/lib/forms/validation";

function safeReturnTo(form: FormData, areaCode: string, params: Record<string, string>) {
  const raw = String(form.get("returnTo") ?? "");
  const fallback = `/decontamination?date=${encodeURIComponent(String(form.get("businessDate") ?? ""))}&shift=${encodeURIComponent(String(form.get("shift") ?? ""))}#knbm-${encodeURIComponent(areaCode)}`;
  const target = raw.startsWith("/decontamination") ? raw : fallback;
  const [pathAndQuery, hash = `knbm-${encodeURIComponent(areaCode)}`] = target.split("#");
  const [path, queryString = ""] = pathAndQuery.split("?");
  const query = new URLSearchParams(queryString);
  for (const [key, value] of Object.entries(params)) query.set(key, value);
  return `${path}?${query.toString()}#${hash}`;
}

const fail = (form: FormData, area: string, message: string): never => {
  redirect(safeReturnTo(form, area, { error: message }));
};

export async function saveDecontaminationAction(form: FormData) {
  const area = String(form.get("areaCode") ?? "");
  const daily = form.get("daily") === "on";
  const weekly = form.get("weekly") === "on";
  const spill = form.get("spill") === "on";
  const validation = validateDecontamination({ daily, weekly, spill });
  if (!validation.ok) fail(form, area, validation.error);

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_decontamination_record", {
    target_period_id: String(form.get("periodId")),
    target_business_date: String(form.get("businessDate")),
    target_daily: daily,
    target_weekly: weekly,
    target_spill: spill,
    target_note: String(form.get("note") || "") || null,
  });
  if (error) fail(form, area, "Không thể lưu khử nhiễm. Vui lòng tải lại và thử lại.");
  redirect(safeReturnTo(form, area, { saved: area }));
}
