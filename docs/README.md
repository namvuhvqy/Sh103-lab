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
│   ├── 03_SCREEN_MENU_UIUX_FINAL.md   # Thiết kế màn hình/menu, Area-first flow, mobile-first
│   ├── 04_IMPLEMENTATION_PLAN_FINAL.md# Lộ trình kỹ thuật P0–P9, Exit Gate
│   └── 05_P5_PRODUCT_UI_EXPANSION_FINAL.md # Owner-approved P5 addendum: UI polish, Notification Center, Admin Announcement, Incident Report, Report Center
│
├── [Hồ Sơ Đánh Giá & Audit Chuyên Đề]
│   ├── AREA_FIRST_CHANGE_IMPACT_AUDIT.md # Hồ sơ lịch sử thay đổi Area-first; không phải source of truth mới hơn FINAL
│   └── FINAL_CROSS_FILE_AUDIT.md         # Hồ sơ audit lịch sử; không được dùng để ghi đè các file FINAL/Addendum mới hơn
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

## 2. Thứ tự Đọc & Triển khai Tài liệu

Để nắm bắt đúng kiến trúc và triển khai chính xác:

1. **Bước 1 — Nắm phạm vi lõi:**
   - Đọc `00_PRODUCT_SCOPE_FINAL.md`.
   - Đọc `01_ARCHITECTURE_FINAL.md`.
   - Đọc `02_FORMS_DATA_RULES_FINAL.md`.
   - Đọc `03_SCREEN_MENU_UIUX_FINAL.md`.
   - Đọc `04_IMPLEMENTATION_PLAN_FINAL.md`.

2. **Bước 2 — Nếu task thuộc P5 trở đi:**
   - Bắt buộc đọc thêm `05_P5_PRODUCT_UI_EXPANSION_FINAL.md`.
   - File 05 là Owner-approved addendum cho P5 và bổ sung chính thức các scope mới: UI/branding polish, operational banner, Notification Center, Admin Announcement, Incident Report, nâng cấp màn hình Nhiệt độ/Độ ẩm, Approval Center presentation và Report Center.
   - Chỉ các điểm được file 05 ghi rõ là scope expansion mới được phép ghi đè giới hạn cũ từ P5 trở đi. Các rule lõi về role, approval authority, 25 máy, 13 tủ, Area-first, RLS, correction/audit vẫn giữ nguyên.

3. **Bước 3 — Raw source:**
   - Dùng `danh mục biểu mẫu/` để đối chiếu nguồn khi cần.
   - Không tự suy ra business rule mới từ layout cũ của file Word/Excel nếu FINAL đã có quyết định mới hơn.

---

## 3. Thứ tự ưu tiên khi có xung đột

1. Quyết định Owner mới nhất được ghi rõ trong file FINAL/Addendum.
2. `00_PRODUCT_SCOPE_FINAL.md` cho phạm vi lõi P0–P4.
3. `02_FORMS_DATA_RULES_FINAL.md` cho nghiệp vụ 6 Core Pilot forms.
4. `01_ARCHITECTURE_FINAL.md` cho architecture/security/data contract.
5. `03_SCREEN_MENU_UIUX_FINAL.md` cho UI/UX hiện hành.
6. `04_IMPLEMENTATION_PLAN_FINAL.md` cho sequencing/exit gates.
7. `05_P5_PRODUCT_UI_EXPANSION_FINAL.md` cho các mở rộng đã duyệt từ P5 trở đi; tại đúng các mục được đánh dấu scope expansion, file 05 là quyết định mới hơn.
8. Audit/process artifacts chỉ để tham khảo lịch sử, không được dùng để ghi đè FINAL.

Nếu vẫn còn mâu thuẫn không giải được bằng thứ tự trên, AI coding agent phải dừng và hỏi Owner; không tự chọn phương án.

---

## 4. Lưu Ý Về Quản Trị Tài Liệu

- Các file tài liệu mang hậu tố `_FINAL.md` và P5 addendum trong danh sách trên là Source of Truth chính thức cho phạm vi tương ứng.
- Mọi thông tin xác thực/biến môi trường phải được lưu trong `.env.local` theo mẫu `.env.example`, tuyệt đối không lưu thông tin nhạy cảm vào thư mục tài liệu hoặc commit repository.
- Không hard-code dữ liệu demo chỉ để đạt giao diện giống ảnh tham chiếu.
- Với UI P5, ảnh tham chiếu chỉ định hướng độ hoàn thiện; business rules luôn đến từ docs.
