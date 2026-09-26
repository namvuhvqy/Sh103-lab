const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const OUT_DIR = "/root/SH103-Lab/public/templates";
const ASSETS_DIR = "/root/SH103-Lab/assets/templates";

const MACHINES_25 = [
  "1. Máy XN Khí Máu GEM Premier 3000",
  "2. Máy Primier Hb 9210 -M1",
  "3. Máy XN nước tiểu LabUMat 2- M1",
  "4. Máy Miễn dịch Cobas E602",
  "5. Máy Primier Hb 9210- M2",
  "6. Máy Primier Hb 9210- M1",
  "7. Máy XN SH - MD tự động ARCHITECT-2",
  "8. Máy nước tiểu ureader Plus 2 - M1",
  "9. Máy xét nghiệm khí máu Geem 3500",
  "10. Máy nước tiểu ureader Plus 2 - M2",
  "11. Hệ thống Automation Máy XN sinh hóa AU5800-M4-5",
  "12. Hệ thống Automation Máy XN sinh hóa AU5800-M6",
  "13. Hệ thống Automation Máy XN MD DXI-M3",
  "14. Hệ thống Automation Máy XN MD DXI-M4",
  "15. Máy xét nghiệm Miễn dịch Maglumi X3",
  "16. Máy xét nghiệm nước tiểu LabUmat 2-M2",
  "17. Máy xét nghiệm HbA1C-HLC-723G11 (Tosoh)",
  "18. Máy XN SH-MD Anility",
  "19. Máy xét nghiệm khí máu Geem 3500",
  "20. Máy lắc VORTEX",
  "21. Máy li tâm 24 lỗ lạnh UNIVERSAL 320R",
  "22. Máy li tâm 68 lỗ ROTOFIX 32A",
  "23. Máy lắc ngang",
  "24. Máy li tâm Ependox-M1",
  "25. Máy li tâm Ependox-M2",
];

const TEMPERATURE_AREAS_5 = [
  { code: "NUOC_TIEU", name: "Khu vực Nước tiểu" },
  { code: "SINH_HOA", name: "Khu vực Sinh hóa" },
  { code: "MIEN_DICH", name: "Khu vực Miễn dịch" },
  { code: "AUTOMATION", name: "Hệ Automation" },
  { code: "LOC_NUOC_RO", name: "Lọc nước RO" },
];

function saveWorkbook(filename, wb) {
  for (const dir of [OUT_DIR, ASSETS_DIR]) {
    const xlsxPath = path.join(dir, `${filename}.xlsx`);
    XLSX.writeFile(wb, xlsxPath);
    // Also save CSV of first sheet with UTF-8 BOM
    const firstSheetName = wb.SheetNames[0];
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(wb.Sheets[firstSheetName]);
    fs.writeFileSync(path.join(dir, `${filename}.csv`), csvContent, "utf8");
  }
  console.log(`Saved master template: ${filename}`);
}

// 1. BM.01: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm (5 khu vực)
function buildBM01() {
  const wb = XLSX.utils.book_new();

  for (const area of TEMPERATURE_AREAS_5) {
    const rows = [
      ["BỆNH VIỆN QUÂN Y 103", "", "", "", "", "", "", "BM.01/QL.HTAT.01"],
      ["KHOA SINH HÓA", "", "", "", "", "", "", "Phiên bản: 3.0"],
      ["BIỂU MẪU THEO DÕI NHIỆT ĐỘ, ĐỘ ẨM PHÒNG XÉT NGHIỆM"],
      [`Khu vực: ${area.name}`, "", "", "Thời gian: Tháng ..... Năm 20...."],
      ["Ngưỡng nhiệt độ quy định: 21 – 26°C", "", "", "Ngưỡng độ ẩm quy định: 20 – 80%"],
      [],
      [
        "Ngày",
        "Giờ đo (Sáng)",
        "Nhiệt độ (°C)",
        "Độ ẩm (%)",
        "Giờ đo (Chiều)",
        "Nhiệt độ (°C)",
        "Độ ẩm (%)",
        "Đánh giá ISO",
        "Ghi chú",
        "Chữ ký KTV",
      ],
    ];

    for (let day = 1; day <= 31; day++) {
      rows.push([day, "08:30", "", "", "14:30", "", "", "", "", ""]);
    }

    rows.push([]);
    rows.push(["Lãnh đạo BMK phê duyệt", "", "", "", "", "", "", "Người xem xét"]);
    rows.push(["(Ký và ghi rõ họ tên)", "", "", "", "", "", "", "(Ký và ghi rõ họ tên)"]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, area.code);
  }

  saveWorkbook("BM.01_QL.HTAT.01_Nhiet_Do_PXN", wb);
}

