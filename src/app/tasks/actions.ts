"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fail = (message: string, area: string): never => {
  const params = new URLSearchParams({ error: message });
  if (area && area !== "ALL") params.set("area", area);
  redirect(`/tasks?${params}`);
};


export async function markOccurrenceNaAction(formData: FormData) {
  const occurrenceId = String(formData.get("occurrenceId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const area = String(formData.get("area") ?? "ALL");
  if (!occurrenceId || !reason) fail("Lý do Không áp dụng là bắt buộc", area);

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_occurrence_na", {
    target_occurrence_id: occurrenceId,
    target_reason: reason,
  });
  if (error) fail(error.message, area);

  revalidatePath("/tasks");
  redirect("/tasks?saved=na");
}
