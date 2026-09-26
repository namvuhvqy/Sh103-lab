export interface FridgeMaster {
  order: number;
  code: string;
  name: string;
  trackingDevice: string;
  tempRange: string;
  locationName: string;
  type: "COOL" | "FREEZER"; // 2–8°C vs -10 đến -30°C
}

export const HOSPITAL_FRIDGES_13: FridgeMaster[] = [
  {
    order: 1,
    code: "TU-01",
    name: "Tủ âm sâu Overmed",
    trackingDevice: "Theo hiển thị trên tủ",
    tempRange: "-10 đến -30°C",
    locationName: "Tủ lưu mẫu",
    type: "FREEZER",
  },
  {
    order: 2,
    code: "TU-02",
    name: "Tủ lạnh TOWASHI",
    trackingDevice: "NKĐT-01",
    tempRange: "2 đến 8°C",
    locationName: "HC kho lẻ",
    type: "COOL",
  },
  {
    order: 3,
    code: "TU-03-MAT",
    name: "Tủ lạnh MITSUBISHI (ngăn mát)",
    trackingDevice: "NKĐT-12",
    tempRange: "2 đến 8°C",
    locationName: "Cal, QC",
    type: "COOL",
  },
  {
    order: 4,
    code: "TU-03-DA",
    name: "Tủ lạnh MITSUBISHI (ngăn đá)",
    trackingDevice: "NKĐT-12",
    tempRange: "-10 đến -30°C",
    locationName: "Cal, QC",
    type: "FREEZER",
  },
  {
    order: 5,
    code: "TU-04",
    name: "Tủ lạnh SANAKY",
    trackingDevice: "NKĐT-09",
    tempRange: "2 đến 8°C",
    locationName: "HC kho chính",
    type: "COOL",
  },
  {
    order: 6,
    code: "TU-05",
    name: "Tủ lạnh SANAKY",
    trackingDevice: "NKĐT-05",
    tempRange: "2 đến 8°C",
    locationName: "Tủ lưu mẫu",
    type: "COOL",
  },
  {
    order: 7,
    code: "TU-06-MAT",
    name: "Tủ lạnh LG (ngăn mát)",
    trackingDevice: "NKĐT-08",
    tempRange: "2 đến 8°C",
    locationName: "QC, Cal",
    type: "COOL",
  },
  {
    order: 8,
    code: "TU-06-DONG",
    name: "Tủ lạnh LG (ngăn đông)",
    trackingDevice: "NKĐT-10",
    tempRange: "-10 đến -30°C",
    locationName: "QC, Cal",
    type: "FREEZER",
  },
  {
    order: 9,
    code: "TU-07-MAT",
    name: "Tủ lạnh MITSUBISHI (ngăn mát)",
    trackingDevice: "NKĐT-14",
    tempRange: "2 đến 8°C",
    locationName: "HC kho chính",
    type: "COOL",
  },
  {
    order: 10,
    code: "TU-07-DONG",
    name: "Tủ lạnh MITSUBISHI (ngăn đông)",
    trackingDevice: "NKĐT-06",
    tempRange: "-10 đến -30°C",
    locationName: "HC kho chính",
    type: "FREEZER",
  },
  {
    order: 11,
    code: "TU-08",
    name: "Tủ lạnh Acuma",
    trackingDevice: "NKTG-01",
    tempRange: "2 đến 8°C",
    locationName: "Tủ lưu mẫu",
    type: "COOL",
  },
  {
    order: 12,
    code: "TU-09",
    name: "Tủ lạnh Alaska",
    trackingDevice: "NKTG-02",
    tempRange: "2 đến 8°C",
    locationName: "HC kho chính",
    type: "COOL",
  },
  {
    order: 13,
    code: "TU-10",
    name: "Tủ lạnh Sanaky",
    trackingDevice: "NKTG-03",
    tempRange: "2 đến 8°C",
    locationName: "HC kho chính",
    type: "COOL",
  },
];
