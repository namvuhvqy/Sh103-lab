"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function markOccurrenceNaAction(formData: FormData) {
  const occurrenceId = String(formData.get("occurrenceId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!occurrenceId || !reason) throw new Error("Lý do Không áp dụng là bắt buộc");
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_occurrence_na", { target_occurrence_id: occurrenceId, target_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  redirect("/tasks?saved=na");
}
