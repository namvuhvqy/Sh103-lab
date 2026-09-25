# SH103-Lab — Danh Mục & Hướng Dẫn Đọc Bộ Tài Liệu Dự Án

Thư mục `docs/` chứa toàn bộ đặc tả nghiệp vụ, kiến trúc kỹ thuật, thiết kế giao diện và hồ sơ audit độc lập của dự án SH103-Lab.

---

## 1. Cấu trúc Tài liệu & Phân loại

```text
docs/
├── README.md                          # (File hiện tại) Mục lục & Hướng dẫn tra cứu tài liệu
│
├── [Bộ Tài Liệu FINAL / Addendum]
│   ├── 00_PRODUCT_SCOPE_FINAL.md      # Định vị sản phẩm, 6 nhóm form, 3 vai trò, Area-first (5 khu vực)
│   ├── 01_ARCHITECTURE_FINAL.md       # Next.js + Supabase, schema, RLS, index, security contract
│   ├── 02_FORMS_DATA_RULES_FINAL.md   # Đặc tả 6 form, 25 máy, 13 dòng tủ, threshold/slot/rule
│   ├── 03_SCREEN_MENU_UIUX_FINAL.md   # UI/UX nền, Area-first flow, mobile-first
│   ├── 04_IMPLEMENTATION_PLAN_FINAL.md# Roadmap lịch sử P0–P9, phase sequencing, exit gate nền
│   ├── 05_P5_PRODUCT_UI_EXPANSION_FINAL.md # P5 scope expansion: UI polish, Notification, Announcement, Incident, Report Center
│   └── 06_P5_MOCKUP_SYNC_P6_P9_FINAL.md    # FINAL mới nhất: 6 mockup chốt, M01 giản lược, nav canonical, P6–P9 hardening bổ sung
│
├── [Hồ Sơ Đánh Giá & Audit Chuyên Đề]
│   ├── AREA_FIRST_CHANGE_IMPACT_AUDIT.md # Hồ sơ lịch sử thay đổi Area-first; không phải source of truth mới hơn FINAL
│   └── FINAL_CROSS_FILE_AUDIT.md         # Hồ sơ audit lịch sử; không được dùng để ghi đè các file FINAL/Addendum mới hơn
│
├── mockups/p5/                        # Bộ 9 mockup giao diện chuẩn hóa (M01 – M08, M06b)
│   ├── M01-home-overview.jpg
│   ├── M02-temperature-humidity.jpg
│   ├── M03-equipment-bm06.jpg
│   ├── M04-decontamination.jpg
│   ├── M05-approvals.jpg
│   ├── M06-reports.jpg
│   ├── M06b-modal-xuat-bieu-mau.jpg   # Modal xuất biểu mẫu (màn hình phụ M06)
│   ├── M07-notifications.jpg
│   └── M08-incidents.jpg
│
└── danh mục biểu mẫu/                 # Biểu mẫu gốc & phụ lục chuẩn hóa
    ├── BM.01_KNBM.docx
    ├── BM.01_QL.HTAT_TD nhiệt độ PXN.doc
    ├── BM.02.Bảng theo dõi - bảo dưỡng TTB.xls
    ├── BM.02.QL.HTAT.01_TD tủ lạnh mát.xls
    ├── BM.03.QL.HTAT.01_TD tủ lạnh đá.xls
    ├── BM.06. Nhật kí hoạt động TTB.docx
    └── Phụ lục.docx
```

---

## 2. Thứ tự đọc & triển khai

### Task P0–P4

Đọc theo thứ tự:

1. `00_PRODUCT_SCOPE_FINAL.md`
2. `02_FORMS_DATA_RULES_FINAL.md`
3. `01_ARCHITECTURE_FINAL.md`
4. `03_SCREEN_MENU_UIUX_FINAL.md`
5. `04_IMPLEMENTATION_PLAN_FINAL.md`

### Task P5 trở đi

Ngoài `00–04`, **bắt buộc** đọc thêm:

6. `05_P5_PRODUCT_UI_EXPANSION_FINAL.md`
7. `06_P5_MOCKUP_SYNC_P6_P9_FINAL.md`

File 05 là Owner-approved P5 scope expansion.

File 06 là quyết định mới nhất cho:

