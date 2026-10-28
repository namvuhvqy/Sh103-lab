import { createClient } from "@/lib/supabase/server";

export interface LogAuditEventParams {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  requestId?: string | null;
}

/**
 * Appends an immutable audit event according to ISO 15189 compliance.
 * Handles errors gracefully to avoid disrupting the primary clinical workflow.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("audit_event", {
      target_action: params.action,
      target_entity_type: params.entityType,
      target_entity_id: params.entityId,
      target_before: params.beforeData ?? null,
      target_after: params.afterData ?? null,
    });
    if (rpcError && typeof supabase.from === "function") {
      const { error: insertError } = await supabase.from("audit_events").insert({
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        actor_user_id: params.actorUserId ?? null,
        before_data: params.beforeData ?? null,
        after_data: params.afterData ?? null,
        request_id: params.requestId ?? null,
      });
      if (insertError) {
        console.warn("[logAuditEvent] Supabase warning:", insertError.message);
      }
    }
  } catch (err) {
    console.warn("[logAuditEvent] Execution error:", err);
  }
}