// 2. BM.02: Theo dõi tủ lạnh mát (2 - 8°C)
function buildBM02() {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["BỆNH VIỆN QUÂN Y 103", "", "", "", "", "", "", "", "", "", "BM.02/QL.HTAT.01"],
    ["BỘ MÔN KHOA HÓA SINH", "", "", "", "", "", "", "", "", "", "Phiên bản: 3.0"],
    ["PHIẾU THEO DÕI NHIỆT ĐỘ TỦ LẠNH MÁT"],
    ["Tên thiết bị: .......................................", "", "", "Mã thiết bị: ......................................."],
    ["Nhiệt độ yêu cầu: Ngăn mát từ 2°C đến 8°C", "", "", "Thời gian: Tháng ..... Năm 20...."],
    ["Thời gian ghi: Sáng: 8 - 9 giờ; Chiều: 14h30 - 15h30"],
    [],
    ["Ngày", "Ca đo", "Giờ kiểm tra", "Nhiệt độ (°C)", "Ngưỡng chuẩn", "Đánh giá", "Người theo dõi", "Ghi chú"],
  ];

  for (let day = 1; day <= 31; day++) {
    rows.push([day, "Sáng", "08:30", "", "2 – 8°C", "", "", ""]);
    rows.push([day, "Chiều", "14:30", "", "2 – 8°C", "", "", ""]);
  }

  rows.push([]);
  rows.push(["Lãnh đạo BMK", "", "", "", "", "", "Người xem xét"]);
  rows.push(["(Ký và ghi rõ họ tên)", "", "", "", "", "", "(Ký và ghi rõ họ tên)"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Tu_Lanh_Mat");
  saveWorkbook("BM.02_QL.HTAT.01_Tu_Lanh_Mat", wb);
}

// 3. BM.03: Theo dõi tủ lạnh đá (-10 đến -30°C)
function buildBM03() {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["BỆNH VIỆN QUÂN Y 103", "", "", "", "", "", "", "", "", "", "BM.03/QL.HTAT.01"],
    ["BỘ MÔN KHOA HÓA SINH", "", "", "", "", "", "", "", "", "", "Phiên bản: 3.0"],
    ["PHIẾU THEO DÕI NHIỆT ĐỘ TỦ LẠNH ĐÁ"],
    ["Tên thiết bị: .......................................", "", "", "Mã thiết bị: ......................................."],
    ["Nhiệt độ yêu cầu: Tủ đá từ -10°C đến -30°C", "", "", "Thời gian: Tháng ..... Năm 20...."],
    ["Thời gian ghi: Sáng: 8 - 9 giờ; Chiều: 14h30 - 15h30"],
    [],
    ["Ngày", "Ca đo", "Giờ kiểm tra", "Nhiệt độ (°C)", "Ngưỡng chuẩn", "Đánh giá", "Người theo dõi", "Ghi chú"],
  ];

  for (let day = 1; day <= 31; day++) {
    rows.push([day, "Sáng", "08:30", "", "-30 đến -10°C", "", "", ""]);
    rows.push([day, "Chiều", "14:30", "", "-30 đến -10°C", "", "", ""]);
  }

  rows.push([]);
  rows.push(["Lãnh đạo BMK", "", "", "", "", "", "Người xem xét"]);
  rows.push(["(Ký và ghi rõ họ tên)", "", "", "", "", "", "(Ký và ghi rõ họ tên)"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Tu_Lanh_Da");
  saveWorkbook("BM.03_QL.HTAT.01_Tu_Lanh_Da", wb);
}

// 4. BM.01_KNBM: Phiếu theo dõi khử nhiễm bề mặt
function buildBM01_KNBM() {
  const wb = XLSX.utils.book_new();
  const rows = [
    ["BỆNH VIỆN QUÂN Y 103 · KHOA SINH HÓA", "", "", "", "BM.01_KNBM"],
    ["PHIẾU THEO DÕI KHỬ NHIỄM BỀ MẶT KHU VỰC LÀM VIỆC"],
    ["Khu vực: ...........................................................", "", "Thời gian: Tháng ..... Năm 20...."],
    [],
    ["Ngày", "Hằng ngày", "Hằng tuần", "Khi có tràn đổ hóa chất", "Ghi chú", "Chữ ký KTV"],
  ];

  for (let day = 1; day <= 31; day++) {
    rows.push([day, "", "", "", "", ""]);
  }

  rows.push([]);
  rows.push(["Lãnh đạo BMK", "", "", "Người xem xét"]);
  rows.push(["(Ký và ghi rõ họ tên)", "", "", "(Ký và ghi rõ họ tên)"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Khu_Nhiem");
  saveWorkbook("BM.01_KNBM_Khu_Nhiem_Be_Mat", wb);
}

// 5. BM.02: Bảng theo dõi bảo dưỡng máy
function buildBM02_TRTB() {
  const wb = XLSX.utils.book_new();
  const headerDays = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const rows = [
    ["BỆNH VIỆN QUÂN Y 103 · BỘ MÔN KHOA HÓA SINH", "", "", "", "", "", "", "", "", "", "BM.02/QL.TRTB.01"],
    ["BẢNG THEO DÕI BẢO DƯỠNG MÁY (Phiên bản: 4.0)"],
    ["Tên máy: ........................................................", "", "", "Tháng ..... Năm 20...."],
    [],
    ["HẠNG MỤC BẢO DƯỠNG", ...headerDays],
    ["1. HÀNG NGÀY (Rửa đường ống, kiểm tra hóa chất, rửa Wash pot)"],
    ["- Thực hiện / Đạt"],
    ["- Người thực hiện"],
    ["2. HÀNG TUẦN (Lau kim hút, que khuấy, vệ sinh bề mặt)"],
    ["- Thực hiện / Đạt"],
    ["- Người thực hiện"],
    ["3. HÀNG THÁNG (Rửa can nước cất, thay filter)"],
    ["- Thực hiện / Đạt"],
    ["- Người thực hiện"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Bao_Duong");
  saveWorkbook("BM.02_QL.TRTB.01_Bao_Duong_TTB", wb);
}

// 6. BM.06: Nhật ký hoạt động trang thiết bị (25 máy theo hàng ngang, 4 ca/ngày)
function buildBM06() {
  const wb = XLSX.utils.book_new();

  // Columns: Ngày, Ca trực, Khung giờ, Người trực, 25 máy, Ghi chú
  const headerRow = [
    "Ngày",
    "Ca trực",
    "Khung giờ",
    "Người trực",
    "Lượng sử dụng (Giờ)",
    ...MACHINES_25,
    "Ghi chú",
  ];

  const rows = [
    ["BỘ MÔN - KHOA SINH HÓA - BỆNH VIỆN QUÂN Y 103", "", "", "", "", "", "", "BM.06/QL.TRTB.01 (Phiên bản 4.0)"],
    ["NHẬT KÝ HOẠT ĐỘNG TRANG THIẾT BỊ (HỆ THỐNG 25 MÁY XÉT NGHIỆM)"],
    ["Quyển số: ..................", "Từ ngày: ....................", "Đến ngày: ...................."],
    ["Quy ước trạng thái máy: BT = Bình thường; KSD = Không sử dụng; H = Hỏng / Báo lỗi kỹ thuật"],
    [],
    headerRow,
  ];

  const SHIFTS = [
    { code: "Ca 1", time: "07:00 – 11:30" },
    { code: "Ca 2", time: "11:30 – 13:30" },
    { code: "Ca 3", time: "13:30 – 16:30" },
    { code: "Ca 4", time: "16:30 – 07:00" },
  ];

  // 31 days * 4 shifts = 124 rows, each row has 25 machine cells
  for (let day = 1; day <= 31; day++) {
    for (const shift of SHIFTS) {
      const machineCells = Array(25).fill("");
      rows.push([day, shift.code, shift.time, "", "", ...machineCells, ""]);
    }
  }

  rows.push([]);
  rows.push(["Lãnh đạo BMK phê duyệt", "", "", "", "", "", "Người xem xét"]);
  rows.push(["(Ký và ghi rõ họ tên)", "", "", "", "", "", "(Ký và ghi rõ họ tên)"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Nhat_Ky_25_May");
  saveWorkbook("BM.06_QL.TRTB.01_Nhat_Ky_25_TTB_4_Ca", wb);
}

console.log("Generating 6 master hospital templates...");
buildBM01();
buildBM02();
buildBM03();
buildBM01_KNBM();
buildBM02_TRTB();
buildBM06();
console.log("ALL 6 MASTER TEMPLATES GENERATED SUCCESSFULLY 100%!");
