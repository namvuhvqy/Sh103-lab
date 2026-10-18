import { BM06_CANONICAL_TEMPLATE_PATH, BM06_FINAL_SHIFT_WINDOWS, BM06_TEMPLATE_PAGES } from "@/lib/p5/bm06-template";

export const BM06_SOURCE_TEMPLATE_PATH = BM06_CANONICAL_TEMPLATE_PATH;

export const SIGNATURE_CONFIG = {
  recorderLabel: "Người ghi sổ / thực hiện",
  reviewerLabel: "Cán bộ kiểm tra",
  approverLabel: "Chỉ huy Bộ môn - Khoa",
  approverName: "TS. Huỳnh Quang Thuận",
  approverTitle: "Chỉ huy Bộ môn - Khoa",
  approvedHint: "Đã rà soát & Xác nhận nội bộ",
  draftHint: "Đang theo dõi",
} as const;

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

export type ReportPeriod = {
  id: string;
  period_label: string | null;
  period_start: string;
  period_end: string;
  status: string;
  approved_at: string | null;
  locations: { name: string } | null;
  assets: { source_name: string; source_code?: string } | null;
  form_template_versions: { version_label: string; form_templates: { code: string; name: string } };
};

export type ReportRecord = {
  id: string;
  record_type: string;
  business_date: string;
  slot_code: string | null;
  performed_at: string | null;
  entered_at: string;
  is_na?: boolean;
  na_reason?: string | null;
  note?: string | null;
  revision_no: number;
  is_effective: boolean;
  profiles?: { full_name: string } | null;
  measurement_details?: {
    temperature_c?: number | null;
    humidity_pct?: number | null;
    temperature_abnormal?: boolean;
    humidity_abnormal?: boolean;
  } | Array<{
    temperature_c?: number | null;
    humidity_pct?: number | null;
    temperature_abnormal?: boolean;
    humidity_abnormal?: boolean;
  }> | null;
  decontamination_details?: {
    daily_done?: boolean;
    weekly_done?: boolean;
    spill_event_done?: boolean;
  } | Array<{
    daily_done?: boolean;
    weekly_done?: boolean;
    spill_event_done?: boolean;
  }> | null;
  maintenance_details?: {
    cadence?: string | null;
    result?: string | null;
  } | Array<{
    cadence?: string | null;
    result?: string | null;
  }> | null;
  equipment_shift_details?: {
    usage_value?: number | null;
    usage_unit?: string | null;
    co_worker_name?: string | null;
    equipment_shift_statuses?: Array<{
      asset_display_order_snapshot: number;
      status_code: string;
      asset_label_snapshot?: string;
    }>;
  } | Array<{
    usage_value?: number | null;
    usage_unit?: string | null;
    co_worker_name?: string | null;
    equipment_shift_statuses?: Array<{
      asset_display_order_snapshot: number;
      status_code: string;
      asset_label_snapshot?: string;
    }>;
  }> | null;
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

function timeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
}

function daysFor(startDateStr: string) {
  const yearNum = Number(startDateStr.split("-")[0]);
  const monthNum = Number(startDateStr.split("-")[1]);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthPrefix = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    dateStr: `${monthPrefix}-${String(i + 1).padStart(2, "0")}`,
  }));
}

