# SH103-Lab — Danh Mục & Hướng Dẫn Đọc Bộ Tài Liệu Dự Án

Thư mục `docs/` chứa toàn bộ đặc tả nghiệp vụ, kiến trúc kỹ thuật, thiết kế giao diện và hồ sơ audit độc lập của dự án SH103-Lab.

---

## 1. Cấu trúc Tài liệu & Phân loại

```
docs/
├── README.md                          # (File hiện tại) Mục lục & Hướng dẫn tra cứu tài liệu
│
├── [Bộ Tài Liệu Cơ Sở FINAL - Area-First Architecture]
│   ├── 00_PRODUCT_SCOPE_FINAL.md      # Định vị sản phẩm, 6 nhóm form, 3 vai trò, quyết định P0-16 Area-first (5 khu vực)
│   ├── 01_ARCHITECTURE_FINAL.md      # Kiến trúc kỹ thuật: Next.js + Supabase, 5 Khu vực, Schema, RLS, Index
│   ├── 02_FORMS_DATA_RULES_FINAL.md   # Đặc tả 6 biểu mẫu, Bảng ánh xạ 25 máy vào các khu vực, 13 dòng tủ
│   ├── 03_SCREEN_MENU_UIUX_FINAL.md   # Thiết kế 27 màn hình (S00–S26), Area-first flow, 5 thẻ khu vực, Design tokens
│   └── 04_IMPLEMENTATION_PLAN_FINAL.md# Lộ trình kỹ thuật P0–P9, tích hợp Area-first vào P2/P3, Exit Gate
│
├── [Hồ Sơ Đánh Giá & Audit Chuyên Đề]
│   ├── AREA_FIRST_CHANGE_IMPACT_AUDIT.md # Đánh giá tác động chuyển đổi mô hình điều hướng Area-First
│   └── FINAL_CROSS_FILE_AUDIT.md         # Báo cáo kiểm tra chéo 17 tiêu chí đồng nhất giữa 5 file FINAL
│
└── danh mục biểu mẫu/                 # [Biểu Mẫu Gốc & Phụ Lục Chuẩn Hóa]
    ├── BM.01_KNBM.docx                # Mẫu gốc: Khử nhiễm bề mặt khu vực làm việc
    ├── BM.01_QL.HTAT_TD nhiệt độ PXN.doc # Mẫu gốc: Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm
    ├── BM.02.Bảng theo dõi - bảo dưỡng TTB.xls # Mẫu gốc: Theo dõi và bảo dưỡng thiết bị
    ├── BM.02.QL.HTAT.01_TD tủ lạnh mát.xls # Mẫu gốc: Theo dõi nhiệt độ tủ lạnh mát
    ├── BM.03.QL.HTAT.01_TD tủ lạnh đá.xls  # Mẫu gốc: Theo dõi nhiệt độ tủ lạnh đá
    ├── BM.06. Nhật kí hoạt động TTB.docx # Mẫu gốc: Nhật ký hoạt động trang thiết bị 4 ca
    └── Phụ lục.docx                   # Danh mục gốc 25 máy, 13 tủ, điểm đo môi trường, nhân sự
```

---

## 2. Thứ tự Đọc & Triển khai Tài liệu (Dành cho Lập trình viên & Kỹ sư)

Để nắm bắt đúng kiến trúc và triển khai chính xác:

1. **Bước 1 — Nắm bắt phạm vi & luồng điều hướng Area-first:**
   - Đọc [00_PRODUCT_SCOPE_FINAL.md](file:///docs/00_PRODUCT_SCOPE_FINAL.md) (khóa 5 khu vực làm việc, 3 vai trò, cờ Admin).
   - Đọc [AREA_FIRST_CHANGE_IMPACT_AUDIT.md](file:///docs/AREA_FIRST_CHANGE_IMPACT_AUDIT.md) và [FINAL_CROSS_FILE_AUDIT.md](file:///docs/FINAL_CROSS_FILE_AUDIT.md).

2. **Bước 2 — Tham chiếu đặc tả chi tiết khi lập trình:**
   - Nghiệp vụ & Dữ liệu: [02_FORMS_DATA_RULES_FINAL.md](file:///docs/02_FORMS_DATA_RULES_FINAL.md) (bảng ánh xạ 25 máy, 13 dòng tủ, 6 biểu mẫu).
   - Kiến trúc & Database: [01_ARCHITECTURE_FINAL.md](file:///docs/01_ARCHITECTURE_FINAL.md) (schema PostgreSQL, bảng locations, RLS).
   - Giao diện & Tương tác: [03_SCREEN_MENU_UIUX_FINAL.md](file:///docs/03_SCREEN_MENU_UIUX_FINAL.md) (27 màn hình S00–S26, 5 thẻ khu vực, mobile-first).
   - Kế hoạch & Tiêu chí nghiệm thu: [04_IMPLEMENTATION_PLAN_FINAL.md](file:///docs/04_IMPLEMENTATION_PLAN_FINAL.md) (lộ trình P0–P9).

---

## 3. Lưu Ý Về Quản Trị Tài Liệu

- Các file tài liệu mang hậu tố `_FINAL.md` giữ tên để đồng bộ với lịch sử dự án và là Source of Truth chính thức cho quá trình triển khai mã nguồn.
- Mọi thông tin xác thực/biến môi trường phải được lưu trong `.env.local` theo mẫu `.env.example`, tuyệt đối không lưu thông tin nhạy cảm vào thư mục tài liệu hoặc commit lên repository.
