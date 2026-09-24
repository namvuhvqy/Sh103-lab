import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { CalendarDays, ClipboardList, History, UserRound } from "lucide-react";

const links = [
  { href: "/calendar", label: "Lịch công việc", description: "Xem nghĩa vụ theo ngày", icon: CalendarDays },
  { href: "/general-tasks", label: "Công việc chung", description: "Môi trường, tủ mát và tủ đông", icon: ClipboardList },
  { href: "/periods", label: "Lịch sử kỳ", description: "Tra cứu kỳ và bản ghi", icon: History },
  { href: "/account", label: "Tài khoản", description: "Vai trò và trạng thái tài khoản", icon: UserRound },
];

export default function MorePage() {
  return <AppShell headerTitle="Thêm">
    <h1 className="text-3xl font-bold text-slate-950">Tiện ích</h1>
    <p className="mt-2 text-slate-600">Đi tới lịch, lịch sử và tài khoản cá nhân.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{links.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="flex min-h-20 items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon aria-hidden="true" className="h-5 w-5" /></span><span><b className="block text-slate-950">{label}</b><span className="text-sm text-slate-600">{description}</span></span></Link>)}</div>
  </AppShell>;
}