- cách diễn giải 6 mockup đã chốt;
- M01 Home đã bỏ block `Việc ưu tiên` và `Thao tác nhanh` để giảm rối;
- canonical mobile bottom navigation;
- các điểm không được copy từ dữ liệu/text minh họa của mockup;
- bổ sung regression/security/UAT/Production/handover cho P6–P9.

Nếu code P5+ mà agent không đọc 05 và 06 thì task **không đạt spec-review gate**.

### Raw source

Dùng `danh mục biểu mẫu/` để đối chiếu nguồn khi cần. Không tự suy ra business rule mới từ Word/Excel hoặc screenshot nếu FINAL/Addendum đã có quyết định mới hơn.

---

## 3. Thứ tự ưu tiên khi có xung đột

### Business/data/security lõi

1. Quyết định Owner mới nhất được ghi rõ trong FINAL/Addendum.
2. `00_PRODUCT_SCOPE_FINAL.md`
3. `02_FORMS_DATA_RULES_FINAL.md`
4. `01_ARCHITECTURE_FINAL.md`
5. `03_SCREEN_MENU_UIUX_FINAL.md`

### P5+

6. `05_P5_PRODUCT_UI_EXPANSION_FINAL.md` — scope expansion đã duyệt.
7. `06_P5_MOCKUP_SYNC_P6_P9_FINAL.md` — mockup contract và downstream gates mới nhất; tại các mục được ghi rõ, file 06 ưu tiên hơn presentation/sequencing cũ.
8. `04_IMPLEMENTATION_PLAN_FINAL.md` — dùng làm roadmap/sequencing nền; các câu cũ bị 05/06 ghi đè từ P5 trở đi không còn là blocker.
9. Audit/process artifacts chỉ để tham khảo lịch sử.

Ví dụ các mâu thuẫn đã được giải quyết:

- `04` lịch sử nói không có Incident trong MVP/P5 → từ P5, `05` đã mở rộng chính thức Incident Report.
- `04` cũ không test Notification/Announcement/Incident trong P6–P9 → `06` bổ sung gate tương ứng.
- Mockup M01 cũ từng có Priority Queue/Quick Actions → Owner đã chốt bản giản lược; `06` là quyết định hiện hành.

Nếu vẫn còn mâu thuẫn không được 05/06 giải quyết, AI coding agent phải dừng và hỏi Owner; không tự chọn phương án.

---

## 4. Quy tắc dùng mockup

Mockup là **visual reference**, không phải business source of truth.

- Được bám: màu sắc, khoảng trắng, typography, card hierarchy, icon style, information density.
- Không được copy mù: số liệu demo, tên máy giả, ngày/giờ, tên người, patient/sample workflow, logo bệnh viện tự tạo, chart không có dữ liệu thật.
- 25 máy, 13 dòng tủ, threshold/slot, approval authority, RLS, correction/audit luôn theo docs.
- Mọi KPI/count/chart phải lấy từ Supabase/query thật.

Bộ chín mockup đã chốt hiện tại (lưu tại `docs/mockups/p5/`):

- M01 Home (Tổng quan)
- M02 Nhiệt độ & Độ ẩm
- M03 Thiết bị / BM.06 (4 ca)
- M04 Khử nhiễm bề mặt
- M05 Trung tâm phê duyệt (Approval Center)
- M06 Báo cáo & Thống kê
- M06b Màn hình phụ xuất biểu mẫu (Preview & Export Modal của M06)
- M07 Trung tâm thông báo (Notification Center)
- M08 Quản lý & Báo cáo sự cố (Incidents)

Toàn bộ 9 mockup đã hoàn thiện và đồng bộ đầy đủ, chính thức đóng P5 visual design reference.

---

## 5. Lưu ý quản trị tài liệu

- Các file `_FINAL.md` và addendum 05/06 trong danh sách trên là Source of Truth cho phạm vi tương ứng.
- Không commit secret; mọi biến môi trường/credential để trong env phù hợp.
- Không hard-code dữ liệu demo chỉ để đạt giao diện giống ảnh tham chiếu.
- Không merge/deploy Production chỉ dựa vào screenshot; phải có Preview thật + test evidence + UAT gate tương ứng.
