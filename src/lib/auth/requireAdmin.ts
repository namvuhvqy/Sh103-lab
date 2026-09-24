import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("active,is_admin").eq("user_id", user.id).maybeSingle();
  if (!profile?.active || !profile.is_admin) redirect("/?error=forbidden");
  return { supabase, user };
}
