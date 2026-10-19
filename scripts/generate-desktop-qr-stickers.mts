import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

let envContent = "";
try {
  envContent = fs.readFileSync(".env.local", "utf8");
} catch (e) {}

const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[key] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey);

interface MachineItem {
  stt: number;
  id: string;
  name: string;
  areaCode: string;
  areaName: string;
  qrUrl: string;
  qrDataUrl: string;
}

async function generate() {
  console.log("=== BẮT ĐẦU TẠO FILE IN TEM QR 20 THIẾT BỊ TRÊN DESKTOP ===");
  
  // 1. Fetch BM.06 active version & 20 assets
  const { data: version } = await supabase
    .from("form_template_versions")
    .select("id,form_templates!inner(code)")
    .eq("status", "PUBLISHED")
    .eq("form_templates.code", "BM.06/QL.TRTB.01")
    .single();

  const { data: rows } = await supabase
    .from("form_version_assets")
    .select("display_order,asset_id,assets!inner(source_name,active,location_id,locations!inner(code, name))")
    .eq("form_version_id", version?.id)
    .eq("active", true)
    .eq("assets.active", true)
    .order("display_order");

  if (!rows || rows.length === 0) {
    console.error("Không tìm thấy danh sách máy!");
    return;
  }

  const machines: MachineItem[] = [];
  const prodBase = "https://sh103-lab.vercel.app";

  for (let i = 0; i < rows.length; i++) {
    const r: any = rows[i];
    const assetId = r.asset_id;
    const name = r.assets?.source_name;
    const areaCode = r.assets?.locations?.code;
    const areaName = r.assets?.locations?.name;
    const qrUrl = `${prodBase}/areas?scanDev=${assetId}`;
    
    // Generate high resolution QR code data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    machines.push({
      stt: i + 1,
      id: assetId,
      name,
      areaCode,
      areaName,
      qrUrl,
      qrDataUrl,
    });
  }

  console.log(`Đã sinh mã QR chất lượng cao cho ${machines.length} thiết bị.`);

  // 2. Build Print-Ready HTML Document
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>TEM DÁN QR CODE 20 THIẾT BỊ · KHOA SINH HÓA BVQY 103</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: #f1f5f9;
      color: #0f172a;
      padding: 16px;
    }
    .no-print-bar {
      max-width: 900px;
      margin: 0 auto 20px auto;
      background: #042f2e;
      color: #fff;
      padding: 16px 20px;
      border-radius: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .no-print-bar h1 {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .no-print-bar p {
      font-size: 12px;
      color: #99f6e4;
      margin-top: 4px;
    }
    .btn-print {
      background: #0d9488;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      padding: 10px 20px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #0f766e;
    }
    .grid-container {
      max-width: 900px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .sticker-card {
      background: #ffffff;
      border: 1.5px dashed #94a3b8;
      border-radius: 12px;
      padding: 12px 14px;
      position: relative;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 235px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .sticker-header {
      border-bottom: 1.5px solid #0f766e;
      padding-bottom: 6px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-titles {
      flex: 1;
      min-width: 0;
    }
    .header-hosp {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #047857;
    }
    .header-dept {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
    }
    .badge-iso {
      background: #0f766e;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .sticker-body {
      display: flex;
      gap: 10px;
      align-items: center;
      flex: 1;
    }
    .qr-box {
      width: 100px;
      height: 100px;
      flex-shrink: 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .info-box {
      flex: 1;
      min-width: 0;
    }
    .info-order {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .machine-name {
      font-size: 12.5px;
      font-weight: 900;
      line-height: 1.3;
      color: #0f172a;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .area-tag {
      margin-top: 6px;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
    }
    .sticker-footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
    }
    .scan-guide {
      font-weight: 700;
      color: #0f766e;
    }
    .dev-id {
      font-family: monospace;
      font-size: 8px;
      color: #94a3b8;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print-bar {
        display: none !important;
      }
      .grid-container {
        max-width: 100%;
        gap: 8mm;
      }
      .sticker-card {
        border: 1px dashed #64748b;
        box-shadow: none;
        height: 52mm;
      }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <div>
      <h1>Bộ 20 Tem Dán QR Code Thiết Bị Xét Nghiệm · ISO 15189</h1>
      <p>Khoa Sinh Hóa · Bệnh viện Quân y 103 (Khổ A4 tiêu chuẩn - Sắp xếp 2 cột x 5 hàng vừa vặn để in và cắt dán lên máy)</p>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ IN TOÀN BỘ 20 TEM DÁN
    </button>
  </div>

  <div class="grid-container">
    ${machines.map((m) => `
      <div class="sticker-card">
        <div class="sticker-header">
          <div class="header-titles">
            <div class="header-hosp">BV QUÂN Y 103 · KHOA SINH HÓA</div>
            <div class="header-dept">TEM NHẬN DIỆN THIẾT BỊ Y TẾ</div>
          </div>
          <span class="badge-iso">ISO 15189</span>
        </div>

        <div class="sticker-body">
          <div class="qr-box">
            <img src="${m.qrDataUrl}" alt="QR ${m.name}">
          </div>
          <div class="info-box">
            <span class="info-order">MÁY SỐ #${m.stt < 10 ? '0' + m.stt : m.stt}</span>
            <div class="machine-name" title="${m.name}">${m.name}</div>
            <div class="area-tag">📍 ${m.areaName}</div>
          </div>
        </div>

        <div class="sticker-footer">
          <span class="scan-guide">📱 Quét QR để: Ghi nhận BM.06 &amp; Bảo dưỡng</span>
          <span class="dev-id">${m.id.slice(0, 8)}</span>
        </div>
      </div>
    `).join("")}
  </div>

</body>
</html>`;

  // Write to Desktop
  const desktopPath = "/mnt/c/Users/Admin/Desktop/TEM_QR_CODE_20_THIET_BI_KHOA_SINH_HOA_BV103.html";
  fs.writeFileSync(desktopPath, html, "utf8");
  console.log(`\n ĐÃ TẠO FILE THÀNH CÔNG TẠI: ${desktopPath}`);
  console.log(`Đường dẫn Windows: C:\\Users\\Admin\\Desktop\\TEM_QR_CODE_20_THIET_BI_KHOA_SINH_HOA_BV103.html`);
}

generate();
