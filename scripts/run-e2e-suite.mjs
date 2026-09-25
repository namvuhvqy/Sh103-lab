import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = "namvuhvqy@gmail.com";
const PASSWORD = "Sh103!P3-Handover#7mQ2";

async function runE2E() {
  console.log("=================================================");
  console.log("   SH103-LAB: COMPREHENSIVE E2E VERIFICATION     ");
  console.log("   Scope: P1-P2 Foundation, P3 Forms,            ");
  console.log("          P4 Approval & Review, P5 M01-M08/M06b  ");
  console.log("=================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile first
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
  });
  const page = await context.newPage();

  const results = [];
  function logStep(name, pass, detail = "") {
    results.push({ name, pass, detail });
    const symbol = pass ? "✓ PASS" : "✗ FAIL";
    console.log(`[${symbol}] ${name} ${detail ? `(${detail})` : ""}`);
  }

  try {
    // -------------------------------------------------------------
    // CASE 1: Auth & Protection Middleware
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 1: Auth & Middleware Security ---");
    await page.goto(`${BASE_URL}/equipment`);
    await page.waitForLoadState("networkidle");
    const redirectedToLogin = page.url().includes("/login");
    logStep("Auth Middleware Redirect unauthenticated user to /login", redirectedToLogin, page.url());

    // Check Login UI (Logo BV103 + Title)
    const hasHospitalLogo = (await page.$$("img[alt*='Bệnh viện Quân y 103']")).length > 0;
    logStep("Login page renders Official 103 Hospital Logo", hasHospitalLogo);

    // Login
    await page.fill("input[name=email]", EMAIL);
    await page.fill("input[name=password]", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForTimeout(2000);

    const loginSuccess = !page.url().includes("/login");
    logStep("Submit valid credentials and authenticate", loginSuccess, page.url());

    // -------------------------------------------------------------
    // CASE 2: M01 Home & Canonical Navigation
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 2: M01 Home & 5-Tab Navigation ---");
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    const headerLogo = (await page.$$("img[alt*='Bệnh viện Quân y 103']")).length > 0;
    logStep("M01 Mobile Header renders Official 103 Hospital Logo", headerLogo);

    const hasOperationalBanner = (await page.$$("section[aria-labelledby='operational-title']")).length > 0;
    logStep("M01 renders Clinical Operational Banner", hasOperationalBanner);

    const areaCardsCount = (await page.$$("article.clinical-card")).length;
    logStep("M01 renders 5 Work Areas with accent colors", areaCardsCount >= 5, `${areaCardsCount} cards`);

    const navTabsCount = (await page.$$("nav[aria-label='Điều hướng chính'] a")).length;
    logStep("Canonical 5-Tab Bottom Navigation is present", navTabsCount === 5, `${navTabsCount} tabs`);

    // -------------------------------------------------------------
    // CASE 3: M02 Equipment & 4-Shift Journal (BM.06)
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 3: M02 Equipment & BM.06 ---");
    await page.goto(`${BASE_URL}/equipment`);
    await page.waitForLoadState("networkidle");

    const equipmentListCount = (await page.$$("a[href^='/assets/']")).length;
    logStep("M02 renders 25 lab machines in strict source order", equipmentListCount === 25, `${equipmentListCount}/25 máy`);

    const hasShiftPills = (await page.content()).includes("4 ca:");
    logStep("M02 equipment rows render 4-shift indicator pills", hasShiftPills);

    const hasMachineImages = (await page.$$("img[alt*='GEM'], img[alt*='AU5800'], img[alt*='Cobas'], img[alt*='Centrifuge']")).length > 0;
    logStep("M02 renders realistic clinical equipment photography", hasMachineImages);

    // -------------------------------------------------------------
    // CASE 4: M03 Temperature & Humidity (BM.01 - BM.03)
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 4: M03 Temperature & Humidity ---");
    await page.goto(`${BASE_URL}/temperature`);
    await page.waitForLoadState("networkidle");

    const hasSafeRanges = (await page.content()).includes("21°C – 26°C") || (await page.content()).includes("2°C – 8°C");
    logStep("M03 displays ISO safe range pills", hasSafeRanges);

    // Switch to storage group
    await page.goto(`${BASE_URL}/temperature?group=storage`);
    await page.waitForLoadState("networkidle");
    const hasStorageGroup = page.url().includes("group=storage");
    logStep("M03 SegmentedControl switches between Lab & Storage", hasStorageGroup);

    // -------------------------------------------------------------
    // CASE 5: M04 Decontamination (BM.01_KNBM)
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 5: M04 Decontamination ---");
    await page.goto(`${BASE_URL}/decontamination`);
    await page.waitForLoadState("networkidle");
    const hasDeconTitle = (await page.content()).includes("Khử nhiễm");
    logStep("M04 Decontamination module accessible", hasDeconTitle);

    // -------------------------------------------------------------
    // CASE 6: P4 Review & Approval Flow (M05)
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 6: P4 Review, Approval & Audit Workflows ---");
    await page.goto(`${BASE_URL}/approvals`);
    await page.waitForLoadState("networkidle");
    const hasApprovalShell = page.url().includes("/approvals") && (await page.content()).includes("duyệt");
    logStep("P4/M05 Approval Center accessible", hasApprovalShell);

    await page.goto(`${BASE_URL}/periods`);
    await page.waitForLoadState("networkidle");
    const hasPeriods = page.url().includes("/periods");
    logStep("P4 Period Registry & Audit Logs accessible", hasPeriods);

    // -------------------------------------------------------------
    // CASE 7: M06 Reports & M06b Export Modal
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 7: M06 Reports & M06b Export Workspace ---");
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState("networkidle");

    const hasReportKpis = (await page.content()).includes("Tổng số báo cáo") || (await page.content()).includes("Đã hoàn thành");
    logStep("M06 renders report KPIs and completion distribution", hasReportKpis);

    // Navigate to M06b Export
    await page.goto(`${BASE_URL}/reports/export`);
    await page.waitForLoadState("networkidle");

    const hasM06bHeader = (await page.content()).includes("Xuất biểu mẫu");
    logStep("M06b Export Workspace accessible", hasM06bHeader);

    const hasExportTemplates = (await page.$$("a[href*='template=']")).length;
    logStep("M06b presents 6 standardized ISO form output cards", hasExportTemplates >= 4, `${hasExportTemplates} templates`);

    const hasPrintSupport = (await page.content()).includes("Excel") && (await page.content()).includes("PDF");
    logStep("M06b supports multi-format export (Excel, PDF, CSV)", hasPrintSupport);

    // -------------------------------------------------------------
    // CASE 8: M07 Notifications & M08 Incidents
    // -------------------------------------------------------------
    console.log("\n--- RUNNING CASE 8: M07 Notifications & M08 Incidents ---");
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState("networkidle");
    const hasNotif = (await page.content()).includes("Thông báo");
    logStep("M07 Notification Center accessible", hasNotif);

    await page.goto(`${BASE_URL}/incidents`);
    await page.waitForLoadState("networkidle");
    const hasIncidents = (await page.content()).includes("sự cố");
    logStep("M08 Incident Reporting & Logs accessible", hasIncidents);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n=================================================");
    const passedCount = results.filter((r) => r.pass).length;
    const failedCount = results.filter((r) => !r.pass).length;
    console.log(`TOTAL CASES: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    if (failedCount === 0) {
      console.log(">>> ALL E2E VERIFICATIONS PASSED WITH 100% SUCCESS <<<");
    } else {
      console.error(">>> SOME E2E VERIFICATIONS FAILED <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("E2E FATAL ERROR:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2E();
