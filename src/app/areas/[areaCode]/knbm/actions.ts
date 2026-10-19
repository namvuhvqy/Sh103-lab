"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  const isAjax = form.get("ajax") === "1";
  const area = String(form.get("areaCode") ?? "");
  const daily = form.get("daily") === "on";
  const weekly = form.get("weekly") === "on";
  const spill = form.get("spill") === "on";
  const validation = validateDecontamination({ daily, weekly, spill });
  if (!validation.ok) {
    if (isAjax) return { success: false, error: validation.error };
    fail(form, area, validation.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_decontamination_record", {
    target_period_id: String(form.get("periodId")),
    target_business_date: String(form.get("businessDate")),
    target_daily: daily,
    target_weekly: weekly,
    target_spill: spill,
    target_note: String(form.get("note") || "") || null,
  });
  if (error) {
    const errorMsg = error.message ? `Lỗi hệ thống: ${error.message}` : "Không thể lưu khử nhiễm. Vui lòng tải lại và thử lại.";
    if (isAjax) return { success: false, error: errorMsg };
    fail(form, area, errorMsg);
  }

  try {
    revalidatePath("/decontamination");
    revalidatePath("/");
    revalidatePath("/quick-duty");
    revalidatePath("/dashboard");
    revalidatePath("/approvals");
  } catch {
    // Revalidation may be a no-op in standalone test environments
  }

  if (isAjax) return { success: true, saved: area };
  redirect(safeReturnTo(form, area, { saved: area }));
}
