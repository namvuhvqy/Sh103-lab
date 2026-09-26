import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, getUser, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { POST } from "@/app/api/measurements/quick-save/route";

const request = (body: unknown) => new Request("https://example.test/api/measurements/quick-save", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({ auth: { getUser }, rpc });
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  rpc.mockResolvedValue({ data: "record-1", error: null });
});

describe("POST /api/measurements/quick-save", () => {
  it("rejects unauthenticated requests", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request({ occurrenceId: "occ-1", temperature: 4.5 }));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid numeric input", async () => {
    const response = await POST(request({ occurrenceId: "occ-1", temperature: "not-a-number" }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the scoped RPC rejects the write", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "scope denied" } });
    const response = await POST(request({ occurrenceId: "occ-1", temperature: 4.5 }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false });
  });

  it("maps missing required measurement values to a client error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "Required measurement values missing" } });
    const response = await POST(request({ occurrenceId: "occ-1", temperature: 24, humidity: null }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: "Thiếu giá trị đo bắt buộc" });
  });

  it("writes through save_measurement_record and returns threshold state", async () => {
    const response = await POST(request({ occurrenceId: "occ-1", temperature: 9.5, humidity: null }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("save_measurement_record", expect.objectContaining({
      target_occurrence_id: "occ-1",
      target_temperature: 9.5,
      target_humidity: null,
    }));
    expect(await response.json()).toMatchObject({ success: true, recordId: "record-1", temperature: 9.5 });
  });
});
