import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ areaCode: string }>;
}) {
  const { areaCode } = await params;
  redirect(`/areas?area=${encodeURIComponent(areaCode)}`);
}
