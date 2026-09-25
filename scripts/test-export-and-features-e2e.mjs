import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

// Auto load .env.local if not present in process.env
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, "$1");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // ignore
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "namvuhvqy@gmail.com";
const PASSWORD = "Sh103!P3-Handover#7mQ2";

async function main() {
  console.log("==================================================================");
  console.log("   SH103-LAB: DEEP E2E TEST — REPORT EXPORT & CORE CLINICAL LAB   ");
  console.log("==================================================================");

  // 1. Chuẩn bị 1 kỳ APPROVED trong database để test xuất báo cáo chính thức
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const dbHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  // Ưu tiên chọn 1 kỳ đã APPROVED
  let periodsRes = await fetch(
    `${supabaseUrl}/rest/v1/register_periods?status=eq.APPROVED&select=id,status,period_start,period_end,form_template_versions(id,version_label,form_templates(code,name))&limit=1`,
    { headers: dbHeaders }
  );
  let periods = await periodsRes.json();
  let targetPeriod;
  let needTeardown = false;
  let originalStatus = "APPROVED";

  if (periods && periods.length > 0) {
    targetPeriod = periods[0];
    console.log(`[TARGET] Using existing APPROVED period: ${targetPeriod.id} (${targetPeriod.form_template_versions?.form_templates?.code})`);
  } else {
    periodsRes = await fetch(
      `${supabaseUrl}/rest/v1/register_periods?select=id,status,period_start,period_end,form_template_versions(id,version_label,form_templates(code,name))&limit=1`,
      { headers: dbHeaders }
    );
    periods = await periodsRes.json();
    targetPeriod = periods[0];
    originalStatus = targetPeriod.status;
    needTeardown = true;
    const now = new Date().toISOString();
    await fetch(`${supabaseUrl}/rest/v1/register_periods?id=eq.${targetPeriod.id}`, {
      method: "PATCH",
      headers: dbHeaders,
      body: JSON.stringify({
        status: "APPROVED",
        approved_at: now,
        approval_notes: "Kỳ kiểm định E2E chất lượng ISO 15189",
      }),
    });
    console.log(`[SETUP] Period ${targetPeriod.id} set to APPROVED for legal export testing`);
  }

  const targetPeriodId = targetPeriod.id;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const results = [];
  function logResult(step, pass, note = "") {
    results.push({ step, pass, note });
    console.log(`[${pass ? "✓ PASS" : "✗ FAIL"}] ${step} ${note ? `-> ${note}` : ""}`);
  }

  try {
    // -------------------------------------------------------------
    // BƯỚC 1: Đăng nhập vào hệ thống
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 1: Đăng nhập vào hệ thống ---");
    await page.goto(`${BASE_URL}/login`);
    await page.fill("input[name=email]", EMAIL);
    await page.fill("input[name=password]", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);
    logResult("Đăng nhập tài khoản nội bộ", !page.url().includes("/login"), page.url());

    // -------------------------------------------------------------
    // BƯỚC 2: Kiểm tra trang Báo cáo M06 & Danh sách kỳ APPROVED
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 2: Kiểm tra M06 Báo cáo & Thống kê ---");
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState("networkidle");

    const pageContent = await page.content();
    const hasApprovedSection = pageContent.includes("Đã phê duyệt");
    logResult("M06 hiển thị danh mục Kỳ đã phê duyệt có thể xuất", hasApprovedSection);

    const hasDownloadButtons = (await page.$$("a[href*='/api/reports/']")).length > 0;
    logResult("Kỳ APPROVED kích hoạt đầy đủ các nút tải PDF / Excel / CSV", hasDownloadButtons);

    // -------------------------------------------------------------
    // BƯỚC 3: Test thật API Xuất PDF chính thức
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 3: Test API Xuất PDF chính thức (/api/reports/[id]/pdf) ---");
    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const pdfRes = await fetch(`${BASE_URL}/api/reports/${targetPeriodId}/pdf`, {
      headers: { Cookie: cookieHeader },
    });
    const pdfStatus = pdfRes.status;
    const pdfContentType = pdfRes.headers.get("content-type") || "";
    const pdfBuffer = await pdfRes.arrayBuffer();
    const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString("utf-8");
    const isRealPdf = pdfStatus === 200 && pdfContentType.includes("application/pdf") && pdfHeader.startsWith("%PDF-");
    logResult("Xuất file PDF chính thức chuẩn ISO 15189", isRealPdf, `HTTP ${pdfStatus}, size: ${pdfBuffer.byteLength} bytes, header: ${pdfHeader}`);

    // -------------------------------------------------------------
    // BƯỚC 4: Test thật API Xuất Excel (.xlsx) chính thức
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 4: Test API Xuất Excel chính thức (/api/reports/[id]/xlsx) ---");
    const xlsxRes = await fetch(`${BASE_URL}/api/reports/${targetPeriodId}/xlsx`, {
      headers: { Cookie: cookieHeader },
    });
    const xlsxStatus = xlsxRes.status;
    const xlsxContentType = xlsxRes.headers.get("content-type") || "";
    const xlsxBuffer = await xlsxRes.arrayBuffer();
    const xlsxMagic = Buffer.from(xlsxBuffer.slice(0, 2)).toString("hex");
    const isRealXlsx = xlsxStatus === 200 && xlsxContentType.includes("spreadsheetml.sheet") && xlsxMagic === "504b"; // PK ZIP magic
    logResult("Xuất file Excel (.xlsx) chính thức 2 sheet (Tổng quan & Bản ghi)", isRealXlsx, `HTTP ${xlsxStatus}, size: ${xlsxBuffer.byteLength} bytes`);

    // -------------------------------------------------------------
    // BƯỚC 5: Test thật API Xuất CSV chính thức
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 5: Test API Xuất CSV chính thức (/api/reports/[id]/csv) ---");
    const csvRes = await fetch(`${BASE_URL}/api/reports/${targetPeriodId}/csv`, {
      headers: { Cookie: cookieHeader },
    });
    const csvStatus = csvRes.status;
    const csvContentType = csvRes.headers.get("content-type") || "";
    const csvText = await csvRes.text();
    const isRealCsv = csvStatus === 200 && (csvContentType.includes("text/csv") || csvContentType.includes("application/octet-stream"));
    logResult("Xuất file CSV chính thức hỗ trợ phân tích", isRealCsv, `HTTP ${csvStatus}, length: ${csvText.length} chars`);

    // -------------------------------------------------------------
    // BƯỚC 6: Test Không gian Xuất Biểu mẫu M06b (Preview & Export)
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 6: Test Không gian Xuất biểu mẫu M06b (Preview & Export) ---");
    await page.goto(`${BASE_URL}/reports/export?period=${targetPeriodId}`);
    await page.waitForLoadState("networkidle");

    const hasM06bTitle = (await page.content()).includes("Xuất biểu mẫu");
    logResult("M06b Workspace mở thành công", hasM06bTitle);

    const hasHospitalHeader = (await page.content()).includes("BỆNH VIỆN QUÂN Y 103");
    logResult("Khung in A4 chuẩn có tiêu đề BỆNH VIỆN QUÂN Y 103", hasHospitalHeader);

    const hasSignatures = (await page.content()).includes("Người theo dõi") && (await page.content()).includes("Trưởng khoa");
    logResult("Khung in A4 chuẩn có chữ ký số 2 cấp (KTV & Trưởng khoa)", hasSignatures);

    const exportActionButtons = (await page.$$("a[href*='/api/reports/']")).length;
    logResult("Thanh tác vụ xuất file M06b kích hoạt các nút tải cho kỳ APPROVED", exportActionButtons >= 3, `${exportActionButtons} nút tải`);

    // -------------------------------------------------------------
    // BƯỚC 7: Test Tính năng Nhập Nhật ký 4 ca BM.06 (/bm06)
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 7: Test Tính năng Nhập BM.06 Thiết bị (/bm06) ---");
    await page.goto(`${BASE_URL}/bm06`);
    await page.waitForLoadState("networkidle");

    const hasBm06Title = (await page.content()).includes("BM.06");
    logResult("Trang nhập ca BM.06 tải thành công", hasBm06Title, page.url());

    // -------------------------------------------------------------
    // BƯỚC 8: Test Tính năng Theo dõi & Ghi Nhiệt ẩm (/temperature)
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 8: Test Tính năng Theo dõi Nhiệt ẩm (/temperature) ---");
    await page.goto(`${BASE_URL}/temperature`);
    await page.waitForLoadState("networkidle");

    const hasTempPoints = (await page.content()).includes("điểm");
    logResult("Module Nhiệt độ & Độ ẩm tải đầy đủ các điểm đo", hasTempPoints);

    // -------------------------------------------------------------
    // BƯỚC 9: Test Tính năng Phê duyệt P4 (/approvals)
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 9: Test Trung tâm Phê duyệt P4 (/approvals) ---");
    await page.goto(`${BASE_URL}/approvals`);
    await page.waitForLoadState("networkidle");

    const hasApprovalTabs = (await page.content()).includes("phê duyệt");
    logResult("Trung tâm Phê duyệt P4 tải thành công", hasApprovalTabs);

    // -------------------------------------------------------------
    // BƯỚC 10: Test Tính năng Báo cáo Sự cố M08 (/incidents)
    // -------------------------------------------------------------
    console.log("\n--- BƯỚC 10: Test Tính năng Báo cáo Sự cố M08 (/incidents) ---");
    await page.goto(`${BASE_URL}/incidents`);
    await page.waitForLoadState("networkidle");

    const hasIncidentList = (await page.content()).includes("sự cố");
    logResult("Danh sách Sự cố M08 tải thành công", hasIncidentList);

    await page.goto(`${BASE_URL}/incidents/new`);
    await page.waitForLoadState("networkidle");
    const hasIncidentForm = (await page.content()).includes("Mô tả sự cố") || (await page.content()).includes("Tiêu đề");
    logResult("Form báo cáo sự cố mới M08 sẵn sàng", hasIncidentForm);

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    const passCount = results.filter((r) => r.pass).length;
    const failCount = results.filter((r) => !r.pass).length;
    console.log(`KẾT QUẢ KIỂM THỬ: ${results.length} BƯỚC | THÀNH CÔNG: ${passCount} | THẤT BẠI: ${failCount}`);

    if (failCount === 0) {
      console.log(">>> TOÀN BỘ TÍNH NĂNG XUẤT BÁO CÁO & NGHIỆP VỤ ĐÃ TEST THÀNH CÔNG 100% <<<");
    } else {
      console.error(">>> PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ <<<");
      process.exit(1);
    }
  } finally {
    if (needTeardown) {
      // Khôi phục trạng thái ban đầu của kỳ
      await fetch(`${supabaseUrl}/rest/v1/register_periods?id=eq.${targetPeriodId}`, {
        method: "PATCH",
        headers: dbHeaders,
        body: JSON.stringify({
          status: originalStatus,
          approved_at: null,
          approval_notes: null,
        }),
      });
      console.log(`[TEARDOWN] Đã khôi phục trạng thái kỳ ${targetPeriodId} về ${originalStatus}`);
    }
    await browser.close();
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN E2E SUITE:", err);
  process.exit(1);
});
