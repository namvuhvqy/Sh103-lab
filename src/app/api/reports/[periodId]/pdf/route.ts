import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
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

  type Period = {
    period_label: string | null;
    period_start: string;
    period_end: string;
    status: string;
    approved_at: string | null;
    approved_by: string | null;
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

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(join(process.cwd(), "assets/fonts/DejaVuSans.ttf"));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  let page = pdf.addPage([595.28, 841.89]);
  let y = 800;

  const draw = (text: string, size = 10, color = rgb(0.12, 0.18, 0.25)) => {
    if (y < 48) {
      page = pdf.addPage([595.28, 841.89]);
      y = 800;
    }
    page.drawText(text.slice(0, 115), { x: 42, y, size, font, color });
    y -= size + 8;
  };

  // Tiêu đề cơ quan & Bệnh viện
  draw("BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA", 15, rgb(0.05, 0.58, 0.53));
  draw("HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG THEO TIÊU CHUẨN ISO 15189:2022", 9, rgb(0.35, 0.4, 0.46));
  y -= 4;

  // Tiêu đề biểu mẫu
  draw(`${templateCode} — ${period.form_template_versions.form_templates.name}`, 13, rgb(0.08, 0.12, 0.18));
  draw(`Phiên bản quy định: ${period.form_template_versions.version_label}`);
  draw(`Kỳ theo dõi: ${period.period_label ?? `${period.period_start} – ${period.period_end}`}`);
  draw(`Đối tượng: ${period.locations?.name ?? period.assets?.source_name ?? "Toàn khoa Sinh hóa"}`);

  const isApproved = report.official || period.status === "APPROVED";
  if (isApproved) {
    draw(`Trạng thái: ĐÃ PHÊ DUYỆT ĐIỆN TỬ (Chính thức) lúc ${period.approved_at ?? ""}`, 10, rgb(0.04, 0.48, 0.24));
  } else {
    draw("TRẠNG THÁI: BẢN NHÁP — CHƯA PHÊ DUYỆT (CHỈ DÙNG ĐỂ KIỂM TRA NỘI BỘ)", 10, rgb(0.85, 0.15, 0.15));
  }
  y -= 8;

  draw(`DỮ LIỆU LÂM SÀNG THỰC TẾ (${records.length} bản ghi)`, 11, rgb(0.05, 0.58, 0.53));

  for (const row of records) {
    const slot = row.slot_code ? row.slot_code.replace("SHIFT_", "Ca ") : "—";
    if (templateCode.includes("BM.01/QL.HTAT")) {
      const m = firstItem(row.measurement_details);
      const isAbnormal = m?.temperature_abnormal || m?.humidity_abnormal;
      const evalText = row.is_na ? `N/A (${row.na_reason})` : (isAbnormal ? "[NGOÀI NGƯỠNG]" : "[ĐẠT]");
      draw(`${row.business_date} · ${slot} · Nhiệt độ: ${m?.temperature_c ?? "—"}°C · Độ ẩm: ${m?.humidity_pct ?? "—"}% · ${evalText} · KTV: ${row.profiles?.full_name ?? "—"}`);
    } else if (templateCode.includes("BM.02/QL.HTAT") || templateCode.includes("BM.03/QL.HTAT")) {
      const m = firstItem(row.measurement_details);
      const evalText = row.is_na ? `N/A` : (m?.temperature_abnormal ? "[NGOÀI NGƯỠNG]" : "[ĐẠT]");
      draw(`${row.business_date} · ${slot} · ${period.assets?.source_name ?? "Tủ"} · Nhiệt độ: ${m?.temperature_c ?? "—"}°C · ${evalText} · KTV: ${row.profiles?.full_name ?? "—"}`);
    } else if (templateCode.includes("BM.01_KNBM") || templateCode.includes("KNBM")) {
      const d = firstItem(row.decontamination_details);
      draw(`${row.business_date} · Khu vực: ${period.locations?.name ?? "PXN"} · Ngày: ${d?.daily_done ? "Đạt" : "—"} · Tuần: ${d?.weekly_done ? "Đạt" : "—"} · KTV: ${row.profiles?.full_name ?? "—"}`);
    } else if (templateCode.includes("BM.02/QL.TRTB")) {
      const m = firstItem(row.maintenance_details);
      draw(`${row.business_date} · Máy: ${period.assets?.source_name ?? "Thiết bị"} · Chu kỳ: ${m?.cadence ?? "—"} · Kết quả: ${m?.result ?? "ĐẠT"} · KTV: ${row.profiles?.full_name ?? "—"}`);
    } else if (templateCode.includes("BM.06")) {
      const s = firstItem(row.equipment_shift_details)?.equipment_shift_statuses;
      draw(`${row.business_date} · ${slot} · Máy: ${s?.asset_label_snapshot ?? period.assets?.source_name ?? "Máy"} · Trạng thái: ${s?.status_code ?? "BT"} · KTV: ${row.profiles?.full_name ?? "—"}`);
    } else {
      draw(`${row.business_date} · ${slot} · ${row.record_type} · KTV: ${row.profiles?.full_name ?? "—"}`);
    }
    if (row.note) draw(`  * Ghi chú: ${row.note}`, 9, rgb(0.35, 0.4, 0.46));
  }

  y -= 16;
  draw("----------------------------------------------------------------------------------------------------------------", 8, rgb(0.7, 0.75, 0.8));
  draw("Xác nhận: Người ghi nhận / Kỹ thuật viên                      Trưởng khoa / Người phụ trách duyệt", 9, rgb(0.2, 0.25, 0.3));

  const bytes = await pdf.save();
  const safeCode = templateCode.replace(/[\/\\?%*:|"<>]/g, "_");
  const periodSlug = (period.period_label ?? `${period.period_start}_${period.period_end}`).replace(/[\/\\?%*:|"<> ]/g, "_");
  const prefix = report.official ? "" : "[BAN_NHAP]_";
  const filename = `${prefix}${safeCode}_${periodSlug}.pdf`;

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
