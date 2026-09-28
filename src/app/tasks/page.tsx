import { redirect } from "next/navigation";

// Legacy task screen retired: all operational work is handled inside /quick-duty.
export default function TasksPage() {
  redirect("/quick-duty");
}
