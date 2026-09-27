import React from "react";
import {
  CalendarCheck,
  ClipboardCheck,
  Snowflake,
  Sparkles,
  Thermometer,
  Wrench,
} from "lucide-react";
import { WorkSessionRosterCard } from "./WorkSessionRosterCard";
import { WorkSessionSectionCard } from "./WorkSessionSectionCard";
import type { WorkSessionContextResult } from "@/lib/work-session/server-context";

interface Props {
  sessionData: WorkSessionContextResult;
}

const SHIFT_TITLES: Record<string, string> = {
  SHIFT_1: "Ca 1 · Sáng (07:00–11:30)",
  SHIFT_2: "Ca 2 · Trưa (11:30–13:30)",
  SHIFT_3: "Ca 3 · Chiều (13:30–16:30)",
  SHIFT_4: "Ca 4 · Đêm (16:30–07:00)",
  MORNING: "Ca Sáng",
  AFTERNOON: "Ca Chiều",
};

export function WorkSessionView({ sessionData }: Props) {
  const { businessDate, slotCode, roster, isOfficialRecordCreated, occurrences } = sessionData;

  const displayDate = businessDate.split("-").reverse().join("/");
  const shiftTitle = SHIFT_TITLES[slotCode] || `Phiên ${slotCode}`;

  const getOccurrencesForForm = (prefix: string) => {
    return occurrences.filter((o) => o.formCode.includes(prefix));
  };

  const sections = [
    {
      code: "BM.01",
      title: "Nhiệt độ & độ ẩm phòng xét nghiệm",
      description: "5 khu vực · Sáng / Chiều",
      href: `/temperature?date=${businessDate}&shift=${slotCode}`,
      icon: Thermometer,
      occurrences: getOccurrencesForForm("BM.01/QL.HTAT.01").length > 0
        ? getOccurrencesForForm("BM.01/QL.HTAT.01")
        : getOccurrencesForForm("BM.01"),
    },
    {
      code: "BM.02",
      title: "Nhiệt độ tủ mát",
      description: "9 tủ mát · 2–8°C",
      href: `/temperature?tab=cool&date=${businessDate}&shift=${slotCode}`,
      icon: Thermometer,
      occurrences: getOccurrencesForForm("BM.02/QL.HTAT.01").length > 0
        ? getOccurrencesForForm("BM.02/QL.HTAT.01")
        : getOccurrencesForForm("BM.02"),
    },
    {
      code: "BM.03",
      title: "Nhiệt độ tủ đông",
      description: "4 tủ đông · -30 đến -10°C",
      href: `/temperature?tab=freezer&date=${businessDate}&shift=${slotCode}`,
      icon: Snowflake,
      occurrences: getOccurrencesForForm("BM.03/QL.HTAT.01").length > 0
        ? getOccurrencesForForm("BM.03/QL.HTAT.01")
        : getOccurrencesForForm("BM.03"),
    },
    {
      code: "BM.01_KNBM",
      title: "Khử nhiễm bề mặt",
      description: "Hằng ngày · Hằng tuần · Tràn đổ",
      href: `/decontamination?date=${businessDate}&shift=${slotCode}`,
      icon: Sparkles,
      occurrences: getOccurrencesForForm("BM.01_KNBM"),
    },
    {
      code: "BM.06",
      title: "Nhật ký hoạt động thiết bị",
      description: "25 máy · BT / KSD / H",
      href: `/bm06?date=${businessDate}&shift=${slotCode}`,
      icon: ClipboardCheck,
      occurrences: getOccurrencesForForm("BM.06"),
    },
    {
      code: "BM.02/QL.TRTB.01",
      title: "Bảo dưỡng trang thiết bị",
      description: "Mở đúng occurrence cần thực hiện",
      href: `/tasks?date=${businessDate}&shift=${slotCode}`,
      icon: Wrench,
      occurrences: getOccurrencesForForm("BM.02/QL.TRTB.01"),
    },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-5">
      <section className="overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-950 via-teal-900 to-cyan-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10">
            <CalendarCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">Phiên hiện tại</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{shiftTitle}</h1>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{displayDate}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/90">
              Chọn công việc cần thực hiện. Mỗi mục lưu độc lập vào đúng biểu mẫu và occurrence; không có hồ sơ tổng hợp 24 giờ.
            </p>
          </div>
        </div>
      </section>

      <WorkSessionRosterCard
        roster={roster}
        businessDate={businessDate}
        slotCode={slotCode}
        isOfficialRecordCreated={isOfficialRecordCreated}
      />

      <section aria-labelledby="work-sections-title" className="space-y-3">
        <div>
          <h2 id="work-sections-title" className="text-lg font-black text-slate-950">Công việc trong phiên</h2>
          <p className="text-sm text-slate-600">Không nhập lại tên nhân sự; hệ thống ghi nhận người thao tác từ tài khoản đăng nhập.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map((section) => (
            <WorkSessionSectionCard
              key={section.code}
              code={section.code}
              title={section.title}
              description={section.description}
              href={section.href}
              icon={section.icon}
              occurrences={section.occurrences}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
