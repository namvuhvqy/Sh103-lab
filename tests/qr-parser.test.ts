import { describe, it, expect } from "vitest";
import { parseQRCode } from "@/lib/qr/parse-qr";

describe("parseQRCode Unit Tests", () => {
  it("Requirement 5: parses existing stickers generated on production and preview", () => {
    // 1. Existing production stickers printed in lab
    const prodUrl = "https://sh103-lab.vercel.app/areas?scanDev=a2ededd1-1347-59e7-99ef-55750f167da1";
    const resProd = parseQRCode(prodUrl);
    expect(resProd.isValid).toBe(true);
    expect(resProd.assetId).toBe("a2ededd1-1347-59e7-99ef-55750f167da1");

    // 2. Feature branch 9 Preview URL
    const previewUrl = "https://sh103-lab-git-9-namvuhvqys-projects.vercel.app/areas?scanDev=6beb57e2-dc98-5264-abd0-c44619ed044f";
    const resPreview = parseQRCode(previewUrl);
    expect(resPreview.isValid).toBe(true);
    expect(resPreview.assetId).toBe("6beb57e2-dc98-5264-abd0-c44619ed044f");

    // 3. Localhost URL
    const localUrl = "http://localhost:3000/areas?scanDev=70d4101c-16b2-5103-95aa-786ec2db52dc";
    const resLocal = parseQRCode(localUrl);
    expect(resLocal.isValid).toBe(true);
    expect(resLocal.assetId).toBe("70d4101c-16b2-5103-95aa-786ec2db52dc");
  });

  it("parses relative URL with scanDev parameter", () => {
    const url = "/areas?area=SINH_HOA&scanDev=6beb57e2-dc98-5264-abd0-c44619ed044f";
    const res = parseQRCode(url);
    expect(res.isValid).toBe(true);
    expect(res.assetId).toBe("6beb57e2-dc98-5264-abd0-c44619ed044f");
  });

  it("parses equipment page URL with scanDev parameter", () => {
    const url = "https://sh103-lab.vercel.app/equipment?scanDev=6beb57e2-dc98-5264-abd0-c44619ed044f";
    const res = parseQRCode(url);
    expect(res.isValid).toBe(true);
    expect(res.assetId).toBe("6beb57e2-dc98-5264-abd0-c44619ed044f");
  });

  it("parses login redirect URLs preserving scanDev (?next=...)", () => {
    const encodedNext = "/login?next=%2Fareas%3FscanDev%3Da2ededd1-1347-59e7-99ef-55750f167da1";
    const res = parseQRCode(encodedNext);
    expect(res.isValid).toBe(true);
    expect(res.assetId).toBe("a2ededd1-1347-59e7-99ef-55750f167da1");
  });

  it("parses raw UUID", () => {
    const rawUuid = "70d4101c-16b2-5103-95aa-786ec2db52dc";
    const res = parseQRCode(rawUuid);
    expect(res.isValid).toBe(true);
    expect(res.assetId).toBe("70d4101c-16b2-5103-95aa-786ec2db52dc");
  });

  it("parses device code like DEV_01, DEV_8, TB-07, TB15", () => {
    const r1 = parseQRCode("DEV_01");
    expect(r1.isValid).toBe(true);
    expect(r1.sourceOrder).toBe(1);

    const r2 = parseQRCode("DEV_8");
    expect(r2.isValid).toBe(true);
    expect(r2.sourceOrder).toBe(8);

    const r3 = parseQRCode("TB-07");
    expect(r3.isValid).toBe(true);
    expect(r3.sourceOrder).toBe(7);

    const r4 = parseQRCode("TB15");
    expect(r4.isValid).toBe(true);
    expect(r4.sourceOrder).toBe(15);
  });

  it("parses plain number 1 to 20", () => {
    const res = parseQRCode("14");
    expect(res.isValid).toBe(true);
    expect(res.sourceOrder).toBe(14);
  });

  it("Requirement 5: rejects invalid text, out-of-range machines, or unrelated QR strings", () => {
    // Unrelated URL
    const res = parseQRCode("https://google.com/search?q=hospital");
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();

    // Out of range machine numbers (> 20)
    const resOutOfRange = parseQRCode("DEV_25");
    expect(resOutOfRange.isValid).toBe(false);

    const resNumberOutOfRange = parseQRCode("99");
    expect(resNumberOutOfRange.isValid).toBe(false);

    // Random non-code text
    const res2 = parseQRCode("RANDOM_TEXT_12345");
    expect(res2.isValid).toBe(false);

    // Empty string
    const res3 = parseQRCode("");
    expect(res3.isValid).toBe(false);
  });
});
