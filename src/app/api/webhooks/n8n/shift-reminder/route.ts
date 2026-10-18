import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentShift, vietnamParts } from "@/lib/forms/domain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleShiftReminder(request);
}

export async function POST(request: Request) {
  return handleShiftReminder(request);
}

async function handleShiftReminder(request: Request) {
  try {
    const url = new URL(request.url);
    const authHeader = request.headers.get("authorization") || "";
    const apiKey = url.searchParams.get("key") || authHeader.replace("Bearer ", "");

    // Optional secret key check (can be configured in N8N_WEBHOOK_SECRET)
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
    if (expectedSecret && apiKey !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook access" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = vietnamParts(new Date()).date;
    const shift = currentShift();

    // 1. Fetch BM06 occurrence and statuses
    const { data: occ } = await supabase
      .from("schedule_occurrences")
      .select("id, status, fulfilled_by_record_id, register_periods!inner(form_template_versions!inner(form_templates!inner(code)))")
      .eq("business_date", today)
      .eq("slot_code", shift.code)
      .eq("register_periods.form_template_versions.form_templates.code", "BM.06/QL.TRTB.01")
      .maybeSingle();

    let recordedMachinesCount = 0;
    if (occ?.fulfilled_by_record_id) {
      const { count } = await supabase
        .from("equipment_shift_statuses")
        .select("*", { count: "exact", head: true })
        .eq("shift_record_id", occ.fulfilled_by_record_id);
      recordedMachinesCount = count ?? 0;
    }

    // 2. Fetch Decontamination occurrences for today
    const { data: deconOccs } = await supabase
      .from("schedule_occurrences")
      .select("id, status, fulfilled_by_record_id, register_periods!inner(form_template_versions!inner(form_templates!inner(code)))")
      .eq("business_date", today)
      .eq("register_periods.form_template_versions.form_templates.code", "BM.01_KNBM");

    const totalDecon = deconOccs?.length || 5;
    const completedDecon = (deconOccs ?? []).filter((o) => o.status !== "PENDING" || o.fulfilled_by_record_id).length;

    const totalMachines = 20;
    const bm06Done = recordedMachinesCount >= totalMachines;
    const deconDone = completedDecon >= totalDecon;
    const needsReminder = !bm06Done || !deconDone;

    const missingItems: string[] = [];
    if (!bm06Done) {
      missingItems.push(`• BM.06 Nhật ký máy: Còn thiếu ${totalMachines - recordedMachinesCount}/${totalMachines} máy chưa ghi nhận`);
    }
    if (!deconDone) {
      missingItems.push(`• Khử nhiễm bề mặt (BM.01_KNBM): Còn thiếu ${totalDecon - completedDecon}/${totalDecon} khu vực`);
    }

    const message = needsReminder
      ? `📢 [NHẮC VIỆC CA TRỰC KHOA SINH HÓA · BVQY 103]\n📅 Ngày: ${today} · ${shift.label} (${shift.timeRange})\n\nCác hạng mục ca trực cần hoàn tất:\n${missingItems.join("\n")}\n\n👉 Kỹ thuật viên phụ trách vui lòng truy cập hệ thống để hoàn tất:\nhttps://sh103-lab.vercel.app/areas`
      : `✅ [KHOA SINH HÓA · BVQY 103]\nCa trực ${shift.label} ngày ${today} đã hoàn tất 100% nhiệm vụ (BM.06 đủ 20/20 máy, khử nhiễm đủ 5/5 khu vực).`;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: today,
      shift: {
        code: shift.code,
        label: shift.label,
        time: shift.timeRange,
      },
      needs_reminder: needsReminder,
      summary_message: message,
      progress: {
        bm06: {
          completed: recordedMachinesCount,
          total: totalMachines,
          percent: Math.round((recordedMachinesCount / totalMachines) * 100),
          is_complete: bm06Done,
        },
        decontamination: {
          completed: completedDecon,
          total: totalDecon,
          percent: Math.round((completedDecon / totalDecon) * 100),
          is_complete: deconDone,
        },
      },
      quick_action_url: "https://sh103-lab.vercel.app/areas",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
