export const BM06_CANONICAL_TEMPLATE_PATH = "docs/danh mục biểu mẫu/BM06_QL_TRTB_01_Nhat_ky_hoat_dong_TTB_no_cover_owner_approved.xlsx";
export const BM06_CANONICAL_TEMPLATE_SHA256 = "c71fad1fdb889e45c2f728b84097ccbca617cb946dc70cc86de6e8af37130b4c";

export const BM06_FINAL_SHIFT_WINDOWS = [
  { slot: "SHIFT_1", label: "Ca 1", time: "07:00–11:30" },
  { slot: "SHIFT_2", label: "Ca 2", time: "11:30–13:30" },
  { slot: "SHIFT_3", label: "Ca 3", time: "13:30–16:30" },
  { slot: "SHIFT_4", label: "Ca 4", time: "16:30–07:00 hôm sau" },
] as const;

export const BM06_TEMPLATE_PAGES = [
  {
    name: "Trang 1",
    range: "A2:L18",
    noteCell: "L",
    devices: [
      { order: 1, name: "Máy XN Khí Máu GEM Premier 3000", column: "D" },
      { order: 2, name: "Máy Primier Hb 9210 -M1", column: "E" },
      { order: 3, name: "Máy XN nước tiểu LabUMat 2- M1", column: "F" },
      { order: 4, name: "Máy Miễn dịch Cobas E602", column: "G" },
      { order: 5, name: "Máy Primier Hb 9210- M2", column: "H" },
      { order: 6, name: "Máy Primier Hb 9210- M1", column: "I" },
      { order: 7, name: "Máy XN SH - MD tự động ARCHITECT-2", column: "J" },
      { order: 8, name: "Máy nước tiểu ureader Plus 2 - M1", column: "K" },
    ],
  },
  {
    name: "Trang 2",
    range: "A2:M18",
    noteCell: "M",
    devices: [
      { order: 9, name: "Máy xét nghiệm khí máu Geem 3500", column: "D" },
      { order: 10, name: "Máy nước tiểu ureader Plus 2 - M2", column: "E" },
      { order: 11, name: "Hệ thống Automation Máy XN sinh hóa AU5800-M4-5", column: "F" },
      { order: 12, name: "Hệ thống Automation Máy XN sinh hóa AU5800-M6", column: "G" },
      { order: 13, name: "Hệ thống Automation Máy XN MD DXI-M3", column: "H" },
      { order: 14, name: "Hệ thống Automation Máy XN MD DXI-M4", column: "I" },
      { order: 15, name: "Máy xét nghiệm Miễn dịch Maglumi X3", column: "J" },
      { order: 16, name: "Máy xét nghiệm nước tiểu LabUmat 2-M2", column: "K" },
      { order: 17, name: "Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh Nhật Bản", column: "L" },
    ],
  },
  {
    name: "Trang 3",
    range: "A2:L18",
    noteCell: "L",
    devices: [
      { order: 18, name: "Máy XN SH-MD Anility", column: "D" },
      { order: 19, name: "Máy xét nghiệm khí máu Geem 3500", column: "E" },
      { order: 20, name: "Máy lắc VORTEX", column: "F" },
      { order: 21, name: "Máy li tâm 24 lỗ lạnh UNIVERSAL 320R", column: "G" },
      { order: 22, name: "Máy li tâm 68 lỗ ROTOFIX 32A", column: "H" },
      { order: 23, name: "Máy lắc ngang", column: "I" },
      { order: 24, name: "Máy li tâm Ependox-M1", column: "J" },
      { order: 25, name: "Máy li tâm Ependox-M2", column: "K" },
    ],
  },
] as const;

export const BM06_TEMPLATE_DEVICE_COUNT = BM06_TEMPLATE_PAGES.reduce((total, page) => total + page.devices.length, 0);

export function bm06TemplatePageForDevice(order: number) {
  return BM06_TEMPLATE_PAGES.find((page) => page.devices.some((device) => device.order === order)) ?? null;
}
