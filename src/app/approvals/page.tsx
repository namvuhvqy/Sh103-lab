import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowFeedback } from "@/components/forms/WorkflowFeedback";
import { approveCorrectionAction } from "@/app/periods/actions";
import { getApprovalQueue, getCurrentAccess, getPendingCorrections } from "@/lib/forms/workflow";

export const dynamic = "force-dynamic";
export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const access = await getCurrentAccess();
  if (!access?.canApprove) redirect("/?error=approval_denied");
  const [periods, corrections] = await Promise.all([getApprovalQueue(), getPendingCorrections()]);
  return <AppShell headerTitle="Chờ duyệt kỳ"><h1 className="text-3xl font-bold">Chờ duyệt kỳ</h1><p className="mt-2 text-slate-600">Kỳ và đính chính đang chờ Trưởng khoa rà soát.</p><WorkflowFeedback error={query.error} saved={query.saved}/><h2 className="mt-7 text-xl font-bold">Kỳ chờ phê duyệt</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{periods.map(period => { const template=period.form_template_versions.form_templates; return <article key={period.id} className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold text-blue-800">{template.code} · CHỜ PHÊ DUYỆT</p><h3 className="mt-1 font-bold">{template.name}</h3><p className="mt-2 text-sm text-slate-600">{period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} · {period.period_label}</p><Link href={`/periods/${period.id}/review`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 font-bold text-white">Rà soát & Phê duyệt</Link></article>})}{periods.length===0?<p className="rounded-2xl border border-dashed p-8 text-center text-slate-600 md:col-span-2">Không có kỳ nào đang chờ duyệt.</p>:null}</div><h2 className="mt-8 text-xl font-bold">Đính chính chờ xác nhận</h2><div className="mt-3 space-y-3">{corrections.map(item=><article key={item.id} className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold text-amber-800">ĐÍNH CHÍNH CHỜ DUYỆT</p><p className="mt-2 font-semibold">{item.reason}</p><div className="mt-3 flex flex-wrap gap-3"><Link href={`/records/${item.original_record_id}`} className="inline-flex min-h-11 items-center font-bold text-blue-800">Xem bản gốc</Link><Link href={`/records/${item.replacement_record_id}`} className="inline-flex min-h-11 items-center font-bold text-blue-800">Xem bản mới</Link><form action={approveCorrectionAction}><input type="hidden" name="correctionId" value={item.id}/><button className="min-h-11 rounded-xl bg-emerald-800 px-4 font-bold text-white">Xác nhận đính chính</button></form></div></article>)}{corrections.length===0?<p className="rounded-2xl border border-dashed p-6 text-center text-slate-600">Không có đính chính chờ duyệt.</p>:null}</div></AppShell>;
}
