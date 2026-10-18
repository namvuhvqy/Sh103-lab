import { createClient } from "../src/lib/supabase/server";

async function main() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${events?.length} audit events:`);
  for (const e of events ?? []) {
    console.log(`- [${e.created_at}] Action: ${e.action} | Entity: ${e.entity_type} | Actor: ${e.actor_user_id}`);
    console.log(`  After:`, JSON.stringify(e.after_data));
  }
}

main().catch(console.error);