function findSlot(
  records: ReportRecord[],
  dateStr: string,
  targetSlot: string,
  label?: string
): ReportRecord | undefined {
  const dayRecords = records.filter((r) => r.business_date === dateStr);
  if (!dayRecords.length) return undefined;

  // 1. First priority: Exact match with targetSlot or label (e.g. SHIFT_1, MORNING, AFTERNOON, etc.)
  const exact = dayRecords.filter((r) => {
    const sc = (r.slot_code ?? "").toUpperCase().trim();
    const target = targetSlot.toUpperCase().trim();
    const lbl = (label ?? "").toUpperCase().trim();

    if (sc === target || (lbl && sc === lbl)) return true;

    if (target === "MORNING") {
      return sc === "SÁNG" || sc === "SANG" || sc === "SHIFT_1" || sc === "SLOT_1";
    }
    if (target === "AFTERNOON") {
      return sc === "CHIỀU" || sc === "CHIEU" || sc === "SHIFT_3" || sc === "SLOT_2";
    }
    return false;
  });

  if (exact.length > 0) {
    // Return the latest record if multiple revisions exist
    return exact[exact.length - 1];
  }

  // 2. Second priority for temperature: Fallback by performed_at / entered_at time in Vietnam timezone (UTC+7)
  const targetUpper = targetSlot.toUpperCase().trim();
  if (targetUpper === "MORNING" || targetUpper === "AFTERNOON") {
    const sorted = [...dayRecords].sort((a, b) => {
      const tA = new Date(a.performed_at ?? a.entered_at ?? 0).getTime();
      const tB = new Date(b.performed_at ?? b.entered_at ?? 0).getTime();
      return tA - tB;
    });

    if (sorted.length === 1) {
      const r = sorted[0];
      const ts = r.performed_at ?? r.entered_at;
      if (ts) {
        const vnHour = (new Date(ts).getUTCHours() + 7) % 24;
        if (targetUpper === "MORNING" && vnHour < 12) return r;
        if (targetUpper === "AFTERNOON" && vnHour >= 12) return r;
      }
      return undefined;
    }

    if (targetUpper === "MORNING") return sorted[0];
    if (targetUpper === "AFTERNOON") return sorted[sorted.length - 1];
  }

  return undefined;
}

function mkRow(
  key: string,
  cells: ExportCell[],
  sourceRecordIds: string[],
  pageNumber = 1,
  pageBreakAfter = false,
  templatePageName?: string,
  templateDeviceOrders?: number[]
): ExportRow {
  return { key, cells, sourceRecordIds, pageNumber, pageBreakAfter, templatePageName, templateDeviceOrders };
}

// Clean and format performer name (keep full Vietnamese name from profile)
function formatShortName(fullName?: string | null): string {
  if (!fullName) return "";
  return fullName.trim();
}

