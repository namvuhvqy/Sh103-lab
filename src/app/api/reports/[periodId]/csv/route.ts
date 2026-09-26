import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { HOSPITAL_MACHINES_25 } from "@/constants/machines";

export const dynamic = "force-dynamic";

const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

type MeasurementDetail = {
  temperature_c: number | null;
  humidity_pct: number | null;
  temperature_abnormal: boolean;
  humidity_abnormal: boolean;
};

type DecontaminationDetail = {
  daily_done: boolean;
  weekly_done: boolean;
  spill_event_done: boolean;
};

type MaintenanceDetail = {
  cadence: string | null;
  result: string | null;
};

type EquipmentShiftDetail = {
  equipment_shift_statuses: {
    status_code: string | null;
    asset_label_snapshot: string | null;
  } | null;
};

type ReportRecord = {
  id: string;
  record_type: string;
  business_date: string;
  slot_code: string | null;
  performed_at: string | null;
  entered_at: string | null;
  is_na: boolean;
  na_reason: string | null;
  note: string | null;
  revision_no: number;
  profiles: { full_name: string } | null;
  measurement_details: MeasurementDetail[] | MeasurementDetail | null;
  decontamination_details: DecontaminationDetail[] | DecontaminationDetail | null;
  maintenance_details: MaintenanceDetail[] | MaintenanceDetail | null;
  equipment_shift_details: EquipmentShiftDetail[] | EquipmentShiftDetail | null;
};

function firstItem<T>(val: T[] | T | null): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] ?? null : val;
}

