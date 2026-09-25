import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";

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

  let header: string[] = [];
  let rows: (string | number)[][] = [];

  if (templateCode.includes("BM.01/QL.HTAT")) {
    header = ["STT", "Ngày", "Ca / Giờ đo", "Nhiệt độ (°C)", "Độ ẩm (%)", "Đánh giá ISO", "Người thực hiện", "Ghi chú"];
    rows = records.map((row, index) => {
      const m = firstItem(row.measurement_details);
      const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
      return [
        index + 1,
        row.business_date,
        row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        m?.temperature_c ?? (row.is_na ? "N/A" : "—"),
        m?.humidity_pct ?? (row.is_na ? "N/A" : "—"),
        row.is_na ? `N/A: ${row.na_reason ?? ""}` : (isAbnormal ? "Ngoài ngưỡng cảnh báo" : "Đạt chuẩn"),
        row.profiles?.full_name ?? "—",
        row.note ?? "",
      ];
    });
  } else if (templateCode.includes("BM.02/QL.HTAT") || templateCode.includes("BM.03/QL.HTAT")) {
    const isFreezer = templateCode.includes("BM.03");
    const safeRule = isFreezer ? "Đạt (-30°C đến -10°C)" : "Đạt (2°C đến 8°C)";
    header = ["STT", "Ngày", "Ca / Giờ đo", "Tên tủ lưu trữ", "Nhiệt độ (°C)", "Đánh giá ngưỡng", "Người thực hiện", "Ghi chú"];
    rows = records.map((row, index) => {
      const m = firstItem(row.measurement_details);
      return [
        index + 1,
        row.business_date,
        row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        period.assets?.source_name ?? "Tủ chuyên dụng",
        m?.temperature_c ?? (row.is_na ? "N/A" : "—"),
        row.is_na ? `N/A: ${row.na_reason ?? ""}` : (m?.temperature_abnormal ? "Ngoài dải an toàn" : safeRule),
        row.profiles?.full_name ?? "—",
        row.note ?? "",
      ];
    });
  } else if (templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM")) {
    header = ["STT", "Ngày", "Khu vực", "Khử khuẩn hằng ngày", "Khử khuẩn hằng tuần", "Xử lý tràn đổ", "Người thực hiện", "Ghi chú"];
    rows = records.map((row, index) => {
      const d = firstItem(row.decontamination_details);
      return [
        index + 1,
        row.business_date,
        period.locations?.name ?? "Khu vực xét nghiệm",
        d?.daily_done ? "Đã thực hiện" : "—",
        d?.weekly_done ? "Đã thực hiện" : "—",
        d?.spill_event_done ? "Có xử lý" : "Không có",
        row.profiles?.full_name ?? "—",
        row.note ?? "",
      ];
    });
  } else if (templateCode.includes("BM.02/QL.TRTB")) {
    header = ["STT", "Ngày", "Tên thiết bị", "Chu kỳ bảo dưỡng", "Kết quả bảo dưỡng", "Người thực hiện", "Ghi chú"];
    rows = records.map((row, index) => {
      const m = firstItem(row.maintenance_details);
      return [
        index + 1,
        row.business_date,
        period.assets?.source_name ?? "Thiết bị xét nghiệm",
        m?.cadence === "DAILY" ? "Hằng ngày" : m?.cadence === "WEEKLY" ? "Hằng tuần" : m?.cadence === "MONTHLY" ? "Hằng tháng" : (m?.cadence ?? "—"),
        m?.result === "PASS" ? "ĐẠT YÊU CẦU" : (m?.result ?? "ĐẠT"),
        row.profiles?.full_name ?? "—",
        row.note ?? "",
      ];
    });
  } else if (templateCode.includes("BM.06")) {
    header = ["STT", "Tên thiết bị", "Ngày", "Ca trực", "Trạng thái máy", "Người trực ca", "Ghi chú"];
    rows = records.map((row, index) => {
      const s = firstItem(row.equipment_shift_details)?.equipment_shift_statuses;
      const statusText = s?.status_code === "BT" ? "BT (Bình thường)" : s?.status_code === "KSD" ? "KSD (Không sử dụng)" : s?.status_code === "H" ? "H (Hỏng)" : (s?.status_code ?? "BT");
      return [
        index + 1,
        s?.asset_label_snapshot ?? period.assets?.source_name ?? "Máy xét nghiệm",
        row.business_date,
        row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        statusText,
        row.profiles?.full_name ?? "—",
        row.note ?? "",
      ];
    });
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
    [`Trạng thái: ${report.official ? "ĐÃ PHÊ DUYỆT (CHÍNH THỨC)" : "BẢN NHÁP — CHƯA PHÊ DUYỆT"}`],
    [],
  ];

  const body =
    "\uFEFF" +
    [...metaLines, header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  const safeCode = templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (period.period_label ?? `${period.period_start}_${period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const prefix = report.official ? "" : "[BAN_NHAP]_";
  const filename = `${prefix}${safeCode}_${periodSlug}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
