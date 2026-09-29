import { chromium } from "@playwright/test";
import ExcelJS from "exceljs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

if (!EMAIL || !PASSWORD) throw new Error("E2E_EMAIL and E2E_PASSWORD are required");

const FORMS = [
  "BM.01/QL.HTAT.01",
  "BM.02/QL.HTAT.01",
  "BM.03/QL.HTAT.01",
  "BM.01_KNBM",
  "BM.02/QL.TRTB.01",
  "BM.06/QL.TRTB.01",
];
const VIEWPORTS = [320, 390, 430];

function resultLine(pass, name, detail = "") {
  const symbol = pass ? "✓ PASS" : "✗ FAIL";
  console.log(`[${symbol}] ${name}${detail ? ` (${detail})` : ""}`);
  return { pass, name, detail };
}

async function gotoStable(page, url) {
  await page.goto(url, { waitUntil: "commit", timeout: 45000 }).catch((error) => {
    if (!String(error?.message ?? error).includes("ERR_ABORTED")) throw error;
  });
  await page.waitForTimeout(2500);
}

async function runE2E() {
  console.log("=================================================");
  console.log("   SH103-LAB: XLSX-ONLY PREVIEW/EXPORT E2E      ");
  console.log("=================================================");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const results = [];
  const httpFailures = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("_rsc=")) httpFailures.push(`${response.status()} ${response.url()}`);
  });

  try {
    console.log("\n--- CASE 1: Public Preview + Auth ---");
    await gotoStable(page, `${BASE_URL}/equipment`);
    results.push(resultLine(page.url().includes("/login"), "Unauthenticated protected route redirects to SH103 login", page.url()));
    results.push(resultLine((await page.locator("body").innerText()).includes("Đăng nhập"), "Login page renders"));

    await page.fill("input[name=email]", EMAIL);
    await page.fill("input[name=password]", PASSWORD);
    await page.click("button[type=submit]");
    await page.waitForURL("**/", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const authCookie = (await context.cookies()).some((cookie) => cookie.name.includes("auth-token"));
    results.push(resultLine(authCookie && !page.url().includes("/login"), "Submit valid credentials and authenticate", page.url()));

    console.log("\n--- CASE 2: Core authenticated pages ---");
    for (const [path, text] of [["/", "Khoa Sinh hóa"], ["/equipment", "Thiết bị"], ["/temperature", "Nhiệt"], ["/decontamination", "Khử"], ["/approvals", "Theo dõi biểu mẫu"], ["/reports", "Báo cáo"]]) {
      await gotoStable(page, `${BASE_URL}${path}`);
      const body = await page.locator("body").innerText();
      results.push(resultLine(!page.url().includes("/login") && body.includes(text), `Authenticated page ${path} accessible`));
    }

    console.log("\n--- CASE 3: XLSX-only export workspace on mobile ---");
    for (const form of FORMS) {
      for (const width of VIEWPORTS) {
        await page.setViewportSize({ width, height: 900 });
        await gotoStable(page, `${BASE_URL}/reports/export?template=${encodeURIComponent(form)}`);
        const body = await page.locator("body").innerText({ timeout: 30000 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        const xlsxOnly = body.includes("Tải Excel (.xlsx)") && !body.includes("CSV") && !body.includes("PDF") && !body.includes("In phiếu") && !body.includes("Print");
        const bm06Nav = form.includes("BM.06") ? /Trang trước[\s\S]*Trang \d+ \/ \d+[\s\S]*Trang sau/.test(body) : true;
        results.push(resultLine(!overflow && xlsxOnly && bm06Nav, `${form} mobile ${width}px Preview`, `overflow=${overflow}`));
      }

      await page.setViewportSize({ width: 390, height: 900 });
      await gotoStable(page, `${BASE_URL}/reports/export?template=${encodeURIComponent(form)}`);
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Tải Excel \(\.xlsx\)/i }).click()]);
      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheets = workbook.worksheets.map((sheet) => sheet.name);
      const badStatus = workbook.worksheets.some((sheet) => sheet.getSheetValues().flat().some((value) => String(value ?? "").includes("CHÍNH THỨC") || String(value ?? "").includes("ĐÃ PHÊ DUYỆT ĐIỆN TỬ")));
      const bm06Template = form.includes("BM.06") ? sheets.slice(0, 3).join(",") === "Trang 1,Trang 2,Trang 3" : true;
      results.push(resultLine(isZip && !badStatus && bm06Template, `${form} XLSX download parse/fidelity`, sheets.join(",")));
    }

    results.push(resultLine(httpFailures.length === 0, "No HTTP >=400 during E2E", httpFailures.slice(0, 5).join("; ")));

    console.log("\n=================================================");
    const passedCount = results.filter((r) => r.pass).length;
    const failedCount = results.length - passedCount;
    console.log(`TOTAL CASES: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    if (failedCount > 0) process.exit(1);
    console.log(">>> ALL E2E VERIFICATIONS PASSED WITH 100% SUCCESS <<<");
  } catch (err) {
    console.error("E2E FATAL ERROR:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2E();
