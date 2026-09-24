import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ShiftRegisterForm } from "@/components/forms/ShiftRegisterForm";
import { getBm06Occurrence } from "@/lib/forms/context";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ occurrenceId: string }> }) {
  const data = await getBm06Occurrence((await params).occurrenceId);
  if (!data) notFound();
  return <AppShell headerTitle="Nhật ký ca BM.06"><div className="mx-auto max-w-3xl"><p className="text-sm font-bold text-blue-800">BM.06/QL.TRTB.01 · {data.occurrence.business_date} · {data.occurrence.slot_code}</p><h1 className="mt-1 text-3xl font-bold">Nhập trạng thái 25 máy</h1><p className="mt-2 text-slate-600">BT = Bình thường · KSD = Không sử dụng · H = Hỏng</p><div className="mt-6"><ShiftRegisterForm occurrenceId={data.occurrence.id} assets={data.assets} initialStatuses={data.initialStatuses} lockVersion={data.lockVersion} /></div></div></AppShell>;
}
