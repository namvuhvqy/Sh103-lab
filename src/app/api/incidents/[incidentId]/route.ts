import { createClient } from "@/lib/supabase/server";
import { getIncidentDetail } from "@/lib/p5/queries";
import { getIncidentPhotoMap } from "@/lib/incidents/photos";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const { incidentId } = await params;
  if (!UUID_RE.test(incidentId)) {
    return Response.json({ error: "Mã sự cố không hợp lệ" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  try {
    const detail = await getIncidentDetail(incidentId);
    if (!detail) {
      return Response.json({ error: "Không tìm thấy sự cố" }, { status: 404 });
    }

    const photoMap = await getIncidentPhotoMap([incidentId]);
    const photos = photoMap[incidentId] ?? [];

    return Response.json({
      incident: detail.incident,
      events: detail.events,
      photos,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tải chi tiết sự cố";
    return Response.json({ error: message }, { status: 500 });
  }
}
