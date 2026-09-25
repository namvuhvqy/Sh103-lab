import { createClient } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  recipient_user_id: string;
  kind: string;
  title: string;
  body: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  target_url: string | null;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
  source_type: string | null;
  source_id: string | null;
  idempotency_key: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  audience_type: "ALL" | "ROLE" | "LOCATION" | "USER";
  audience_ref: string | null;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  publish_at: string;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  published_at: string | null;
  creator_profile?: { full_name: string; email?: string } | null;
}

export interface IncidentCategory {
  id: string;
  code: string;
  name: string;
  active: boolean;
  sort_order: number;
}

export interface IncidentItem {
  id: string;
  incident_code: string;
  business_date: string;
  occurred_at: string;
  reported_at: string;
  reporter_user_id: string;
  location_id: string | null;
  asset_id: string | null;
  category_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  immediate_action: string | null;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  linked_record_id: string | null;
  updated_at: string;
  lock_version: number;
  reporter?: { full_name: string; email?: string } | null;
  resolver?: { full_name: string; email?: string } | null;
  category?: { name: string; code: string } | null;
  location?: { name: string; code: string } | null;
  asset?: { source_name: string; source_code: string | null } | null;
}

export interface IncidentEventItem {
  id: string;
  incident_id: string;
  action: "CREATE" | "EDIT" | "IN_REVIEW" | "RESOLVE" | "CLOSE";
  actor_user_id: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
  actor?: { full_name: string; email?: string } | null;
}

export async function getNotifications(filter?: "all" | "unread" | "critical"): Promise<NotificationItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "unread") {
    query = query.is("read_at", null);
  } else if (filter === "critical") {
    query = query.in("severity", ["WARNING", "CRITICAL"]);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Không tải được thông báo: ${error.message}`);
  return (data ?? []) as NotificationItem[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function getAdminAnnouncements(): Promise<AnnouncementItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*, creator_profile:profiles!announcements_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    // fallback if relation name differs
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (fallbackError) throw new Error(`Không tải được danh sách thông báo admin: ${fallbackError.message}`);
    return (fallbackData ?? []) as AnnouncementItem[];
  }
  return (data ?? []) as AnnouncementItem[];
}

export async function getIncidentCategories(): Promise<IncidentCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incident_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Không tải được danh mục sự cố: ${error.message}`);
  return (data ?? []) as IncidentCategory[];
}

export async function getIncidents(options?: {
  status?: string;
  severity?: string;
  locationId?: string;
}): Promise<IncidentItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("incidents")
    .select(`
      *,
      reporter:profiles!incidents_reporter_user_id_fkey(full_name),
      resolver:profiles!incidents_resolved_by_fkey(full_name),
      category:incident_categories(name, code),
      location:locations(name, code),
      asset:assets(source_name, source_code)
    `)
    .order("reported_at", { ascending: false });

  if (options?.status && options.status !== "ALL") {
    query = query.eq("status", options.status);
  }
  if (options?.severity && options.severity !== "ALL") {
    query = query.eq("severity", options.severity);
  }
  if (options?.locationId && options.locationId !== "ALL") {
    query = query.eq("location_id", options.locationId);
  }

  const { data, error } = await query;
  if (error) {
    // fallback query without foreign key aliasing if strict syntax differs
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("incidents")
      .select(`
        *,
        category:incident_categories(name, code),
        location:locations(name, code),
        asset:assets(source_name, source_code)
      `)
      .order("reported_at", { ascending: false });
    if (fallbackError) throw new Error(`Không tải được danh sách sự cố: ${fallbackError.message}`);
    return (fallbackData ?? []) as IncidentItem[];
  }
  return (data ?? []) as IncidentItem[];
}

export async function getIncidentDetail(id: string): Promise<{
  incident: IncidentItem;
  events: IncidentEventItem[];
} | null> {
  const supabase = await createClient();
  const [{ data: incident, error: incError }, { data: events, error: evError }] = await Promise.all([
    supabase
      .from("incidents")
      .select(`
        *,
        reporter:profiles!incidents_reporter_user_id_fkey(full_name),
        resolver:profiles!incidents_resolved_by_fkey(full_name),
        category:incident_categories(name, code),
        location:locations(name, code),
        asset:assets(source_name, source_code)
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("incident_events")
      .select(`
        *,
        actor:profiles!incident_events_actor_user_id_fkey(full_name)
      `)
      .eq("incident_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (incError) throw new Error(`Không tải được chi tiết sự cố: ${incError.message}`);
  if (evError) throw new Error(`Không tải được lịch sử sự cố: ${evError.message}`);
  if (!incident) return null;

  return {
    incident: incident as unknown as IncidentItem,
    events: (events ?? []) as unknown as IncidentEventItem[],
  };
}
