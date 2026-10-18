import { redirect } from "next/navigation";

export default async function ApprovalsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  params.set("tab", "forms");
  for (const [k, v] of Object.entries(query)) {
    if (v) params.set(k, v);
  }
  redirect(`/reports?${params.toString()}`);
}
