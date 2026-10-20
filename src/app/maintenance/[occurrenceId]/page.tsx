import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";
import { getMaintenanceOccurrenceDetail } from "@/lib/maintenance/queries";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { getUnreadNotificationCount } from "@/lib/p5/queries";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ occurrenceId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const id = (await params).occurrenceId;
  const query = await searchParams;

  const [detail, unreadCount, access] = await Promise.all([
    getMaintenanceOccurrenceDetail(id),
    getUnreadNotificationCount().catch(() => 0),
    getCurrentAccess().catch(() => null),
  ]);

  if (!detail) notFound();

  const { occurrence, cadence, assetName, record } = detail;
  const backDate = occurrence.business_date || "";

  return (
    <AppShell
      headerTitle="Bảo dưỡng thiết bị"
      headerSubtitle="BM.02/QL.TRTB.01"
      unreadCount={unreadCount}
      isAdmin={access?.isAdmin}
    >
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <Link
            href={`/maintenance${backDate ? `?date=${backDate}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại danh sách bảo dưỡng</span>
          </Link>
          <div className="mt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800">BM.02/QL.TRTB.01</p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-900">
              {record ? "Xem & Sửa kết quả bảo dưỡng" : "Ghi nhận bảo dưỡng"}
            </h1>
          </div>
        </div>

        {query.error ? (
          <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900">
            ⚠ Lưu thất bại: {query.error}. Vui lòng thử lại.
          </div>
        ) : null}

        <div className="mt-4">
          <MaintenanceForm
            occurrenceId={occurrence.id}
            cadence={cadence}
            assetName={assetName}
            initialError={query.error}
            initialRecord={
              record
                ? {
                    performedAt: record.performedAt,
                    result: record.result,
                    note: record.note ?? "",
                    isCompleted: occurrence.status === "COMPLETED",
                  }
                : undefined
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
