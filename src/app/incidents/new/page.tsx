import { AppShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getIncidentCategories, getUnreadNotificationCount } from "@/lib/p5/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { NewIncidentForm } from "@/components/incidents/NewIncidentForm";

export const dynamic = "force-dynamic";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams?: Promise<{ assetId?: string }>;
}) {
  const params = await searchParams;
  const defaultAssetId = params?.assetId;
  const supabase = await createClient();

  const [categories, unread, access, { data: locations }, { data: assets }] = await Promise.all([
    getIncidentCategories(),
    getUnreadNotificationCount(),
    getCurrentAccess(),
    supabase.from("locations").select("id,name").eq("active", true).order("sort_order"),
    supabase.from("assets").select("id,source_name,locations(name)").eq("active", true).order("source_order"),
  ]);

  return (
    <AppShell
      headerTitle="Tạo báo cáo sự cố"
      headerSubtitle="Nhập thủ công & Chụp ảnh hiện trường"
      unreadCount={unread}
      isAdmin={access?.isAdmin}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">
            Incident Reporting
          </p>
          <h1 className="clinical-page-title mt-1 text-2xl font-black text-slate-900">
            Tạo báo cáo sự cố
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Ghi nhận thông tin &amp; chụp ảnh hiện trường. Không nhập tên, mã bệnh án hoặc thông tin nhận diện người bệnh.
          </p>
        </section>

        <NewIncidentForm
          categories={categories}
          locations={locations ?? []}
          assets={assets ?? []}
          defaultAssetId={defaultAssetId}
        />
      </div>
    </AppShell>
  );
}
