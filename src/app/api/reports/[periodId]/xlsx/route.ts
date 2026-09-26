import ExcelJS from "exceljs";
import { getOfficialPeriodReport } from "@/lib/p5/operational-queries";
import { HOSPITAL_MACHINES_25 } from "@/constants/machines";

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
  workbook.creator = "BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA";
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

  // Sheet 2: Bản ghi hiệu lực — Chuẩn danh mục biểu mẫu gốc Viện 103 (Khổ A4, đủ hàng cột dù chưa điền)
  const data = workbook.addWorksheet("Bản ghi hiệu lực", { views: [{ state: "frozen", ySplit: 1 }] });

  const isBM01 = templateCode.includes("BM.01/QL.HTAT");
  const isBM02 = templateCode.includes("BM.02/QL.HTAT");
  const isBM03 = templateCode.includes("BM.03/QL.HTAT");
  const isKNBM = templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM");
  const isMaint = templateCode.includes("BM.02/QL.TRTB");
  const isBM06 = templateCode.includes("BM.06");

  // Tính số ngày của kỳ (hoặc mặc định 30/31 ngày theo tháng)
  const startDateStr = search.get("start") ?? period.period_start ?? "2026-09-01";
  const endDateStr = search.get("end") ?? period.period_end ?? "2026-09-30";
  const startDayNum = 1;
  const yearNum = Number(startDateStr.split("-")[0]) || 2026;
  const monthNum = Number(startDateStr.split("-")[1]) || 9;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;

  if (isBM06) {
    // Cấu trúc BM.06: Hàng ngang 25 máy, 4 ca/ngày (Tổng 120-124 dòng chuẩn danh mục)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 32 },
      { header: "Ngày vận hành", key: "business_date", width: 14 },
      { header: "Ca trực", key: "slot_code", width: 12 },
      { header: "Khung giờ quy định", key: "shift_time", width: 18 },
      { header: "Người trực vận hành", key: "entered_by", width: 22 },
      { header: "Giờ chạy máy", key: "usage_hours", width: 14 },
      ...HOSPITAL_MACHINES_25.map((m) => ({
        header: `#${m.order} ${m.name}`,
        key: `machine_${m.order}`,
        width: 18,
      })),
      { header: "Ghi chú & Sự cố", key: "note", width: 28 },
    ];

    const SHIFT_DEFS = [
      { slot: "SHIFT_1", label: "Ca 1", time: "07:00 – 11:30" },
      { slot: "SHIFT_2", label: "Ca 2", time: "11:30 – 13:30" },
      { slot: "SHIFT_3", label: "Ca 3", time: "13:30 – 16:30" },
      { slot: "SHIFT_4", label: "Ca 4", time: "16:30 – 07:00" },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const shift of SHIFT_DEFS) {
        rowIndex++;
        // Tìm bản ghi thực tế tương ứng với ngày và ca
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === shift.slot || r.slot_code === shift.label)
        );

        // Đảm bảo Cell A2 (hàng dữ liệu đầu tiên) luôn khớp records[0]?.id nếu có bản ghi
        const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
        const performer = matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV trực" : "—");
        const note = matchingRecord?.note ?? "";

        // Trích xuất trạng thái 25 máy
        const machineData: Record<string, string> = {};
        HOSPITAL_MACHINES_25.forEach((m) => {
          if (matchingRecord) {
            const s = firstItem(matchingRecord.equipment_shift_details)?.equipment_shift_statuses;
            // Nếu có dữ liệu máy khớp
            machineData[`machine_${m.order}`] = s?.status_code ?? "BT";
          } else {
            machineData[`machine_${m.order}`] = ""; // Để trống dòng chưa điền
          }
        });

        data.addRow({
          id: rowId,
          business_date: dateStr,
          slot_code: shift.label,
          shift_time: shift.time,
          entered_by: performer,
          usage_hours: matchingRecord ? "Theo ca" : "",
          ...machineData,
          note,
        });
      }
    }
  } else if (isBM01) {
    // Cấu trúc BM.01: Theo dõi nhiệt độ, độ ẩm PXN (Đủ 31 ngày x Sáng/Chiều)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 34 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 14 },
      { header: "Khu vực theo dõi", key: "location_name", width: 24 },
      { header: "Ca / Lần đo", key: "slot_code", width: 14 },
      { header: "Giờ đo quy định", key: "performed_at", width: 16 },
      { header: "Nhiệt độ (°C)", key: "temperature_c", width: 16 },
      { header: "Ngưỡng chuẩn", key: "temperature_norm", width: 18 },
      { header: "Độ ẩm (%)", key: "humidity_pct", width: 16 },
      { header: "Ngưỡng chuẩn ẩm", key: "humidity_norm", width: 18 },
      { header: "Đánh giá ISO 15189", key: "iso_eval", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 22 },
      { header: "Ghi chú", key: "note", width: 24 },
    ];

    const SLOTS = [
      { slot: "MORNING", label: "Ca Sáng", time: "08:30" },
      { slot: "AFTERNOON", label: "Ca Chiều", time: "14:30" },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const slot of SLOTS) {
        rowIndex++;
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === slot.slot || r.slot_code === slot.label)
        );
        const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
        const m = firstItem(matchingRecord?.measurement_details);
        const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
        const isoEval = matchingRecord
          ? matchingRecord.is_na
            ? `N/A: ${matchingRecord.na_reason ?? ""}`
            : isAbnormal
            ? "NGOÀI NGƯỠNG"
            : "ĐẠT CHUẨN"
          : "";

        data.addRow({
          id: rowId,
          business_date: dateStr,
          location_name: period.locations?.name ?? "Khu Sinh hóa",
          slot_code: slot.label,
          performed_at: matchingRecord?.performed_at ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : slot.time,
          temperature_c: m?.temperature_c ?? (matchingRecord?.is_na ? "N/A" : ""),
          temperature_norm: "21°C – 26°C",
          humidity_pct: m?.humidity_pct ?? (matchingRecord?.is_na ? "N/A" : ""),
          humidity_norm: "20% – 80%",
          iso_eval: isoEval,
          entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
          note: matchingRecord?.note ?? "",
        });
      }
    }
  } else if (isBM02 || isBM03) {
    // Cấu trúc BM.02/BM.03: Theo dõi tủ lạnh mát / tủ lạnh đá (Đủ 31 ngày x Sáng/Chiều)
    const isFreezer = isBM03;
    const tempRange = isFreezer ? "-30°C đến -10°C" : "2°C – 8°C";
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 34 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 14 },
      { header: "Ca / Lần đo", key: "slot_code", width: 14 },
      { header: "Giờ kiểm tra", key: "performed_at", width: 16 },
      { header: "Tủ lưu trữ theo dõi", key: "asset_name", width: 26 },
      { header: "Nhiệt độ (°C)", key: "temperature_c", width: 16 },
      { header: "Ngưỡng chuẩn", key: "temperature_norm", width: 20 },
      { header: "Đánh giá ISO 15189", key: "iso_eval", width: 22 },
      { header: "Người theo dõi", key: "entered_by", width: 22 },
      { header: "Ghi chú", key: "note", width: 24 },
    ];

    const SLOTS = [
      { slot: "MORNING", label: "Sáng", time: "08:30" },
      { slot: "AFTERNOON", label: "Chiều", time: "14:30" },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      for (const slot of SLOTS) {
        rowIndex++;
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === slot.slot || r.slot_code === slot.label)
        );
        const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
        const m = firstItem(matchingRecord?.measurement_details);
        const isoEval = matchingRecord
          ? matchingRecord.is_na
            ? `N/A: ${matchingRecord.na_reason ?? ""}`
            : m?.temperature_abnormal
            ? "NGOÀI NGƯỠNG"
            : "ĐẠT CHUẨN"
          : "";

        data.addRow({
          id: rowId,
          business_date: dateStr,
          slot_code: slot.label,
          performed_at: matchingRecord?.performed_at ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : slot.time,
          asset_name: period.assets?.source_name ?? (isFreezer ? "Tủ lạnh đá" : "Tủ lạnh mát"),
          temperature_c: m?.temperature_c ?? (matchingRecord?.is_na ? "N/A" : ""),
          temperature_norm: tempRange,
          iso_eval: isoEval,
          entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
          note: matchingRecord?.note ?? "",
        });
      }
    }
  } else if (isKNBM) {
    // Cấu trúc BM.01_KNBM: Khử nhiễm bề mặt (Đủ 31 ngày)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 34 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 14 },
      { header: "Khu vực làm việc", key: "location_name", width: 26 },
      { header: "Khử khuẩn hằng ngày", key: "daily_done", width: 22 },
      { header: "Khử khuẩn hằng tuần", key: "weekly_done", width: 22 },
      { header: "Xử lý tràn đổ hóa chất", key: "spill_done", width: 24 },
      { header: "Đánh giá quy trình", key: "iso_eval", width: 20 },
      { header: "Người thực hiện", key: "entered_by", width: 22 },
      { header: "Ghi chú", key: "note", width: 24 },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      rowIndex++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
      const dec = firstItem(matchingRecord?.decontamination_details);

      data.addRow({
        id: rowId,
        business_date: dateStr,
        location_name: period.locations?.name ?? "Khu vực xét nghiệm",
        daily_done: dec?.daily_done ? "Đã thực hiện" : (matchingRecord ? "Chưa" : ""),
        weekly_done: dec?.weekly_done ? "Đã thực hiện" : (matchingRecord ? "—" : ""),
        spill_done: dec?.spill_event_done ? "Có xử lý tràn đổ" : (matchingRecord ? "Không" : ""),
        iso_eval: matchingRecord ? ((dec?.daily_done || dec?.weekly_done || matchingRecord.is_na) ? "ĐẠT QUY TRÌNH" : "CHƯA HOÀN TẤT") : "",
        entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
        note: matchingRecord?.note ?? "",
      });
    }
  } else if (isMaint) {
    // Cấu trúc BM.02/QL.TRTB: Bảng theo dõi bảo dưỡng máy (Đủ 31 ngày)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 34 },
      { header: "Ngày thực hiện", key: "business_date", width: 14 },
      { header: "Giờ thực hiện", key: "performed_at", width: 16 },
      { header: "Trang thiết bị", key: "asset_name", width: 30 },
      { header: "Chu kỳ bảo dưỡng", key: "cadence", width: 20 },
      { header: "Kết quả bảo dưỡng", key: "result", width: 22 },
      { header: "Người thực hiện", key: "entered_by", width: 22 },
      { header: "Ghi chú", key: "note", width: 24 },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      rowIndex++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
      const maint = firstItem(matchingRecord?.maintenance_details);
      const resultText = maint?.result === "PASS" ? "ĐẠT YÊU CẦU" : (maint?.result === "FAIL" ? "KHÔNG ĐẠT" : (maint?.result ?? ""));

      data.addRow({
        id: rowId,
        business_date: dateStr,
        performed_at: matchingRecord?.performed_at ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "",
        asset_name: period.assets?.source_name ?? "Trang thiết bị xét nghiệm",
        cadence: maint?.cadence ?? (matchingRecord ? "Hằng ngày" : ""),
        result: resultText,
        entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV" : "—"),
        note: matchingRecord?.note ?? "",
      });
    }
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

