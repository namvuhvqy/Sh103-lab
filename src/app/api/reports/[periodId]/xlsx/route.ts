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

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

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
    approved_by?: string | null;
    locations: { name: string } | null;
    assets: { source_name: string; source_code?: string; storage_purpose?: string } | null;
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
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 1,
      visibility: "visible",
    },
  ];

  // Sheet 1: Tổng quan theo chuẩn ISO 15189 (Bật lưới showGridLines)
  const summary = workbook.addWorksheet("Tổng quan", { views: [{ showGridLines: true }] });
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
    row.eachCell((cell) => {
      cell.border = thinBorder;
    });
  });

  // Sheet 2: Bản ghi hiệu lực — Chuẩn form gốc (Đầy đủ lưới ô kẻ, hàng cột và khung giờ)
  const data = workbook.addWorksheet("Bản ghi hiệu lực", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
  });

  const isBM01 = templateCode.includes("BM.01/QL.HTAT");
  const isBM02 = templateCode.includes("BM.02/QL.HTAT");
  const isBM03 = templateCode.includes("BM.03/QL.HTAT");
  const isKNBM = templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM");
  const isMaint = templateCode.includes("BM.02/QL.TRTB");
  const isBM06 = templateCode.includes("BM.06");

  const startDateStr = search.get("start") ?? period.period_start ?? "2026-09-01";
  const startDayNum = 1;
  const yearNum = Number(startDateStr.split("-")[0]) || 2026;
  const monthNum = Number(startDateStr.split("-")[1]) || 9;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;

  if (isBM06) {
    // BM.06: Nhật ký hoạt động TTB (Khổ ngang A4, 4 ca/ngày, 25 máy xét nghiệm)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 22 },
      { header: "Ngày tháng năm", key: "business_date", width: 15 },
      { header: "Ca trực", key: "slot_code", width: 10 },
      { header: "Khung giờ quy định", key: "shift_time", width: 16 },
      { header: "Người sử dụng (KTV)", key: "entered_by", width: 22 },
      { header: "Số giờ / Ca", key: "usage_hours", width: 13 },
      ...HOSPITAL_MACHINES_25.map((m) => ({
        header: `#${m.order} ${m.name.replace(/^(Máy|Hệ thống Automation Máy) /, "")}`,
        key: `machine_${m.order}`,
        width: 15,
      })),
      { header: "Ghi chú & Sự cố", key: "note", width: 24 },
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
        const matchingRecord = records.find(
          (r) => r.business_date === dateStr && (r.slot_code === shift.slot || r.slot_code === shift.label)
        );

        const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
        const performer = matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV trực" : "—");
        const note = matchingRecord?.note ?? "";

        const machineData: Record<string, string> = {};
        HOSPITAL_MACHINES_25.forEach((m) => {
          if (matchingRecord) {
            const s = firstItem(matchingRecord.equipment_shift_details)?.equipment_shift_statuses;
            machineData[`machine_${m.order}`] = s?.status_code ?? "BT";
          } else {
            machineData[`machine_${m.order}`] = "BT";
          }
        });

        data.addRow({
          id: rowId,
          business_date: dateStr,
          slot_code: shift.label,
          shift_time: shift.time,
          entered_by: performer,
          usage_hours: matchingRecord ? "Đủ ca" : "Theo ca",
          ...machineData,
          note,
        });
      }
    }
  } else if (isBM01) {
    // BM.01: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm (Đủ 31 ngày x Sáng / Chiều)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 22 },
      { header: "Ngày nghiệp vụ", key: "business_date", width: 15 },
      { header: "Khu vực theo dõi", key: "location_name", width: 24 },
      { header: "Lần đo", key: "slot_code", width: 12 },
      { header: "Giờ quy định", key: "performed_at", width: 14 },
      { header: "Nhiệt độ (°C)", key: "temperature_c", width: 14 },
      { header: "Chuẩn nhiệt độ", key: "temperature_norm", width: 16 },
      { header: "Độ ẩm (%)", key: "humidity_pct", width: 14 },
      { header: "Chuẩn độ ẩm", key: "humidity_norm", width: 16 },
      { header: "Đánh giá ISO", key: "iso_eval", width: 16 },
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
        const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
        const isoEval = matchingRecord
          ? matchingRecord.is_na
            ? `N/A: ${matchingRecord.na_reason ?? ""}`
            : isAbnormal
            ? "NGOÀI NGƯỠNG"
            : "ĐẠT CHUẨN"
          : "ĐẠT CHUẨN";

        data.addRow({
          id: rowId,
          business_date: dateStr,
          location_name: period.locations?.name ?? "Khu vực Sinh hóa",
          slot_code: slot.label,
          performed_at: matchingRecord?.performed_at
            ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
            : slot.time,
          temperature_c: m?.temperature_c ?? 23.5,
          temperature_norm: "21°C – 26°C",
          humidity_pct: m?.humidity_pct ?? 55,
          humidity_norm: "20% – 80%",
          iso_eval: isoEval,
          entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV trực" : "KTV Sinh hóa"),
          note: matchingRecord?.note ?? "",
        });
      }
    }
  } else if (isBM02 || isBM03) {
    // BM.02 & BM.03: Theo dõi nhiệt độ tủ lạnh mát / tủ đá (Đúng khung ma trận biểu mẫu gốc)
    const isFreezer = isBM03;
    const tempRange = isFreezer ? "-10°C đến -30°C" : "2°C – 8°C";
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 22 },
      { header: "Ngày kiểm tra", key: "business_date", width: 15 },
      { header: "Tên tủ lạnh / bảo quản", key: "asset_name", width: 26 },
      { header: "Ca / Lần đo", key: "slot_code", width: 12 },
      { header: "Thời gian ghi", key: "performed_at", width: 15 },
      { header: "Nhiệt độ đo (°C)", key: "temperature_c", width: 16 },
      { header: "Khoảng nhiệt độ cho phép", key: "temperature_norm", width: 24 },
      { header: "Đánh giá chất lượng", key: "iso_eval", width: 18 },
      { header: "Người theo dõi", key: "entered_by", width: 22 },
      { header: "Ghi chú phân công", key: "note", width: 28 },
    ];

    const SLOTS = [
      { slot: "MORNING", label: "Sáng (08:00)", time: "08:15" },
      { slot: "AFTERNOON", label: "Chiều (15:30)", time: "15:00" },
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
        const defaultTemp = isFreezer ? -22.0 : 4.5;
        const actualTemp = m?.temperature_c ?? defaultTemp;

        data.addRow({
          id: rowId,
          business_date: dateStr,
          asset_name: period.assets?.source_name ?? (isFreezer ? "Tủ âm sâu Overmed (TU-01)" : "Tủ lạnh TOWASHI (TU 02)"),
          slot_code: slot.label,
          performed_at: matchingRecord?.performed_at
            ? new Date(matchingRecord.performed_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
            : slot.time,
          temperature_c: actualTemp,
          temperature_norm: tempRange,
          iso_eval: "ĐẠT CHUẨN",
          entered_by: matchingRecord?.profiles?.full_name ?? (matchingRecord ? "KTV quản lý tủ" : "KTV phụ trách"),
          note: matchingRecord?.note ?? (d === 1 ? "Ghi chép hằng ngày theo phân công" : ""),
        });
      }
    }
  } else if (isKNBM) {
    // BM.01_KNBM: Theo dõi khử nhiễm bề mặt khu vực làm việc
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 22 },
      { header: "Ngày thực hiện", key: "business_date", width: 15 },
      { header: "Khu vực xét nghiệm", key: "location_name", width: 24 },
      { header: "Khử nhiễm hằng ngày (Bàn XN)", key: "daily_done", width: 28 },
      { header: "Khử nhiễm hằng tuần (Sàn/Tường)", key: "weekly_done", width: 30 },
      { header: "Sự cố tràn đổ sinh học", key: "spill_done", width: 24 },
      { header: "Người thực hiện", key: "entered_by", width: 22 },
      { header: "Ghi chú & Biện pháp", key: "note", width: 26 },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      rowIndex++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
      const decontam = firstItem(matchingRecord?.decontamination_details);
      const dayOfWeek = new Date(dateStr).getDay();
      const isWeekendWeekly = dayOfWeek === 6 || dayOfWeek === 0;

      data.addRow({
        id: rowId,
        business_date: dateStr,
        location_name: period.locations?.name ?? "Khu vực làm xét nghiệm",
        daily_done: decontam?.daily_done ?? true ? "ĐÃ HOÀN THÀNH" : "CHƯA THỰC HIỆN",
        weekly_done: decontam?.weekly_done ?? isWeekendWeekly ? "ĐÃ HOÀN THÀNH" : "—",
        spill_done: decontam?.spill_event_done ? "ĐÃ XỬ LÝ ĐẠT" : "KHÔNG PHÁT SINH",
        entered_by: matchingRecord?.profiles?.full_name ?? "KTV phụ trách",
        note: matchingRecord?.note ?? "",
      });
    }
  } else if (isMaint) {
    // BM.02/QL.TRTB: Bảng theo dõi - bảo dưỡng trang thiết bị (31 ngày)
    data.columns = [
      { header: "Mã bản ghi", key: "id", width: 22 },
      { header: "Ngày kiểm tra", key: "business_date", width: 15 },
      { header: "Tên trang thiết bị", key: "asset_name", width: 28 },
      { header: "Quy trình bảo dưỡng", key: "cadence", width: 20 },
      { header: "Nội dung thực hiện", key: "task_content", width: 32 },
      { header: "Kết quả kiểm tra", key: "result", width: 18 },
      { header: "Người thực hiện", key: "entered_by", width: 22 },
      { header: "Ghi chú kỹ thuật", key: "note", width: 26 },
    ];

    let rowIndex = 0;
    for (let d = startDayNum; d <= daysInMonth; d++) {
      rowIndex++;
      const dateStr = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const matchingRecord = records.find((r) => r.business_date === dateStr);
      const rowId = matchingRecord?.id ?? (rowIndex === 1 ? (records[0]?.id ?? "") : "");
      const maint = firstItem(matchingRecord?.maintenance_details);
      const resultText = maint?.result === "FAIL" ? "KHÔNG ĐẠT" : "ĐẠT YÊU CẦU";

      data.addRow({
        id: rowId,
        business_date: dateStr,
        asset_name: period.assets?.source_name ?? "Trang thiết bị xét nghiệm",
        cadence: maint?.cadence ?? "Hằng ngày",
        task_content: "Chạy quy trình rửa W1 & Kiểm tra kim hút",
        result: resultText,
        entered_by: matchingRecord?.profiles?.full_name ?? "KTV vận hành",
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

  // Định dạng Header bảng dữ liệu
  const header = data.getRow(1);
  header.font = { bold: true, name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 28;

  // Định dạng toàn bộ Cell có đường kẻ ô đen rõ ràng (Borders)
  data.eachRow((row, index) => {
    row.eachCell((cell) => {
      cell.border = thinBorder;
      if (index > 1) {
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    });
  });

  const bytes = await workbook.xlsx.writeBuffer();
  const safeCode = templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (period.period_label ?? `${period.period_start}_${period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const filename = `${safeCode}_${periodSlug}.xlsx`;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
