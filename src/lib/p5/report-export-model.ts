import { BM06_CANONICAL_TEMPLATE_PATH, BM06_FINAL_SHIFT_WINDOWS, BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";
import { HOSPITAL_MACHINES_25 } from "@/constants/machines";

export const BM06_SOURCE_TEMPLATE_PATH = BM06_CANONICAL_TEMPLATE_PATH;

export const SIGNATURE_CONFIG = {
  reviewerLabel: "Người nhập / theo dõi",
  reviewerHint: "(Ký, ghi rõ họ tên)",
  approverLabel: "Xác nhận theo cấu hình",
  approvedHint: "(Đã có xác nhận lịch sử)",
  draftHint: "",
} as const;

export type MeasurementDetail = {
  temperature_c: number | null;
  humidity_pct: number | null;
  temperature_abnormal: boolean;
  humidity_abnormal: boolean;
};

export type DecontaminationDetail = {
  daily_done: boolean;
  weekly_done: boolean;
  spill_event_done: boolean;
};

export type MaintenanceDetail = {
  cadence: string | null;
  result: string | null;
};

export type EquipmentStatus = {
  asset_display_order_snapshot: number;
  status_code: string | null;
  asset_label_snapshot: string | null;
};

export type EquipmentShiftDetail = {
  equipment_shift_statuses: EquipmentStatus[] | EquipmentStatus | null;
};

export type ReportRecord = {
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

export type ReportPeriod = {
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

export type ExportCell = string | number | null;
export type ExportRow = {
  key: string;
  cells: ExportCell[];
  sourceRecordIds: string[];
  pageNumber: number;
  pageBreakAfter: boolean;
  templatePageName?: string;
  templateDeviceOrders?: number[];
};

export type ReportExportModel = {
  period: ReportPeriod;
  templateCode: string;
  templateName: string;
  isApproved: boolean;
  approvalStatusLabel: string;
  approvalTimestampLabel: string;
  filenamePrefix: string;
  objectLabel: string;
  recordCount: number;
  sourceTemplatePath?: string;
  columns: string[];
  rows: ExportRow[];
  signatureConfig: typeof SIGNATURE_CONFIG;
};

function firstItem<T>(val: T[] | T | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] ?? null : val;
}

function timeLabel(value: string | null | undefined, fallback: string) {
  return value ? new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : fallback;
}

function daysFor(startDateStr: string) {
  const yearNum = Number(startDateStr.split("-")[0]);
  const monthNum = Number(startDateStr.split("-")[1]);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
  return Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, dateStr: `${monthPrefix}-${String(i + 1).padStart(2, "0")}` }));
}

function findSlot(records: ReportRecord[], dateStr: string, slot: string, label: string) {
  return records.find((r) => r.business_date === dateStr && (r.slot_code === slot || r.slot_code === label));
}

function mkRow(key: string, cells: ExportCell[], sourceRecordIds: string[], pageNumber = 1, pageBreakAfter = false, templatePageName?: string, templateDeviceOrders?: number[]): ExportRow {
  return { key, cells, sourceRecordIds, pageNumber, pageBreakAfter, templatePageName, templateDeviceOrders };
}

