export const BM06_CANONICAL_TEMPLATE_PATH = "docs/danh mục biểu mẫu/BM.06. Nhật kí hoạt động TTB.xlsx";
export const BM06_CANONICAL_TEMPLATE_SHA256 = "ee12d2cffe5ef91f3649053c0e567d93886fb42439121d90065620ae8bbe464b";

export const BM06_FINAL_SHIFT_WINDOWS = [
  { slot: "SHIFT_1", label: "Ca 1", time: "07:00–11:30" },
  { slot: "SHIFT_2", label: "Ca 2", time: "11:30–13:30" },
  { slot: "SHIFT_3", label: "Ca 3", time: "13:30–16:30" },
  { slot: "SHIFT_4", label: "Ca 4", time: "16:30–07:00 hôm sau" },
] as const;

export const BM06_TEMPLATE_PAGES = [
  {
    name: "Trang 1",
    range: "A6:M17",
    noteCell: "M",
    devices: [
      { order: 1, name: "Máy XN SH - MD tự động ARCHITECT-2", column: "D", shortLabel: "Arch-2" },
      { order: 2, name: "Máy XN SH-MD Anility", column: "E", shortLabel: "Alinity" },
      { order: 3, name: "Máy xét nghiệm Miễn dịch Maglumi X3", column: "F", shortLabel: "Maglumi" },
      { order: 4, name: "Máy li tâm 24 lỗ lạnh UNIVERSAL 320R", column: "G", shortLabel: "LT Lạnh 320" },
      { order: 5, name: "Máy Hb-HLC-723G11 Hãng Tosoh", column: "H", shortLabel: "Tosoh" },
      { order: 6, name: "Hệ thống Automation Máy XN MD DXI-M3", column: "I", shortLabel: "DXI- 3" },
      { order: 7, name: "Hệ thống Automation Máy XN MD DXI-M4", column: "J", shortLabel: "DXI- 4" },
      { order: 8, name: "Hệ thống Automation Máy XN sinh hóa AU5800-M4-5", column: "K", shortLabel: "AU5800 (4+5)" },
      { order: 9, name: "Hệ thống Automation Máy XN sinh hóa AU5800-M6", column: "L", shortLabel: "AU5800- 6" },
      { order: 10, name: "Máy lắc VORTEX", column: "M", shortLabel: "Vortex" },
    ],
  },
  {
    name: "Trang 2",
    range: "A6:K17",
    noteCell: "K",
    devices: [
      { order: 11, name: "Máy Primier Hb 9210- M1", column: "A", shortLabel: "Hb1" },
      { order: 12, name: "Máy Primier Hb 9210- M2", column: "B", shortLabel: "Hb2" },
      { order: 13, name: "Máy XN Khí Máu GEM Premier 3000", column: "C", shortLabel: "Gem 3000" },
      { order: 14, name: "Máy xét nghiệm khí máu Geem 3500", column: "D", shortLabel: "Gem 3500" },
      { order: 15, name: "Máy XN nước tiểu LabUMat 2- M1", column: "E", shortLabel: "L.Umat 1" },
      { order: 16, name: "Máy xét nghiệm nước tiểu LabUmat 2-M2", column: "F", shortLabel: "L.Umat 2" },
      { order: 17, name: "Máy nước tiểu ureader Plus 2", column: "G", shortLabel: "L.Ureader 2" },
      { order: 18, name: "Máy li tâm 68 lỗ ROTOFIX 32A", column: "H", shortLabel: "Rotofix" },
      { order: 19, name: "Máy li tâm Ependox-M1", column: "I", shortLabel: "Epend 1" },
      { order: 20, name: "Máy li tâm Ependox-M2", column: "J", shortLabel: "Epend 2" },
    ],
  },
] as const;

export const BM06_TEMPLATE_DEVICE_COUNT = BM06_TEMPLATE_PAGES.reduce((total, page) => total + page.devices.length, 0);

export function bm06TemplatePageForDevice(order: number) {
  return BM06_TEMPLATE_PAGES.find((page) => page.devices.some((device) => device.order === order)) ?? null;
}
