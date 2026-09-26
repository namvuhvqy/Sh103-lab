export function WorkflowFeedback({ error, saved }: { error?: string; saved?: string }) {
  if (error) return <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>;
  const labels: Record<string, string> = { ready: "Đã gửi kỳ chờ phê duyệt.", returned: "Đã trả lại kỳ để chỉnh sửa.", approved: "Đã phê duyệt kỳ.", correction: "Đã tạo đề nghị đính chính.", "correction-approved": "Đã xác nhận đính chính." };
  return saved && labels[saved] ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{labels[saved]}</p> : null;
}
