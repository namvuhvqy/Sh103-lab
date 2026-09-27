import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KnbmPage({
  params,
  searchParams,
}: {
  params: Promise<{ areaCode: string }>;
  searchParams: Promise<{ date?: string; shift?: string; slot?: string }>;
}) {
  const { areaCode } = await params;
  const query = await searchParams;
  const paramsOut = new URLSearchParams();
  if (query.date) paramsOut.set("date", query.date);
  if (query.shift ?? query.slot) paramsOut.set("shift", query.shift ?? query.slot ?? "");
  const suffix = paramsOut.toString() ? `?${paramsOut.toString()}` : "";
  redirect(`/decontamination${suffix}#knbm-${encodeURIComponent(areaCode)}`);
}
