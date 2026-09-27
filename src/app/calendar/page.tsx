import { redirect } from "next/navigation";

// Legacy URL retained only for saved links. Duty selection and self-assignment now live in /quick-duty.
export default function CalendarPage() {
  redirect("/quick-duty");
}
