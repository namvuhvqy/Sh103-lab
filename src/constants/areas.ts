export interface AreaConfig {
  code: string;
  name: string;
  deviceCount: number;
  description: string;
  icon: string;
  href: string;
}

export const AREAS: AreaConfig[] = [
  {
    code: "SINH_HOA",
    name: "Khu Sinh hóa",
    deviceCount: 9,
    description: "9 máy phân tích sinh hóa tự động",
    icon: "🧪",
    href: "/areas/SINH_HOA",
  },
  {
    code: "MIEN_DICH",
    name: "Khu Miễn dịch",
    deviceCount: 8,
    description: "8 máy xét nghiệm miễn dịch",
    icon: "🔬",
    href: "/areas/MIEN_DICH",
  },
  {
    code: "NUOC_TIEU",
    name: "Khu Nước tiểu",
    deviceCount: 4,
    description: "4 máy phân tích nước tiểu & cặn lắng",
    icon: "🧪",
    href: "/areas/NUOC_TIEU",
  },
  {
    code: "LY_TAM",
    name: "Khu Ly tâm",
    deviceCount: 4,
    description: "4 máy ly tâm phòng xét nghiệm",
    icon: "🔄",
    href: "/areas/LY_TAM",
  },
  {
    code: "NHAN_BENH_PHAM",
    name: "Khu Nhận bệnh phẩm",
    deviceCount: 0,
    description: "Vệ sinh & Khử nhiễm BM.01_KNBM",
    icon: "📋",
    href: "/areas/NHAN_BENH_PHAM",
  },
];

export interface TemperatureAreaConfig {
  code: string;
  name: string;
  normTemp: string;
  normHumidity: string;
}

export const TEMPERATURE_AREAS: TemperatureAreaConfig[] = [
  { code: "NUOC_TIEU", name: "Khu vực Nước tiểu", normTemp: "21–26°C", normHumidity: "20–80%" },
  { code: "SINH_HOA", name: "Khu vực Sinh hóa", normTemp: "21–26°C", normHumidity: "20–80%" },
  { code: "MIEN_DICH", name: "Khu vực Miễn dịch", normTemp: "21–26°C", normHumidity: "20–80%" },
  { code: "AUTOMATION", name: "Hệ Automation", normTemp: "21–26°C", normHumidity: "20–80%" },
  { code: "LOC_NUOC_RO", name: "Lọc nước RO", normTemp: "21–26°C", normHumidity: "20–80%" },
];
