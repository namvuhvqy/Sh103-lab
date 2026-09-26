"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);

export async function markPeriodReadyAction(form: FormData) {
  const id = text(form, "periodId");
  const lock = Number(text(form, "lockVersion"));
  if (!id || !Number.isInteger(lock)) fail(`/periods/${id}`, "Dữ liệu kỳ không hợp lệ");
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_period_ready", { target_period_id: id, target_expected_lock: lock });
  if (error) fail(`/periods/${id}`, error.message);
  revalidatePath(`/periods/${id}`);
  revalidatePath("/approvals");
  redirect(`/periods/${id}?saved=ready`);
}

export async function returnPeriodAction(form: FormData) {
  const id = text(form, "periodId");
  const reason = text(form, "reason");
  const lock = Number(text(form, "lockVersion"));
  const path = `/periods/${id}/review`;
  if (!reason) fail(path, "Lý do trả lại là bắt buộc");
  const supabase = await createClient();
  const { error } = await supabase.rpc("return_period", { target_period_id: id, target_reason: reason, target_expected_lock: lock });
  if (error) fail(path, error.message);
  revalidatePath(path);
  revalidatePath("/approvals");
  redirect(`/periods/${id}?saved=returned`);
}

export async function approvePeriodAction(form: FormData) {
  const id = text(form, "periodId");
  const lock = Number(text(form, "lockVersion"));
  const path = `/periods/${id}/review`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_period", { target_period_id: id, target_expected_lock: lock });
  if (error) fail(path, error.message);
  revalidatePath(path);
  revalidatePath("/approvals");
  redirect(`/periods/${id}?saved=approved`);
}

export async function approveCorrectionAction(form: FormData) {
  const id = text(form, "correctionId");
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_correction", { target_correction_id: id });
  if (error) fail("/approvals", error.message);
  revalidatePath("/approvals");
  redirect("/approvals?saved=correction-approved");
}

export async function batchApprovePeriodsAction(form: FormData) {
  const periodIdsRaw = text(form, "periodIds");
  const periodIds = periodIdsRaw ? periodIdsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (!periodIds.length) fail("/approvals", "Vui lòng chọn ít nhất 1 kỳ để phê duyệt");

  const supabase = await createClient();
  let successCount = 0;
  const errors: string[] = [];

  for (const id of periodIds) {
    const { data: p } = await supabase.from("register_periods").select("lock_version,status").eq("id", id).single();
    if (p && p.status === "READY_FOR_REVIEW") {
      const { error } = await supabase.rpc("approve_period", {
        target_period_id: id,
        target_expected_lock: p.lock_version,
      });
      if (!error) {
        successCount++;
      } else {
        errors.push(error.message);
      }
    }
  }

  revalidatePath("/approvals");
  revalidatePath("/reports");
  if (errors.length && successCount === 0) {
    fail("/approvals", `Phê duyệt thất bại: ${errors[0]}`);
  }
  redirect(`/approvals?saved=batch_approved_${successCount}`);
}

