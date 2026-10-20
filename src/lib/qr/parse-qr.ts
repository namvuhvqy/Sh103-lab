export interface ParsedQRResult {
  raw: string;
  assetId?: string;
  sourceOrder?: number;
  deviceCode?: string;
  isValid: boolean;
  error?: string;
}

export function parseQRCode(text: string): ParsedQRResult {
  const raw = (text || "").trim();
  if (!raw) {
    return { raw, isValid: false, error: "Mã QR trống" };
  }

  // 1. Try URL parsing
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) {
    try {
      const url = new URL(raw, "https://sh103-lab.local");
      let scanDev =
        url.searchParams.get("scanDev") ||
        url.searchParams.get("assetId") ||
        url.searchParams.get("asset_id") ||
        url.searchParams.get("dev");

      // Handle login redirect URL: /login?next=/areas?scanDev=...
      if (!scanDev && url.searchParams.has("next")) {
        const nextVal = url.searchParams.get("next") || "";
        try {
          const nextUrl = new URL(nextVal, "https://sh103-lab.local");
          scanDev =
            nextUrl.searchParams.get("scanDev") ||
            nextUrl.searchParams.get("assetId") ||
            nextUrl.searchParams.get("asset_id") ||
            nextUrl.searchParams.get("dev");
        } catch {
          // ignore nested url error
        }
      }

      if (scanDev) {
        return {
          raw,
          assetId: scanDev,
          isValid: true,
        };
      }
    } catch {
      // Not a valid standard URL, continue with regex checks
    }
  }

  // 2. Check if text contains scanDev= query fragment (raw or encoded)
  const scanDevMatch = raw.match(/(?:[?&]|%3F|%26)scanDev(?:=|%3D)([a-f0-9-]+)/i);
  if (scanDevMatch && scanDevMatch[1]) {
    return {
      raw,
      assetId: scanDevMatch[1],
      isValid: true,
    };
  }

  // 3. Raw UUID check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(raw)) {
    return {
      raw,
      assetId: raw,
      isValid: true,
    };
  }

  // 4. Device Code check (e.g. DEV_01, DEV_8, TB-07, TB07, M01) - strictly 20 active machines
  const devCodeMatch = raw.match(/^(?:DEV_?|TB-?|MÁY_?|MAY_?|M_?)0*(\d{1,2})$/i);
  if (devCodeMatch && devCodeMatch[1]) {
    const order = parseInt(devCodeMatch[1], 10);
    if (order >= 1 && order <= 20) {
      return {
        raw,
        sourceOrder: order,
        deviceCode: raw.toUpperCase(),
        isValid: true,
      };
    }
  }

  // 5. Plain Integer check (1 to 20)
  if (/^\d{1,2}$/.test(raw)) {
    const num = parseInt(raw, 10);
    if (num >= 1 && num <= 20) {
      return {
        raw,
        sourceOrder: num,
        isValid: true,
      };
    }
  }

  return {
    raw,
    isValid: false,
    error: "Mã QR không thuộc định dạng thiết bị của Khoa Sinh Hóa BV103",
  };
}