export function buildReportExportModel(input: {
  period: ReportPeriod;
  records: ReportRecord[];
  start?: string;
  official?: boolean;
}): ReportExportModel {
  const period = input.period;
  const records = input.records;
  const templateCode = period.form_template_versions.form_templates.code;
  const templateName = period.form_template_versions.form_templates.name;
  const isApproved = true;
  const approvalStatusLabel = "CHÍNH THỨC";
  const approvalTimestampLabel = period.approved_at ?? "";
  const filenamePrefix = "";
  const objectLabel = period.locations?.name ?? period.assets?.source_name ?? "";
  const dates = daysFor(input.start ?? period.period_start);

  let columns: string[] = [];
  let rows: ExportRow[] = [];
  let sourceTemplatePath: string | undefined;

  // 1. BM.01/QL.HTAT.01: Theo dõi nhiệt độ, độ ẩm PXN (1 ngày = 1 dòng, 2 ca sáng/chiều)
  if (templateCode.includes("BM.01/QL.HTAT")) {
    columns = [
      "Ngày",
      "Giờ đo (Sáng)",
      "Giờ đo (Chiều)",
      "Nhiệt độ Sáng (°C)",
      "Nhiệt độ Chiều (°C)",
      "Độ ẩm Sáng (%)",
      "Độ ẩm Chiều (%)",
      "Ghi chú",
      "Người thực hiện",
    ];

    for (const d of dates) {
      const rMorning = findSlot(records, d.dateStr, "MORNING");
      const rAfternoon = findSlot(records, d.dateStr, "AFTERNOON");
      const mM = firstItem(rMorning?.measurement_details);
      const mA = firstItem(rAfternoon?.measurement_details);

      const rIds: string[] = [];
      if (rMorning) rIds.push(rMorning.id);
      if (rAfternoon) rIds.push(rAfternoon.id);

      const performerM = formatShortName(rMorning?.profiles?.full_name);
      const performerA = formatShortName(rAfternoon?.profiles?.full_name);
      const performer = performerM && performerA && performerM !== performerA
        ? `${performerM} - ${performerA}`
        : (performerM || performerA || null);

      const note = rMorning?.note || rAfternoon?.note || null;

      rows.push(
        mkRow(
          d.dateStr,
          [
            d.day,
            rMorning?.performed_at ? timeLabel(rMorning.performed_at) : null,
            rAfternoon?.performed_at ? timeLabel(rAfternoon.performed_at) : null,
            mM?.temperature_c ?? null,
            mA?.temperature_c ?? null,
            mM?.humidity_pct ?? null,
            mA?.humidity_pct ?? null,
            note,
            performer,
          ],
          rIds
        )
      );
    }
  }

  // 2. BM.01_KNBM: Phiếu theo dõi khử nhiễm bề mặt (1 ngày = 1 dòng)
  else if (templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM")) {
    columns = [
      "Ngày",
      "Hằng ngày (Bàn XN)",
      "Hằng tuần (Sàn/tường)",
      "Khi có tràn đổ",
      "Ghi chú",
      "Người thực hiện",
    ];

    for (const d of dates) {
      const r = records.find((item) => item.business_date === d.dateStr);
      const dec = firstItem(r?.decontamination_details);
      const performer = formatShortName(r?.profiles?.full_name);

      rows.push(
        mkRow(
          d.dateStr,
          [
            d.day,
            dec?.daily_done ? "✓" : null,
            dec?.weekly_done ? "✓" : null,
            dec?.spill_event_done ? "✓" : null,
            r?.note || null,
            performer || null,
          ],
          r ? [r.id] : []
        )
      );
    }
  }

  // 3. BM.02/QL.HTAT & BM.03/QL.HTAT: Tủ lạnh mát & Tủ đông/đá
  else if (templateCode.includes("BM.02/QL.HTAT") || templateCode.includes("BM.03/QL.HTAT")) {
    columns = [
      "Ngày",
      "Nhiệt độ Sáng (°C)",
      "Nhiệt độ Chiều (°C)",
      "Đánh giá ngưỡng",
      "Ghi chú",
      "Người thực hiện",
    ];

    for (const d of dates) {
      const rMorning = findSlot(records, d.dateStr, "MORNING");
      const rAfternoon = findSlot(records, d.dateStr, "AFTERNOON");
      const mM = firstItem(rMorning?.measurement_details);
      const mA = firstItem(rAfternoon?.measurement_details);

      const rIds: string[] = [];
      if (rMorning) rIds.push(rMorning.id);
      if (rAfternoon) rIds.push(rAfternoon.id);

      const evalText = (mM?.temperature_abnormal || mA?.temperature_abnormal)
        ? "Ngoài ngưỡng"
        : (mM?.temperature_c !== null || mA?.temperature_c !== null ? "Đạt" : null);

      const performerM = formatShortName(rMorning?.profiles?.full_name);
      const performerA = formatShortName(rAfternoon?.profiles?.full_name);
      const performer = performerM && performerA && performerM !== performerA
        ? `${performerM} - ${performerA}`
        : (performerM || performerA || null);

      rows.push(
        mkRow(
          d.dateStr,
          [
            d.day,
            mM?.temperature_c ?? null,
            mA?.temperature_c ?? null,
            evalText,
            rMorning?.note || rAfternoon?.note || null,
            performer,
          ],
          rIds
        )
      );
    }
  }

  // 4. BM.02/QL.TRTB.01: Bảo dưỡng trang thiết bị
  else if (templateCode.includes("BM.02/QL.TRTB")) {
    columns = ["Ngày", "Chu kỳ bảo dưỡng", "Kết quả bảo dưỡng", "Người thực hiện", "Ghi chú"];
    for (const d of dates) {
      const r = records.find((item) => item.business_date === d.dateStr);
      const maint = firstItem(r?.maintenance_details);
      const performer = formatShortName(r?.profiles?.full_name);
      const resultText = maint?.result === "PASS" ? "Đạt" : (maint?.result === "FAIL" ? "Không đạt" : null);

      rows.push(
        mkRow(
          d.dateStr,
          [
            d.day,
            maint?.cadence || null,
            resultText,
            performer || null,
            r?.note || null,
          ],
          r ? [r.id] : []
        )
      );
    }
  }

  // 5. BM.06/QL.TRTB.01: Nhật ký 4 ca 20 máy xét nghiệm (3 ngày / 1 đợt)
  else if (templateCode.includes("BM.06")) {
    sourceTemplatePath = BM06_SOURCE_TEMPLATE_PATH;

    // 20 machines in canonical order
    const page1Devices = BM06_TEMPLATE_PAGES[0].devices;
    const page2Devices = BM06_TEMPLATE_PAGES[1].devices;
    const all20Devices = [...page1Devices, ...page2Devices];

    columns = [
      "Ngày",
      "Ca trực",
      "Người sử dụng (Kíp trực)",
      ...all20Devices.map((d) => `#${d.order} ${d.shortLabel}`),
      "Ghi chú",
    ];

    // Split dates into 3-day cycles (10 cycles for 30 days)
    const cyclesCount = Math.ceil(dates.length / 3);
    for (let cIdx = 0; cIdx < cyclesCount; cIdx++) {
      const cyclePageNumber = cIdx + 1;
      const cycleDates = dates.slice(cIdx * 3, cIdx * 3 + 3);

      for (const d of cycleDates) {
        for (const shift of BM06_FINAL_SHIFT_WINDOWS) {
          const r = findSlot(records, d.dateStr, shift.slot, shift.label);
          const detail = firstItem(r?.equipment_shift_details);
          const statuses = detail
            ? (Array.isArray(detail.equipment_shift_statuses)
                ? detail.equipment_shift_statuses
                : detail.equipment_shift_statuses
                ? [detail.equipment_shift_statuses]
                : [])
            : [];
          const byOrder = new Map(statuses.map((s) => [s.asset_display_order_snapshot, s.status_code]));

          // Performer formatting: Primary + Coworker
          const primaryName = formatShortName(r?.profiles?.full_name);
          const coWorkerName = formatShortName(detail?.co_worker_name);
          const userName: string | null = primaryName && coWorkerName
            ? `${primaryName} - ${coWorkerName}`
            : (primaryName || coWorkerName || null);

          // 20 machine status values mapped by exact sourceAssetOrder: if missing in DB, leave null/empty!
          const statusCells = all20Devices.map((dev) => byOrder.get(dev.sourceAssetOrder) ?? null);

          rows.push(
            mkRow(
              `${d.dateStr}-${shift.slot}`,
              [
                d.dateStr,
                shift.label + ` (${shift.time})`,
                userName,
                ...statusCells,
                r?.note || null,
              ],
              r ? [r.id] : [],
              cyclePageNumber,
              false,
              `Đợt ${cyclePageNumber}`,
              all20Devices.map((d) => d.order)
            )
          );
        }
      }
    }
  }

  // Fallback generic
  else {
    columns = ["STT", "Ngày", "Ca / Thời gian", "Loại bản ghi", "Người thực hiện", "Ghi chú"];
    rows = records.map((r, index) =>
      mkRow(
        r.id,
        [index + 1, r.business_date, r.slot_code ?? null, r.record_type, r.profiles?.full_name ?? null, r.note ?? null],
        [r.id]
      )
    );
  }

  return {
    period,
    templateCode,
    templateName,
    isApproved,
    approvalStatusLabel,
    approvalTimestampLabel,
    filenamePrefix,
    objectLabel,
    recordCount: records.length,
    sourceTemplatePath,
    columns,
    rows,
    signatureConfig: SIGNATURE_CONFIG,
  };
}
