import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";
import { getOccurrence } from "@/lib/forms/queries";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ occurrenceId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const id = (await params).occurrenceId;
  const query = await searchParams;
  const occurrence = await getOccurrence(id);
  if (!occurrence) notFound();

  const period = occurrence.register_periods;
  const cadence = occurrence.slot_code as "DAILY" | "WEEKLY" | "MONTHLY";

  return (
    <AppShell headerTitle="Bảo dưỡng thiết bị">
      <div className="mx-auto max-w-xl space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">BM.02/QL.TRTB.01</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Ghi nhận bảo dưỡng</h1>
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
            assetName={period.assets?.source_name ?? "Thiết bị"}
            initialError={query.error}
          />
        </div>
      </div>
    </AppShell>
  );
}
