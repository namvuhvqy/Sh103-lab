import { createClient } from "@/lib/supabase/server";
import { currentShift, vietnamParts, SHIFT_DEFINITIONS } from "@/lib/forms/domain";

export interface ShiftStatusSummary {
  code: string;
  label: string;
  timeRange: string;
  isCurrent: boolean;
  isPast: boolean;
  status: "COMPLETED" | "PENDING";
  occurrenceId: string;
  recordedCount: number;
  totalCount: number;
}

export interface AreaTaskSummary {
  locationId: string;
  code: string;
  name: string;
  tempMorning: "COMPLETED" | "PENDING" | "N/A";
  tempAfternoon: "COMPLETED" | "PENDING" | "N/A";
  deconDaily: "COMPLETED" | "PENDING" | "N/A";
  fridgesPending: number;
  fridgesTotal: number;
  isFullyDone: boolean;
}

export interface TodayMissingTask {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  urgency: "urgent" | "normal";
}

export interface TodayOperationalOverview {
  today: string;
  currentShiftCode: string;
  shifts: ShiftStatusSummary[];
  areas: AreaTaskSummary[];
  missingTasks: TodayMissingTask[];
  overallCompleted: number;
  overallTotal: number;
}

export async function getTodayRealtimeOverview(date?: string): Promise<TodayOperationalOverview> {
  const supabase = await createClient();
  const current = currentShift();
  const today = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : vietnamParts(new Date()).date;

  // Single efficient query to get all today's occurrences
  const { data: occurrences, error } = await supabase
    .from("schedule_occurrences")
    .select(`
      id, status, slot_code, business_date, fulfilled_by_record_id,
      register_periods!inner(
        id, location_id, asset_id,
        locations(id, code, name, sort_order),
        assets(id, source_name, source_order, location_id),
        form_template_versions!inner(form_templates!inner(code, name))
      )
    `)
    .eq("business_date", today);

  if (error) {
    console.error("Error fetching today occurrences:", error);
    throw new Error(`Không tải được trạng thái vận hành hôm nay: ${error.message}`);
  }

  const allOccs = occurrences ?? [];

  // 1. Process BM.06 4 shifts
  const bm06Occs = allOccs.filter((o) => {
    const tmplCode = (o.register_periods as any)?.form_template_versions?.form_templates?.code;
    return tmplCode === "BM.06/QL.TRTB.01";
  });

  const shiftOrder = ["SHIFT_1", "SHIFT_2", "SHIFT_3", "SHIFT_4"];
  const currentShiftIndex = shiftOrder.indexOf(current.code);

  const shifts: ShiftStatusSummary[] = shiftOrder.map((shiftCode, idx) => {
    const def = SHIFT_DEFINITIONS.find((s) => s.code === shiftCode);
    const occ = bm06Occs.find((o) => o.slot_code === shiftCode);
    const isCompleted = occ?.status === "COMPLETED";
    const isCurrent = shiftCode === current.code;
    const isPast = idx < currentShiftIndex;

    return {
      code: shiftCode,
      label: def?.label.split(" (")[0] ?? shiftCode,
      timeRange: def ? (def.label.split("(")[1]?.replace(")", "") ?? "") : "",
      isCurrent,
      isPast,
      status: isCompleted ? "COMPLETED" : "PENDING",
      occurrenceId: occ?.id ?? "",
      recordedCount: isCompleted ? 20 : 0,
      totalCount: 20,
    };
  });

  // 2. Process 5 Areas
  const targetAreaCodes = ["SINH_HOA", "MIEN_DICH", "NUOC_TIEU", "LY_TAM", "NHAN_BENH_PHAM"];
  const areaNameMap: Record<string, string> = {
    SINH_HOA: "Sinh hóa",
    MIEN_DICH: "Miễn dịch",
    NUOC_TIEU: "Nước tiểu",
    LY_TAM: "Ly tâm",
    NHAN_BENH_PHAM: "Nhận bệnh phẩm",
  };

  const areas: AreaTaskSummary[] = targetAreaCodes.map((code) => {
    // Temperature BM.01 for this area
    const tempMorningOcc = allOccs.find((o) => {
      const p = o.register_periods as any;
      return (
        p?.locations?.code === code &&
        p?.form_template_versions?.form_templates?.code === "BM.01/QL.HTAT.01" &&
        o.slot_code === "MORNING"
      );
    });

    const tempAfternoonOcc = allOccs.find((o) => {
      const p = o.register_periods as any;
      return (
        p?.locations?.code === code &&
        p?.form_template_versions?.form_templates?.code === "BM.01/QL.HTAT.01" &&
        o.slot_code === "AFTERNOON"
      );
    });

    // Decontamination BM.01_KNBM for this area (daily)
    const deconOcc = allOccs.find((o) => {
      const p = o.register_periods as any;
      return (
        p?.locations?.code === code &&
        p?.form_template_versions?.form_templates?.code === "BM.01_KNBM"
      );
    });

    const tempMorning = tempMorningOcc ? (tempMorningOcc.status === "COMPLETED" ? "COMPLETED" : "PENDING") : "N/A";
    const tempAfternoon = tempAfternoonOcc ? (tempAfternoonOcc.status === "COMPLETED" ? "COMPLETED" : "PENDING") : "N/A";
    const deconDaily = deconOcc ? (deconOcc.status === "COMPLETED" ? "COMPLETED" : "PENDING") : "N/A";

    const isFullyDone =
      (tempMorning === "N/A" || tempMorning === "COMPLETED") &&
      (tempAfternoon === "N/A" || tempAfternoon === "COMPLETED") &&
      (deconDaily === "N/A" || deconDaily === "COMPLETED");

    return {
      locationId: (tempMorningOcc?.register_periods as any)?.locations?.id ?? "",
      code,
      name: areaNameMap[code] ?? code,
      tempMorning,
      tempAfternoon,
      deconDaily,
      fridgesPending: 0,
      fridgesTotal: 0,
      isFullyDone,
    };
  });

  // 3. Build Missing Tasks list
  const missingTasks: TodayMissingTask[] = [];

  // BM.06 missing shifts
  shifts.forEach((s) => {
    if (s.status === "PENDING") {
      missingTasks.push({
        id: `bm06-${s.code}`,
        title: `Nhật ký 20 thiết bị (${s.label})`,
        subtitle: s.isPast ? "Đã qua khung giờ nhưng chưa chốt sổ" : s.isCurrent ? "Đang trong ca trực hiện tại" : "Chưa đến ca",
        href: `/equipment?shift=${s.code}`,
        urgency: s.isPast ? "urgent" : "normal",
      });
    }
  });

  // Area missing tasks
  areas.forEach((a) => {
    if (a.tempMorning === "PENDING") {
      missingTasks.push({
        id: `temp-${a.code}-morning`,
        title: `Nhiệt độ phòng sáng — Khu ${a.name}`,
        subtitle: "Chưa ghi nhận thông số nhiệt ẩm buổi sáng",
        href: `/temperature?area=${a.code}`,
        urgency: "urgent",
      });
    }
    if (a.tempAfternoon === "PENDING") {
      missingTasks.push({
        id: `temp-${a.code}-afternoon`,
        title: `Nhiệt độ phòng chiều — Khu ${a.name}`,
        subtitle: "Chưa ghi nhận thông số nhiệt ẩm buổi chiều",
        href: `/temperature?area=${a.code}`,
        urgency: currentShiftIndex >= 2 ? "urgent" : "normal",
      });
    }
    if (a.deconDaily === "PENDING") {
      missingTasks.push({
        id: `decon-${a.code}`,
        title: `Khử nhiễm bề mặt — Khu ${a.name}`,
        subtitle: "Chưa hoàn tất khử nhiễm bề mặt hôm nay",
        href: `/decontamination?area=${a.code}`,
        urgency: "urgent",
      });
    }
  });

  const total = allOccs.length;
  const completed = allOccs.filter((o) => o.status === "COMPLETED").length;

  return {
    today,
    currentShiftCode: current.code,
    shifts,
    areas,
    missingTasks,
    overallCompleted: completed,
    overallTotal: total,
  };
}
