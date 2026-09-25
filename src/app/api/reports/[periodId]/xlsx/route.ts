import ExcelJS from "exceljs";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";

export const dynamic = "force-dynamic";

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
  measurement_details?: MeasurementDetail[] | MeasurementDetail | null;
  decontamination_details?: DecontaminationDetail[] | DecontaminationDetail | null;
  maintenance_details?: MaintenanceDetail[] | MaintenanceDetail | null;
  equipment_shift_details?: EquipmentShiftDetail[] | EquipmentShiftDetail | null;
};

function firstItem<T>(val: T[] | T | null | undefined): T | null {
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

  const allowDraft = search.get("draft") === "true";
  const isApproved = report.official && report.period?.status === "APPROVED";
  // Official XLSX is generated only from an APPROVED period and effective records unless draft is requested
  if (!isApproved && !allowDraft) {
    return Response.json({ error: "Chỉ xuất báo cáo chính thức từ kỳ đã phê duyệt" }, { status: 409 });
  }

  type Period = {
    period_label: string | null;
    period_start: string;
    period_end: string;
    status: string;
    approved_at: string | null;
    approved_by?: string | null;
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bệnh viện Quân y 103 · Khoa Sinh hóa";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sheet 1: Tổng quan theo chuẩn ISO 15189
  const summary = workbook.addWorksheet("Tổng quan", { views: [{ showGridLines: false }] });
  summary.columns = [{ width: 24 }, { width: 60 }];
  summary.addRows([
    ["Đơn vị", "Bệnh viện Quân y 103 · Khoa Sinh hóa"],
    ["Biểu mẫu", `${period.form_template_versions.form_templates.code} — ${period.form_template_versions.form_templates.name}`],
    ["Phiên bản", period.form_template_versions.version_label],
    ["Kỳ", period.period_label ?? `${period.period_start} – ${period.period_end}`],
    ["Đối tượng", period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa"],
    ["Trạng thái", isApproved ? "ĐÃ PHÊ DUYỆT" : "BẢN NHÁP (CHƯA PHÊ DUYỆT)"],
    ["Phê duyệt lúc", period.approved_at ?? (isApproved ? "" : "Chưa phê duyệt")],
    ["Số bản ghi hiệu lực", records.length],
  ]);
  summary.getColumn(1).font = { bold: true, color: { argb: "FF0D9488" } };
  summary.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  // Sheet 2: Bản ghi hiệu lực — Phân hóa theo đúng cấu trúc của từng biểu mẫu ISO
  const data = workbook.addWorksheet("Bản ghi hiệu lực", { views: [{ state: "frozen", ySplit: 1 }] });

  const isBM01 = templateCode.includes("BM.01/QL.HTAT");
  const isBM02 = templateCode.includes("BM.02/QL.HTAT");
  const isBM03 = templateCode.includes("BM.03/QL.HTAT");
  const isKNBM = templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM");
  const isMaint = templateCode.includes("BM.02/QL.TRTB");
  const isBM06 = templateCode.includes("BM.06");

  if (isBM01) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 16 },
      { header: "Ca / Lần đo", key: "slot_code", width: 14 },
      { header: "Giờ thực tế đo", key: "performed_at", width: 16 },
      { header: "Nhiệt độ phòng (°C)", key: "temperature_c", width: 20 },
      { header: "Ngưỡng chuẩn nhiệt độ", key: "temperature_norm", width: 22 },
      { header: "Độ ẩm phòng (%)", key: "humidity_pct", width: 18 },
      { header: "Ngưỡng chuẩn độ ẩm", key: "humidity_norm", width: 20 },
      { header: "Đánh giá ISO 15189", key: "iso_eval", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Thời điểm nhập hệ thống", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const m = firstItem(row.measurement_details);
      const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
      const isoEval = row.is_na ? `N/A: ${row.na_reason ?? ""}` : (isAbnormal ? "NGOÀI NGƯỠNG" : "ĐẠT CHUẨN");
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        slot_code: row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        performed_at: row.performed_at ? new Date(row.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        temperature_c: m?.temperature_c ?? (row.is_na ? "N/A" : "—"),
        temperature_norm: "21°C – 26°C",
        humidity_pct: m?.humidity_pct ?? (row.is_na ? "N/A" : "—"),
        humidity_norm: "20% – 80%",
        iso_eval: isoEval,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else if (isBM02) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 16 },
      { header: "Ca / Lần đo", key: "slot_code", width: 14 },
      { header: "Giờ thực tế đo", key: "performed_at", width: 16 },
      { header: "Tủ / Ngăn mát theo dõi", key: "asset_name", width: 26 },
      { header: "Nhiệt độ tủ mát (°C)", key: "temperature_c", width: 20 },
      { header: "Ngưỡng chuẩn quy định", key: "temperature_norm", width: 22 },
      { header: "Đánh giá ISO 15189", key: "iso_eval", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Thời điểm nhập hệ thống", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const m = firstItem(row.measurement_details);
      const isoEval = row.is_na ? `N/A: ${row.na_reason ?? ""}` : (m?.temperature_abnormal ? "NGOÀI NGƯỠNG" : "ĐẠT CHUẨN");
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        slot_code: row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        performed_at: row.performed_at ? new Date(row.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        asset_name: period.assets?.source_name ?? "Tủ mát",
        temperature_c: m?.temperature_c ?? (row.is_na ? "N/A" : "—"),
        temperature_norm: "2°C – 8°C",
        iso_eval: isoEval,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else if (isBM03) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 16 },
      { header: "Ca / Lần đo", key: "slot_code", width: 14 },
      { header: "Giờ thực tế đo", key: "performed_at", width: 16 },
      { header: "Tủ / Ngăn đông theo dõi", key: "asset_name", width: 26 },
      { header: "Nhiệt độ tủ đông (°C)", key: "temperature_c", width: 20 },
      { header: "Ngưỡng chuẩn quy định", key: "temperature_norm", width: 22 },
      { header: "Đánh giá ISO 15189", key: "iso_eval", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Thời điểm nhập hệ thống", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const m = firstItem(row.measurement_details);
      const isoEval = row.is_na ? `N/A: ${row.na_reason ?? ""}` : (m?.temperature_abnormal ? "NGOÀI NGƯỠNG" : "ĐẠT CHUẨN");
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        slot_code: row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        performed_at: row.performed_at ? new Date(row.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        asset_name: period.assets?.source_name ?? "Tủ đông",
        temperature_c: m?.temperature_c ?? (row.is_na ? "N/A" : "—"),
        temperature_norm: "-30°C đến -10°C",
        iso_eval: isoEval,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else if (isKNBM) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 16 },
      { header: "Khu vực làm việc", key: "location_name", width: 26 },
      { header: "Khử nhiễm hằng ngày", key: "daily_done", width: 22 },
      { header: "Khử nhiễm hằng tuần", key: "weekly_done", width: 22 },
      { header: "Xử lý tràn đổ hóa chất", key: "spill_done", width: 24 },
      { header: "Đánh giá quy trình", key: "iso_eval", width: 20 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Thời điểm nhập hệ thống", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const d = firstItem(row.decontamination_details);
      const dailyText = d?.daily_done ? "Đã thực hiện" : (row.is_na ? "N/A" : "Chưa");
      const weeklyText = d?.weekly_done ? "Đã thực hiện" : "—";
      const spillText = d?.spill_event_done ? "Có xử lý sự cố tràn đổ" : "Không";
      const isoEval = (d?.daily_done || d?.weekly_done || row.is_na) ? "ĐẠT QUY TRÌNH" : "CHƯA HOÀN TẤT";
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        location_name: period.locations?.name ?? "Khu vực xét nghiệm",
        daily_done: dailyText,
        weekly_done: weeklyText,
        spill_done: spillText,
        iso_eval: isoEval,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else if (isMaint) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày thực hiện", key: "business_date", width: 16 },
      { header: "Giờ thực hiện", key: "performed_at", width: 16 },
      { header: "Trang thiết bị", key: "asset_name", width: 30 },
      { header: "Chu kỳ bảo dưỡng", key: "cadence", width: 20 },
      { header: "Kết quả bảo dưỡng", key: "result", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Thời điểm nhập hệ thống", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const maint = firstItem(row.maintenance_details);
      const resultText = maint?.result === "PASS" ? "ĐẠT YÊU CẦU" : (maint?.result === "FAIL" ? "KHÔNG ĐẠT" : (maint?.result ?? "ĐẠT"));
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        performed_at: row.performed_at ? new Date(row.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        asset_name: period.assets?.source_name ?? "Trang thiết bị",
        cadence: maint?.cadence ?? "Hằng ngày",
        result: resultText,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else if (isBM06) {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 36 },
      { header: "Ngày vận hành", key: "business_date", width: 16 },
      { header: "Khung giờ (Ca)", key: "slot_code", width: 22 },
      { header: "Trang thiết bị xét nghiệm", key: "asset_name", width: 36 },
      { header: "Mã trạng thái", key: "status_code", width: 14 },
      { header: "Ý nghĩa trạng thái", key: "status_desc", width: 24 },
      { header: "Người trực vận hành", key: "entered_by", width: 24 },
      { header: "Thời điểm ghi nhận", key: "entered_at", width: 24 },
      { header: "Ghi chú", key: "note", width: 26 },
    ];
    records.forEach((row) => {
      const s = firstItem(row.equipment_shift_details)?.equipment_shift_statuses;
      const statusCode = s?.status_code ?? "BT";
      const statusDesc = statusCode === "BT" ? "Bình thường" : statusCode === "KSD" ? "Không sử dụng" : statusCode === "H" ? "Hỏng" : statusCode;
      data.addRow({
        id: row.id,
        business_date: row.business_date,
        slot_code: row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—",
        asset_name: s?.asset_label_snapshot ?? period.assets?.source_name ?? "Máy xét nghiệm",
        status_code: statusCode,
        status_desc: statusDesc,
        entered_by: row.profiles?.full_name ?? "—",
        entered_at: row.entered_at ? new Date(row.entered_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—",
        note: row.note ?? "",
      });
    });
  } else {
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 38 },
      { header: "Loại", key: "record_type", width: 18 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 16 },
      { header: "Ca", key: "slot_code", width: 16 },
      { header: "Thời điểm thực hiện", key: "performed_at", width: 22 },
      { header: "Thời điểm nhập", key: "entered_at", width: 22 },
      { header: "N/A", key: "is_na", width: 10 },
      { header: "Ghi chú", key: "note", width: 30 },
      { header: "Người thực hiện", key: "entered_by", width: 24 },
      { header: "Revision", key: "revision_no", width: 12 },
    ];
    records.forEach((row) => {
      data.addRow({
        id: row.id,
        record_type: row.record_type,
        business_date: row.business_date,
        slot_code: row.slot_code ?? "—",
        performed_at: row.performed_at ?? "—",
        entered_at: row.entered_at ?? "—",
        is_na: row.is_na ? "Có" : "Không",
        note: row.note ?? "",
        entered_by: row.profiles?.full_name ?? "—",
        revision_no: row.revision_no ?? 1,
      });
    });
  }

  const header = data.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };
  header.alignment = { vertical: "middle", wrapText: true };
  header.height = 24;

  data.eachRow((row, index) => {
    if (index > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  const bytes = await workbook.xlsx.writeBuffer();
  const safeCode = templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (period.period_label ?? `${period.period_start}_${period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const prefix = isApproved ? "" : "[BAN_NHAP]_";
  const filename = `${prefix}${safeCode}_${periodSlug}.xlsx`;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
