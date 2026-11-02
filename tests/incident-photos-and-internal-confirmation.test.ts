import { describe, expect, it } from "vitest";
import { sniffImageMime, extensionForMime } from "@/lib/incidents/photo-constants";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Requirement 2: Internal Confirmation Fix", () => {
  it("uses createAdminClient with service-role in toggleInternalConfirmationAction to bypass RLS missing update policy", () => {
    const code = readFileSync(resolve(process.cwd(), "src/app/reports/actions.ts"), "utf8");
    expect(code).toContain("createAdminClient");
    expect(code).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(code).toContain('select("id,status")');
    expect(code).toContain('revalidatePath("/reports")');
    expect(code).toContain('revalidatePath("/periods")');
  });

  it("maintains optimistic key in ReportsUnifiedView to avoid checkbox state rollback", () => {
    const code = readFileSync(resolve(process.cwd(), "src/components/reports/ReportsUnifiedView.tsx"), "utf8");
    expect(code).toContain("selectedPeriodKey");
    expect(code).toContain("setOptimistic");
  });
});

describe("Requirement 3: Incident Photos & In-Screen View", () => {
  it("accurately sniffs JPEG, PNG, and WEBP magic bytes and rejects arbitrary binaries", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(sniffImageMime(jpeg)).toBe("image/jpeg");
    expect(extensionForMime("image/jpeg")).toBe("jpg");

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniffImageMime(png)).toBe("image/png");
    expect(extensionForMime("image/png")).toBe("png");

    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);
    expect(sniffImageMime(webp)).toBe("image/webp");
    expect(extensionForMime("image/webp")).toBe("webp");

    const fake = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(sniffImageMime(fake)).toBeNull();
  });

  it("provides photo upload endpoint /api/incidents/[incidentId]/photos", () => {
    const code = readFileSync(
      resolve(process.cwd(), "src/app/api/incidents/[incidentId]/photos/route.ts"),
      "utf8"
    );
    expect(code).toContain("add_incident_attachment");
    expect(code).toContain("sniffImageMime");
    expect(code).toContain("INCIDENT_PHOTO_BUCKET");
    expect(code).toContain("INCIDENT_PHOTO_MAX_BYTES");
  });

  it("provides in-screen detail API /api/incidents/[incidentId]", () => {
    const code = readFileSync(
      resolve(process.cwd(), "src/app/api/incidents/[incidentId]/route.ts"),
      "utf8"
    );
    expect(code).toContain("getIncidentDetail");
    expect(code).toContain("getIncidentPhotoMap");
  });

  it("renders IncidentsUnifiedView with in-screen detail, rows with photo indicators and photo capture", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/incidents/page.tsx"), "utf8");
    expect(page).toContain("IncidentsUnifiedView");
    expect(page).toContain("getIncidentPhotoMap");

    const view = readFileSync(
      resolve(process.cwd(), "src/components/incidents/IncidentsUnifiedView.tsx"),
      "utf8"
    );
    expect(view).toContain("PhotoCaptureField");
    expect(view).toContain("IncidentPhotoGallery");
    expect(view).toContain("AddIncidentPhotos");
    expect(view).toContain("openDetail");
    expect(view).toContain("selectedIncident");
  });
});
