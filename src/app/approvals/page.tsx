import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowFeedback } from "@/components/forms/WorkflowFeedback";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { approveCorrectionAction } from "@/app/periods/actions";
import { getPeriods } from "@/lib/forms/queries";
import { getApprovalQueue, getCurrentAccess, getPendingCorrections } from "@/lib/forms/workflow";
import { CheckCircle2, Clock3, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; tab?: string }> }) {
  const query = await searchParams;
  const access = await getCurrentAccess();
  if (!access?.canApprove) redirect("/?error=approval_denied");
  const [periods, corrections, allPeriods] = await Promise.all([getApprovalQueue(), getPendingCorrections(), getPeriods()]);
  const approved = allPeriods.filter((period) => period.status === "APPROVED");
  const returned = allPeriods.filter((period) => period.status === "RETURNED");
  const tab = query.tab === "approved" || query.tab === "returned" ? query.tab : "pending";
  const visible = tab === "approved" ? approved : tab === "returned" ? returned : periods;
  return <AppShell headerTitle="Trung tâm phê duyệt" headerSubtitle="Theo kỳ / sổ · Trưởng khoa" isAdmin={access.isAdmin}>
    <div className="space-y-4">
      <section><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-teal-700">Approval Center</p><h1 className="clinical-page-title mt-1">Phê duyệt hồ sơ</h1><p className="mt-1 text-xs text-slate-500">Quyết định áp dụng cho toàn kỳ/sổ; không phê duyệt từng bản ghi ngày.</p></section>
      <WorkflowFeedback error={query.error} saved={query.saved} />
      <SegmentedControl active={tab === "approved" ? "Đã phê duyệt" : tab === "returned" ? "Bị trả lại" : "Chờ phê duyệt"} items={[{label:"Chờ phê duyệt",href:"/approvals",count:periods.length+corrections.length},{label:"Đã phê duyệt",href:"/approvals?tab=approved",count:approved.length},{label:"Bị trả lại",href:"/approvals?tab=returned",count:returned.length}]} />
      <div className="grid grid-cols-3 gap-2"><div className="clinical-card p-3"><Clock3 className="size-4 text-amber-700"/><p className="mt-2 text-[10px] font-bold text-slate-500">Chờ duyệt</p><b className="text-xl text-amber-800">{periods.length+corrections.length}</b></div><div className="clinical-card p-3"><CheckCircle2 className="size-4 text-emerald-700"/><p className="mt-2 text-[10px] font-bold text-slate-500">Đã duyệt</p><b className="text-xl text-emerald-800">{approved.length}</b></div><div className="clinical-card p-3"><RotateCcw className="size-4 text-red-700"/><p className="mt-2 text-[10px] font-bold text-slate-500">Trả lại</p><b className="text-xl text-red-800">{returned.length}</b></div></div>
      <section><div className="flex items-end justify-between"><div><h2 className="clinical-section-title">{tab === "pending" ? "Kỳ chờ phê duyệt" : tab === "approved" ? "Kỳ đã phê duyệt" : "Kỳ bị trả lại"}</h2><p className="mt-1 text-xs text-slate-500">{visible.length} kỳ trong phạm vi chuyên môn</p></div></div><div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{visible.map(period => { const template=period.form_template_versions.form_templates; return <article key={period.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black text-teal-700">{template.code} · {period.status}</p><h3 className="mt-1 text-sm font-black text-slate-950">{template.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"} · {period.period_label}</p>{period.returned_reason ? <p className="mt-2 rounded-xl bg-red-50 p-2 text-xs font-semibold text-red-800">Lý do: {period.returned_reason}</p> : null}</div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${period.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : period.status === "RETURNED" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{period.status === "APPROVED" ? "Đã phê duyệt" : period.status === "RETURNED" ? "Bị trả lại" : "Chờ duyệt"}</span></div><Link href={period.status === "READY_FOR_REVIEW" ? `/periods/${period.id}/review` : `/periods/${period.id}`} className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-teal-800 px-4 text-xs font-bold text-white">{period.status === "READY_FOR_REVIEW" ? "Rà soát & Phê duyệt" : "Xem chi tiết"}</Link></article>})}{visible.length===0?<p className="p-8 text-center text-sm text-slate-600">Không có kỳ phù hợp trạng thái này.</p>:null}</div></section>
      {tab === "pending" ? <section><h2 className="clinical-section-title">Đính chính chờ xác nhận</h2><div className="mt-3 space-y-2">{corrections.map(item=><article key={item.id} className="clinical-card p-4"><p className="text-[10px] font-black text-amber-800">ĐÍNH CHÍNH CHỜ DUYỆT</p><p className="mt-2 text-sm font-semibold">{item.reason}</p><div className="mt-3 flex flex-wrap gap-3"><Link href={`/records/${item.original_record_id}`} className="inline-flex min-h-10 items-center text-xs font-bold text-blue-800">Xem bản gốc</Link><Link href={`/records/${item.replacement_record_id}`} className="inline-flex min-h-10 items-center text-xs font-bold text-blue-800">Xem bản mới</Link><form action={approveCorrectionAction}><input type="hidden" name="correctionId" value={item.id}/><button className="min-h-10 rounded-xl bg-emerald-800 px-4 text-xs font-bold text-white">Xác nhận đính chính</button></form></div></article>)}{corrections.length===0?<p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-600">Không có đính chính chờ xác nhận.</p>:null}</div></section> : null}
    </div>
  </AppShell>;
}
