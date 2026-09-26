export interface MachineMaster {
  order: number;
  code: string;
  name: string;
  model: string;
  locationCode: string;
  locationName: string;
}

export const HOSPITAL_MACHINES_25: MachineMaster[] = [
  { order: 1, code: "TB-01", name: "Máy XN Khí Máu GEM Premier 3000", model: "GEM Premier 3000", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 2, code: "TB-02", name: "Máy Primier Hb 9210 -M1", model: "Primier Hb 9210", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 3, code: "TB-03", name: "Máy XN nước tiểu LabUMat 2- M1", model: "LabUMat 2", locationCode: "NUOC_TIEU", locationName: "Khu Nước tiểu" },
  { order: 4, code: "TB-04", name: "Máy Miễn dịch Cobas E602", model: "Cobas E602", locationCode: "MIEN_DICH", locationName: "Khu Miễn dịch" },
  { order: 5, code: "TB-05", name: "Máy Primier Hb 9210- M2", model: "Primier Hb 9210", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 6, code: "TB-06", name: "Máy Primier Hb 9210- M1", model: "Primier Hb 9210", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 7, code: "TB-07", name: "Máy XN SH - MD tự động ARCHITECT-2", model: "ARCHITECT-2", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 8, code: "TB-08", name: "Máy nước tiểu ureader Plus 2 - M1", model: "ureader Plus 2", locationCode: "NUOC_TIEU", locationName: "Khu Nước tiểu" },
  { order: 9, code: "TB-09", name: "Máy xét nghiệm khí máu Geem 3500", model: "Geem 3500", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 10, code: "TB-10", name: "Máy nước tiểu ureader Plus 2 - M2", model: "ureader Plus 2", locationCode: "NUOC_TIEU", locationName: "Khu Nước tiểu" },
  { order: 11, code: "TB-11", name: "Hệ thống Automation Máy XN sinh hóa AU5800-M4-5", model: "AU5800", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 12, code: "TB-12", name: "Hệ thống Automation Máy XN sinh hóa AU5800-M6", model: "AU5800", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 13, code: "TB-13", name: "Hệ thống Automation Máy XN MD DXI-M3", model: "DXI", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 14, code: "TB-14", name: "Hệ thống Automation Máy XN MD DXI-M4", model: "DXI", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 15, code: "TB-15", name: "Máy xét nghiệm Miễn dịch Maglumi X3", model: "Maglumi X3", locationCode: "MIEN_DICH", locationName: "Khu Miễn dịch" },
  { order: 16, code: "TB-16", name: "Máy xét nghiệm nước tiểu LabUmat 2-M2", model: "LabUmat 2", locationCode: "NUOC_TIEU", locationName: "Khu Nước tiểu" },
  { order: 17, code: "TB-17", name: "Máy xét nghiệm HbA1C-HLC-723G11 (Tosoh)", model: "HLC-723G11", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 18, code: "TB-18", name: "Máy XN SH-MD Anility", model: "Anility", locationCode: "AUTOMATION", locationName: "Hệ Automation" },
  { order: 19, code: "TB-19", name: "Máy xét nghiệm khí máu Geem 3500", model: "Geem 3500", locationCode: "SINH_HOA", locationName: "Khu Sinh hóa" },
  { order: 20, code: "TB-20", name: "Máy lắc VORTEX", model: "VORTEX", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
  { order: 21, code: "TB-21", name: "Máy li tâm 24 lỗ lạnh UNIVERSAL 320R", model: "UNIVERSAL 320R", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
  { order: 22, code: "TB-22", name: "Máy li tâm 68 lỗ ROTOFIX 32A", model: "ROTOFIX 32A", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
  { order: 23, code: "TB-23", name: "Máy lắc ngang", model: "Lắc ngang", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
  { order: 24, code: "TB-24", name: "Máy li tâm Ependox-M1", model: "Ependox", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
  { order: 25, code: "TB-25", name: "Máy li tâm Ependox-M2", model: "Ependox", locationCode: "LY_TAM", locationName: "Khu Ly tâm" },
];
