import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { WorkflowFeedback } from "@/components/forms/WorkflowFeedback";
import { SegmentedControl } from "@/components/p5/SegmentedControl";
import { approveCorrectionAction } from "@/app/periods/actions";
import { getPeriods } from "@/lib/forms/queries";
import { getApprovalQueue, getCurrentAccess, getPendingCorrections } from "@/lib/forms/workflow";
import { BatchApprovalSection } from "@/components/approvals/BatchApprovalSection";
import { ComplianceAuditHeatmap } from "@/components/approvals/ComplianceAuditHeatmap";
import { CheckCircle2, Clock3, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

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

  return (
    <AppShell headerTitle="Trung tâm phê duyệt" headerSubtitle="Theo kỳ / sổ · Trưởng khoa" isAdmin={access.isAdmin}>
      <div className="space-y-4">
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-teal-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-800 border border-teal-200">
                <ShieldCheck className="size-3 text-teal-700" />
                ISO 15189:2022 · Approval Center
              </span>
            </div>
            <h1 className="clinical-page-title mt-1.5 text-2xl font-black text-slate-900">
              Phê duyệt hồ sơ &amp; Kiểm soát vùng trống
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Quyết định áp dụng cho toàn kỳ/sổ · Lãnh đạo BMK phê duyệt hàng loạt theo Ngày, Tuần, Tháng chỉ trong 1 màn hình.
            </p>
          </div>
        </section>

        <WorkflowFeedback error={query.error} saved={query.saved} />

        {/* 1. Bảng kiểm soát vùng trống biểu mẫu 7 ngày qua (Heatmap) */}
        <ComplianceAuditHeatmap />

        {/* KPI Tóm tắt */}
        <div className="grid grid-cols-3 gap-2">
          <div className="clinical-card p-3 border-amber-200 bg-amber-50/40">
            <Clock3 className="size-4 text-amber-700" />
            <p className="mt-2 text-[10px] font-bold text-slate-500">Chờ duyệt</p>
            <b className="text-xl text-amber-800">{periods.length + corrections.length}</b>
          </div>
          <div className="clinical-card p-3 border-emerald-200 bg-emerald-50/40">
            <CheckCircle2 className="size-4 text-emerald-700" />
            <p className="mt-2 text-[10px] font-bold text-slate-500">Đã duyệt</p>
            <b className="text-xl text-emerald-800">{approved.length}</b>
          </div>
          <div className="clinical-card p-3 border-red-200 bg-red-50/40">
            <RotateCcw className="size-4 text-red-700" />
            <p className="mt-2 text-[10px] font-bold text-slate-500">Trả lại</p>
            <b className="text-xl text-red-800">{returned.length}</b>
          </div>
        </div>

        {/* Tabs chuyển trạng thái */}
        <SegmentedControl
          active={tab === "approved" ? "Đã phê duyệt" : tab === "returned" ? "Bị trả lại" : "Chờ phê duyệt"}
          items={[
            { label: "Chờ phê duyệt", href: "/approvals", count: periods.length + corrections.length },
            { label: "Đã phê duyệt", href: "/approvals?tab=approved", count: approved.length },
            { label: "Bị trả lại", href: "/approvals?tab=returned", count: returned.length },
          ]}
        />

        {/* 2. Danh sách kỳ kèm tính năng Phê duyệt hàng loạt */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="clinical-section-title">
                {tab === "pending"
                  ? "Kỳ chờ phê duyệt (Hỗ trợ duyệt hàng loạt)"
                  : tab === "approved"
                  ? "Kỳ đã phê duyệt chính thức"
                  : "Kỳ bị trả lại cần sửa đổi"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {visible.length} kỳ trong phạm vi chuyên môn được ủy quyền
              </p>
            </div>
          </div>

          <BatchApprovalSection
            periods={visible}
            canApprove={access.canApprove}
          />
        </section>

        {/* Đính chính chờ xác nhận */}
        {tab === "pending" ? (
          <section>
            <h2 className="clinical-section-title">Đính chính chờ xác nhận</h2>
            <div className="mt-3 space-y-2">
              {corrections.map((item) => (
                <article key={item.id} className="clinical-card p-4">
                  <p className="text-[10px] font-black text-amber-800">ĐÍNH CHÍNH CHỜ DUYỆT</p>
                  <p className="mt-2 text-sm font-semibold">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={`/records/${item.original_record_id}`}
                      className="inline-flex min-h-10 items-center text-xs font-bold text-teal-800 hover:underline"
                    >
                      Xem bản gốc
                    </Link>
                    <Link
                      href={`/records/${item.replacement_record_id}`}
                      className="inline-flex min-h-10 items-center text-xs font-bold text-teal-800 hover:underline"
                    >
                      Xem bản mới
                    </Link>
                    <form action={approveCorrectionAction}>
                      <input type="hidden" name="correctionId" value={item.id} />
                      <button className="min-h-10 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 text-xs font-bold text-white transition shadow-xs">
                        Xác nhận đính chính
                      </button>
                    </form>
                  </div>
                </article>
              ))}
              {corrections.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-500">
                  Không có yêu cầu đính chính nào chờ xác nhận.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

