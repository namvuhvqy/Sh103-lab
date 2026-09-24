export function TasksFeedback({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    return <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>;
  }
  if (saved === "na") {
    return <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Đã đánh dấu Không áp dụng.</p>;
  }
  return null;
}
