import { AppShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getIncidents, getIncidentCategories, getUnreadNotificationCount } from "@/lib/p5/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getIncidentPhotoMap } from "@/lib/incidents/photos";
import { IncidentsUnifiedView } from "@/components/incidents/IncidentsUnifiedView";

export const dynamic = "force-dynamic";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"].includes(params.status ?? "")
    ? params.status!
    : "ALL";
  const supabase = await createClient();

  const [items, unread, categories, access, { data: locations }, { data: assets }] = await Promise.all([
    getIncidents({ status }),
    getUnreadNotificationCount(),
    getIncidentCategories(),
    getCurrentAccess(),
    supabase.from("locations").select("id,name").eq("active", true).order("sort_order"),
    supabase.from("assets").select("id,source_name").eq("active", true).order("source_order"),
  ]);

  const photoMap = await getIncidentPhotoMap(items.map((i) => i.id));

  return (
    <AppShell
      headerTitle="Báo cáo sự cố"
      headerSubtitle="Theo dõi & Giám sát an toàn PXN"
      unreadCount={unread}
      isAdmin={access?.isAdmin}
    >
      <IncidentsUnifiedView
        initialIncidents={items}
        photoMap={photoMap}
        currentStatus={status}
        categories={categories}
        locations={locations ?? []}
        assets={assets ?? []}
        canApprove={access?.canApprove}
      />
    </AppShell>
  );
}