export function buildReportExportModel(input: { period: ReportPeriod; records: ReportRecord[]; start?: string; official?: boolean }): ReportExportModel {
  const period = input.period;
  const records = input.records;
  const templateCode = period.form_template_versions.form_templates.code;
  const templateName = period.form_template_versions.form_templates.name;
  const isApproved = Boolean(input.official && period.status === "APPROVED");
  const approvalStatusLabel = isApproved ? "ĐÃ PHÊ DUYỆT (LỊCH SỬ)" : "ĐANG THEO DÕI";
  const approvalTimestampLabel = isApproved && period.approved_at ? period.approved_at : "";
  const filenamePrefix = isApproved ? "" : "[DANG_THEO_DOI]_";
  const objectLabel = period.locations?.name ?? period.assets?.source_name ?? "";
  const dates = daysFor(input.start ?? period.period_start);

  let columns: string[] = [];
  let rows: ExportRow[] = [];
  let sourceTemplatePath: string | undefined;

  if (templateCode.includes("BM.01/QL.HTAT")) {
    columns = ["Mã bản ghi", "Ngày", "Ca / Lần đo", "Giờ đo", "Nhiệt độ (°C)", "Độ ẩm (%)", "Đánh giá ISO", "Người thực hiện", "Ghi chú"];
    const slots = [{ slot: "MORNING", label: "Sáng", time: "08:30" }, { slot: "AFTERNOON", label: "Chiều", time: "14:30" }];
    for (const d of dates) for (const slot of slots) {
      const r = findSlot(records, d.dateStr, slot.slot, slot.label);
      const m = firstItem(r?.measurement_details);
      const abnormal = Boolean(m?.temperature_abnormal || m?.humidity_abnormal);
      rows.push(mkRow(`${d.dateStr}-${slot.slot}`, [r?.id ?? null, d.dateStr, slot.label, timeLabel(r?.performed_at, slot.time), m?.temperature_c ?? null, m?.humidity_pct ?? null, r ? (r.is_na ? `N/A: ${r.na_reason ?? ""}` : abnormal ? "Ngoài ngưỡng" : null) : null, r?.profiles?.full_name ?? null, r?.note ?? null], r ? [r.id] : []));
    }
  } else if (templateCode.includes("BM.02/QL.HTAT") || templateCode.includes("BM.03/QL.HTAT")) {
    columns = ["STT", "Ngày", "Ca / Lần đo", "Tên tủ lưu trữ", "Nhiệt độ (°C)", "Đánh giá ngưỡng", "Người thực hiện", "Ghi chú"];
    const slots = [{ slot: "MORNING", label: "Sáng", time: "08:30" }, { slot: "AFTERNOON", label: "Chiều", time: "14:30" }];
    let stt = 0;
    for (const d of dates) for (const slot of slots) {
      stt++;
      const r = findSlot(records, d.dateStr, slot.slot, slot.label);
      const m = firstItem(r?.measurement_details);
      rows.push(mkRow(`${d.dateStr}-${slot.slot}`, [stt, d.dateStr, slot.label, period.assets?.source_name ?? null, m?.temperature_c ?? null, r ? (r.is_na ? `N/A: ${r.na_reason ?? ""}` : m?.temperature_abnormal ? "Ngoài dải an toàn" : null) : null, r?.profiles?.full_name ?? null, r?.note ?? null], r ? [r.id] : []));
    }
  } else if (templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM")) {
    columns = ["STT", "Ngày", "Khu vực", "Khử khuẩn hằng ngày", "Khử khuẩn hằng tuần", "Xử lý tràn đổ", "Người thực hiện", "Ghi chú"];
    let stt = 0;
    for (const d of dates) {
      stt++;
      const r = records.find((item) => item.business_date === d.dateStr);
      const dec = firstItem(r?.decontamination_details);
      rows.push(mkRow(d.dateStr, [stt, d.dateStr, period.locations?.name ?? null, dec?.daily_done ? "Có" : null, dec?.weekly_done ? "Có" : null, dec?.spill_event_done ? "Có" : null, r?.profiles?.full_name ?? null, r?.note ?? null], r ? [r.id] : []));
    }
  } else if (templateCode.includes("BM.02/QL.TRTB")) {
    columns = ["STT", "Ngày", "Tên thiết bị", "Chu kỳ bảo dưỡng", "Kết quả bảo dưỡng", "Người thực hiện", "Ghi chú"];
    let stt = 0;
    for (const d of dates) {
      stt++;
      const r = records.find((item) => item.business_date === d.dateStr);
      const maint = firstItem(r?.maintenance_details);
      rows.push(mkRow(d.dateStr, [stt, d.dateStr, period.assets?.source_name ?? null, maint?.cadence ?? null, maint?.result ?? null, r?.profiles?.full_name ?? null, r?.note ?? null], r ? [r.id] : []));
    }
  } else if (templateCode.includes("BM.06")) {
    sourceTemplatePath = BM06_SOURCE_TEMPLATE_PATH;
    for (const templatePage of BM06_TEMPLATE_PAGES) {
      columns = ["Mã bản ghi", "Ngày vận hành", "Người sử dụng", "Lượng sử dụng", ...templatePage.devices.map((m) => `#${m.order} ${m.name}`), "Ghi chú"];
      for (const d of dates) for (const shift of BM06_FINAL_SHIFT_WINDOWS) {
        const r = findSlot(records, d.dateStr, shift.slot, shift.label);
        const detail = firstItem(r?.equipment_shift_details);
        const statuses = detail ? (Array.isArray(detail.equipment_shift_statuses) ? detail.equipment_shift_statuses : detail.equipment_shift_statuses ? [detail.equipment_shift_statuses] : []) : [];
        const byOrder = new Map(statuses.map((status) => [status.asset_display_order_snapshot, status.status_code]));
        const note = r?.note ?? null;
        rows.push(mkRow(`${templatePage.name}-${d.dateStr}-${shift.slot}`, [r?.id ?? null, d.dateStr, r?.profiles?.full_name ?? null, shift.time, ...templatePage.devices.map((m) => byOrder.get(m.order) ?? null), note], r ? [r.id] : [], Number(templatePage.name.replace("Trang ", "")), false, templatePage.name, templatePage.devices.map((device) => device.order)));
      }
    }
    columns = ["Mã bản ghi", "Ngày vận hành", "Người sử dụng", "Lượng sử dụng", ...HOSPITAL_MACHINES_25.map((m) => `#${m.order} ${m.name}`), "Ghi chú"];
  } else {
    columns = ["STT", "Ngày", "Ca / Thời gian", "Loại bản ghi", "Thời điểm thực hiện", "Người thực hiện", "Ghi chú"];
    rows = records.map((r, index) => mkRow(r.id, [r.id, index + 1, r.business_date, r.slot_code ?? null, r.record_type, r.performed_at ?? null, r.profiles?.full_name ?? null, r.note ?? null], [r.id]));
  }

  return { period, templateCode, templateName, isApproved, approvalStatusLabel, approvalTimestampLabel, filenamePrefix, objectLabel, recordCount: records.length, sourceTemplatePath, columns, rows, signatureConfig: SIGNATURE_CONFIG };
}
