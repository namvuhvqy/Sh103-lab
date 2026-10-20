import { NextResponse } from "next/server";
import { getBm06ByDateShift } from "@/lib/forms/context";
import { currentShift, vietnamParts } from "@/lib/forms/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = vietnamParts(new Date()).date;
    const shift = currentShift();
    const bm06Data = await getBm06ByDateShift(today, shift.code);

    const machines = (bm06Data?.assets ?? []).map((a) => ({
      id: a.id,
      sourceOrder: a.sourceOrder,
      name: a.name,
      locationCode: a.locationCode,
    }));

    return NextResponse.json({
      success: true,
      today,
      shift: shift.code,
      machines,
    });
  } catch (error: any) {
    console.error("GET /api/equipment/active error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Không thể tải danh sách thiết bị" },
      { status: 500 }
    );
  }
}
