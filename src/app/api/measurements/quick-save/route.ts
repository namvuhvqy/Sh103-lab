import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const finiteNumberOrNull = (value: unknown): number | null | undefined => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const occurrenceId = typeof body.occurrenceId === "string" ? body.occurrenceId.trim() : "";
    const temperature = finiteNumberOrNull(body.temperature);
    const humidity = finiteNumberOrNull(body.humidity);
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 1000) : null;

    if (!occurrenceId) {
      return NextResponse.json({ success: false, error: "Thiếu occurrenceId" }, { status: 400 });
    }
    if (temperature === undefined || humidity === undefined) {
      return NextResponse.json({ success: false, error: "Giá trị đo không hợp lệ" }, { status: 400 });
    }
    if (temperature === null) {
      return NextResponse.json({ success: false, error: "Nhiệt độ là bắt buộc" }, { status: 400 });
    }
    if (temperature < -100 || temperature > 100 || (humidity !== null && (humidity < 0 || humidity > 100))) {
      return NextResponse.json({ success: false, error: "Giá trị đo ngoài miền hợp lệ" }, { status: 400 });
    }

    const { data: recordId, error } = await supabase.rpc("save_measurement_record", {
      target_occurrence_id: occurrenceId,
      target_performed_at: new Date().toISOString(),
      target_temperature: temperature,
      target_humidity: humidity,
      target_note: note,
      target_is_na: false,
      target_na_reason: null,
    });

    if (error || !recordId) {
      const message = error?.message ?? "Không thể lưu số đo";
      const denied = /scope denied|authentication required|permission denied/i.test(message);
      const conflict = /already fulfilled|not writable/i.test(message);
      const invalid = /required measurement values missing|not a measurement form/i.test(message);
      return NextResponse.json(
        { success: false, error: denied ? "Không có quyền ghi số đo" : conflict ? "Điểm đo đã được ghi" : invalid ? "Thiếu giá trị đo bắt buộc" : "Không thể lưu số đo" },
        { status: denied ? 403 : conflict ? 409 : invalid ? 400 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      occurrenceId,
      recordId,
      temperature,
      humidity,
    });
  } catch (error) {
    const malformedRequest = error instanceof SyntaxError;
    return NextResponse.json(
      { success: false, error: malformedRequest ? "Dữ liệu gửi lên không hợp lệ" : "Không thể lưu số đo" },
      { status: malformedRequest ? 400 : 500 },
    );
  }
}