export async function GET(request: Request, { params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  const search = new URL(request.url).searchParams;
  const report = await getOfficialPeriodReport(periodId, {
    start: search.get("start") ?? undefined,
    end: search.get("end") ?? undefined,
    shift: search.get("shift") ?? undefined,
  });
  if (!report) return Response.json({ error: "Không tìm thấy kỳ" }, { status: 404 });
  const isApproved = report.official && report.period?.status === "APPROVED";
  if (!isApproved) {
    return Response.json({ error: "Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt" }, { status: 409 });
  }

  type Period = {
    period_label: string | null;
    period_start: string;
    period_end: string;
    status: string;
    approved_at: string | null;
    locations: { name: string } | null;
    assets: { source_name: string } | null;
    form_template_versions: {
      version_label: string;
      form_templates: { code: string; name: string };
    };
  };
  const period = report.period as unknown as Period;
  const templateCode = period.form_template_versions.form_templates.code;
  const records = report.records as unknown as ReportRecord[];

  const startDateStr = search.get("start") ?? period.period_start ?? "2026-09-01";
  const startDayNum = 1;
  const yearNum = Number(startDateStr.split("-")[0]) || 2026;
  const monthNum = Number(startDateStr.split("-")[1]) || 9;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;

  let header: string[] = [];
  let rows: (string | number)[][] = [];

  if (templateCode.includes("BM.01/QL.HTAT")) {
    header = ["STT", "Ngày", "Ca / Lần đo", "Giờ đo", "Nhiệt độ (°C)", "Độ ẩm (%)", "Đánh giá ISO", "Người thực hiện", "Ghi chú"];
    const SLOTS = [
      { slot: "MORNING", label: "Ca Sáng", time: "08:30" },
      { slot: "AFTERNOON", label: "Ca Chiều", time: "14:30" },
    ];
    let stt = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const slot of SLOTS) {
        stt++;
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === slot.slot || r.slot_code === slot.label)
        );
        const m = firstItem(matchingRecord?.measurement_details);
        const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
        rows.push([
          stt,
          dateStr,
          slot.label,
          matchingRecord?.performed_at ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : slot.time,
          m?.temperature_c ?? (matchingRecord?.is_na ? "N/A" : ""),
          m?.humidity_pct ?? (matchingRecord?.is_na ? "N/A" : ""),
          matchingRecord ? (matchingRecord.is_na ? `N/A: ${matchingRecord.na_reason ?? ""}` : isAbnormal ? "Ngoài ngưỡng" : "Đạt chuẩn") : "",
          matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
          matchingRecord?.note ?? "",
        ]);
      }
    }
  } else if (templateCode.includes("BM.02/QL.HTAT") || templateCode.includes("BM.03/QL.HTAT")) {
    const isFreezer = templateCode.includes("BM.03");
    const safeRule = isFreezer ? "Đạt (-30°C đến -10°C)" : "Đạt (2°C đến 8°C)";
    header = ["STT", "Ngày", "Ca / Lần đo", "Tên tủ lưu trữ", "Nhiệt độ (°C)", "Đánh giá ngưỡng", "Người thực hiện", "Ghi chú"];
    const SLOTS = [
      { slot: "MORNING", label: "Sáng", time: "08:30" },
      { slot: "AFTERNOON", label: "Chiều", time: "14:30" },
    ];
    let stt = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const slot of SLOTS) {
        stt++;
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === slot.slot || r.slot_code === slot.label)
        );
        const m = firstItem(matchingRecord?.measurement_details);
        rows.push([
          stt,
          dateStr,
          slot.label,
          period.assets?.source_name ?? (isFreezer ? "Tủ lạnh đá" : "Tủ lạnh mát"),
          m?.temperature_c ?? (matchingRecord?.is_na ? "N/A" : ""),
          matchingRecord ? (matchingRecord.is_na ? `N/A: ${matchingRecord.na_reason ?? ""}` : m?.temperature_abnormal ? "Ngoài dải an toàn" : safeRule) : "",
          matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
          matchingRecord?.note ?? "",
        ]);
      }
    }
  } else if (templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM")) {
    header = ["STT", "Ngày", "Khu vực", "Khử khuẩn hằng ngày", "Khử khuẩn hằng tuần", "Xử lý tràn đổ", "Người thực hiện", "Ghi chú"];
    let stt = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      stt++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const dec = firstItem(matchingRecord?.decontamination_details);
      rows.push([
        stt,
        dateStr,
        period.locations?.name ?? "Khu vực xét nghiệm",
        dec?.daily_done ? "Đã thực hiện" : (matchingRecord ? "Chưa" : ""),
        dec?.weekly_done ? "Đã thực hiện" : (matchingRecord ? "—" : ""),
        dec?.spill_event_done ? "Có xử lý" : (matchingRecord ? "Không có" : ""),
        matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
        matchingRecord?.note ?? "",
      ]);
    }
  } else if (templateCode.includes("BM.02/QL.TRTB")) {
    header = ["STT", "Ngày", "Tên thiết bị", "Chu kỳ bảo dưỡng", "Kết quả bảo dưỡng", "Người thực hiện", "Ghi chú"];
    let stt = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      stt++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const maint = firstItem(matchingRecord?.maintenance_details);
      rows.push([
        stt,
        dateStr,
        period.assets?.source_name ?? "Thiết bị xét nghiệm",
        maint?.cadence === "DAILY" ? "Hằng ngày" : maint?.cadence === "WEEKLY" ? "Hằng tuần" : maint?.cadence === "MONTHLY" ? "Hằng tháng" : (maint?.cadence ?? (matchingRecord ? "Hằng ngày" : "")),
        maint?.result === "PASS" ? "ĐẠT YÊU CẦU" : (maint?.result ?? (matchingRecord ? "ĐẠT" : "")),
        matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
        matchingRecord?.note ?? "",
      ]);
    }
  } else if (templateCode.includes("BM.06")) {
    // Cấu trúc BM.06 hàng ngang 25 máy, 4 ca/ngày
    header = [
      "STT",
      "Ngày vận hành",
      "Ca trực",
      "Khung giờ",
      "Người trực ca",
      "Giờ chạy máy",
      ...HOSPITAL_MACHINES_25.map((m) => `#${m.order} ${m.name}`),
      "Ghi chú",
    ];
    const SHIFT_DEFS = [
      { slot: "SHIFT_1", label: "Ca 1", time: "07:00 – 11:30" },
      { slot: "SHIFT_2", label: "Ca 2", time: "11:30 – 13:30" },
      { slot: "SHIFT_3", label: "Ca 3", time: "13:30 – 16:30" },
      { slot: "SHIFT_4", label: "Ca 4", time: "16:30 – 07:00" },
    ];
    let stt = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const shift of SHIFT_DEFS) {
        stt++;
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === shift.slot || r.slot_code === shift.label)
        );
        const machineCells = HOSPITAL_MACHINES_25.map(() => {
          if (!matchingRecord) return "";
          const s = firstItem(matchingRecord.equipment_shift_details)?.equipment_shift_statuses;
          return s?.status_code ?? "BT";
        });
        rows.push([
          stt,
          dateStr,
          shift.label,
          shift.time,
          matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV trực" : "—"),
          matchingRecord ? "Theo ca" : "",
          ...machineCells,
          matchingRecord?.note ?? "",
        ]);
      }
    }
  } else {
    header = ["STT", "Ngày", "Ca / Thời gian", "Loại bản ghi", "Thời điểm thực hiện", "Người thực hiện", "Ghi chú"];
    rows = records.map((row, index) => [
      index + 1,
      row.business_date,
      row.slot_code ?? "—",
      row.record_type,
      row.performed_at ?? "—",
      row.profiles?.full_name ?? "—",
      row.note ?? "",
    ]);
  }

  // Thêm header thông tin bệnh viện vào đầu CSV
  const metaLines = [
    ["BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA"],
    [`Biểu mẫu: ${period.form_template_versions.form_templates.code} — ${period.form_template_versions.form_templates.name}`],
    [`Kỳ báo cáo: ${period.period_label ?? `${period.period_start} – ${period.period_end}`}`],
    ["Trạng thái: ĐÃ PHÊ DUYỆT (CHÍNH THỨC)"],
    [],
  ];

  const body =
    "\uFEFF" +
    [...metaLines, header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  const safeCode = templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (period.period_label ?? `${period.period_start}_${period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const filename = `${safeCode}_${periodSlug}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
