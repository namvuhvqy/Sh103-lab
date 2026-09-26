import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentAccess } from "@/lib/forms/workflow";
import { transitionIncidentAction } from "@/lib/p5/actions";
import { getIncidentDetail, getUnreadNotificationCount } from "@/lib/p5/queries";
import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = { OPEN: "Mới báo cáo", IN_REVIEW: "Đang xem xét", RESOLVED: "Đã xử lý", CLOSED: "Đã đóng" };

export default async function IncidentDetailPage({ params, searchParams }: { params: Promise<{ incidentId: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ incidentId }, query] = await Promise.all([params, searchParams]);
  const [detail, unread, access] = await Promise.all([getIncidentDetail(incidentId), getUnreadNotificationCount(), getCurrentAccess()]);
  if (!detail) notFound();
  const canTransition = access?.canApprove === true;
  async function transition(formData: FormData) { "use server"; const target = String(formData.get("target_status")) as "IN_REVIEW" | "RESOLVED" | "CLOSED"; const result = await transitionIncidentAction(incidentId, target, String(formData.get("note") ?? "")); if (result.success) redirect(`/incidents/${incidentId}?saved=transitioned`); redirect(`/incidents/${incidentId}?error=${encodeURIComponent(result.error ?? "Không thể cập nhật")}`); }
  const next = detail.incident.status === "OPEN" ? "IN_REVIEW" : detail.incident.status === "IN_REVIEW" ? "RESOLVED" : detail.incident.status === "RESOLVED" ? "CLOSED" : null;
  return <AppShell headerTitle={detail.incident.incident_code} headerSubtitle={labels[detail.incident.status]} unreadCount={unread}>
    <div className="mx-auto max-w-4xl space-y-6">{query.saved ? <div role="status" className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">Đã lưu thay đổi.</div> : null}{query.error ? <div role="alert" className="rounded-2xl bg-red-50 p-4 font-bold text-red-800">{query.error}</div> : null}
      <section className="rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold text-teal-700">{detail.incident.category?.name} · {detail.incident.severity}</p><h1 className="mt-1 text-2xl font-black text-slate-950">{detail.incident.title}</h1><p className="mt-2 text-sm text-slate-500">{detail.incident.location?.name ?? detail.incident.asset?.source_name} · {new Date(detail.incident.occurred_at).toLocaleString("vi-VN")}</p></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-black text-teal-800">{labels[detail.incident.status]}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><h2 className="text-sm font-black text-slate-500">Mô tả</h2><p className="mt-1 whitespace-pre-wrap text-slate-800">{detail.incident.description}</p></div><div><h2 className="text-sm font-black text-slate-500">Xử trí ngay</h2><p className="mt-1 whitespace-pre-wrap text-slate-800">{detail.incident.immediate_action || "Chưa ghi nhận"}</p></div></div>{detail.incident.resolution_note ? <div className="mt-5 rounded-2xl bg-emerald-50 p-4"><b className="text-emerald-900">Kết luận xử lý</b><p className="mt-1 text-emerald-800">{detail.incident.resolution_note}</p></div> : null}</section>
      {canTransition && next ? <form action={transition} className="rounded-3xl border border-amber-100 bg-amber-50/60 p-6"><h2 className="font-black text-slate-950">Chuyển sang “{labels[next]}”</h2><p className="mt-1 text-sm text-slate-600">Chỉ Trưởng khoa thực hiện quyết định chuyên môn này.</p><input type="hidden" name="target_status" value={next} /><label className="mt-4 block"><span className="mb-1 block text-sm font-bold">Ghi chú bắt buộc</span><textarea name="note" required rows={3} className="w-full rounded-2xl border border-amber-200 bg-white p-4" /></label><button className="mt-3 min-h-11 rounded-2xl bg-teal-800 px-5 font-bold text-white">Xác nhận chuyển trạng thái</button></form> : null}
      <section><h2 className="text-xl font-black">Lịch sử xử lý</h2><div className="mt-4 space-y-3">{detail.events.map((event) => <article key={event.id} className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-50 text-teal-800">{event.to_status === "CLOSED" || event.to_status === "RESOLVED" ? <CheckCircle2 className="size-5" /> : event.to_status === "IN_REVIEW" ? <Clock3 className="size-5" /> : <CircleAlert className="size-5" />}</span><div><b>{event.action}</b><p className="text-sm text-slate-600">{event.note || "Khởi tạo báo cáo"}</p><time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("vi-VN")} · {event.actor?.full_name}</time></div></article>)}</div></section>
    </div>
  </AppShell>;
}
