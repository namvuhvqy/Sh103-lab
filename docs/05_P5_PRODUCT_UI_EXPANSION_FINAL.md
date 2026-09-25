# 05_P5_PRODUCT_UI_EXPANSION_FINAL

**Dự án:** SH103-Lab — Khoa/Bộ môn Sinh hóa  
**Trạng thái:** FINAL ADDENDUM cho P5, do Owner phê duyệt mở rộng phạm vi  
**Áp dụng:** Từ Phase 5 trở đi  
**Không thay đổi:** P1–P4 đã chốt về Auth/RLS, Area-first, 3 business roles, Admin flag, 6 Core Pilot forms, one-step approval của Trưởng khoa, correction/audit, 25 máy, 13 dòng tủ.

> Mục tiêu của addendum này là nâng SH103-Lab từ “app nhập biểu mẫu đúng nghiệp vụ” thành một sản phẩm vận hành hằng ngày có chất lượng UI/UX cao, trực quan hơn mẫu tham chiếu hiện có, nhưng không hy sinh tính đúng dữ liệu, RLS, audit và các rule đã khóa.

---

# 1. Nguyên tắc thiết kế P5

1. **Data-first, không hard-code số liệu nghiệp vụ vào UI.** Mọi count/progress/status phải đến từ Supabase/query thật.
2. **Mobile-first cho KTV/Bác sĩ; tablet/desktop cho review/report/admin.**
3. **Một màn hình phải trả lời ngay 3 câu:** Tôi cần làm gì? Còn bao nhiêu? Có gì bất thường?
4. **Không dùng màu đơn độc để truyền trạng thái.** Luôn có text/icon.
5. **Không sao chép mù quáng app tham chiếu.** Dùng tinh thần hiện đại/teal/white/card-based nhưng giữ đúng SH103-Lab: 25 máy, 5 work areas, 13 dòng tủ, 3 role, Head-only approval.
6. **Không làm đẹp bằng dữ liệu giả.** Preview/UAT phải chạy với remote Supabase thật.
7. **Ảnh/banner chỉ dùng như visual support.** Không được làm giảm khả năng đọc, không dùng ảnh decorative nặng, không phụ thuộc CDN ngoài nếu không cần.
8. **Mọi workflow mới phải có loading/empty/error/success/conflict state và test mobile 360/390.**

---

# 2. Visual system P5

## 2.1. Brand direction

Phong cách: **Clinical modern / ISO-quality / teal + white**, sạch, có chiều sâu nhẹ, không phô trương.

- Primary: teal/cyan đậm cho action chính và trạng thái vận hành tốt.
- Secondary: blue cho navigation/information.
- Success: emerald.
- Warning: amber.
- Danger: red.
- Neutral: zinc/slate.
- Background: trắng + nền xám/xanh rất nhạt.

## 2.2. Thành phần chuẩn hóa

Phải tạo/reuse design primitives:

- `HeroStatusCard`
- `OperationalBanner`
- `KpiChip/KpiCard`
- `StatusBadge`
- `ModuleCard`
- `QuickActionButton`
- `SegmentedControl`
- `StickyActionBar`
- `NotificationBadge`
- `EmptyState`
- `InlineError`
- `Skeleton`
- `ConfirmDialog`
- `FilterSheet`

Không copy CSS riêng lẻ cho từng screen nếu có thể dùng component/token chung.

## 2.3. Typography & density

- Font ưu tiên: Inter/system sans.
- Body mobile: 15–16px.
- Secondary: 13–14px.
- Touch target >=44px.
- Card radius nhất quán 16–24px.
- Spacing scale: 4/8/12/16/24/32.

---

# 3. Home / Tổng quan — nâng cấp bắt buộc

Home P5 phải tốt hơn layout tham chiếu ở chỗ **ít rối hơn, dữ liệu thật hơn, điều hướng theo vai trò rõ hơn**.

## 3.1. Header

Hiển thị:

- `BV Quân y 103 · Khoa Sinh hóa`
- Ca hiện tại theo giờ thật
- Avatar/tài khoản
- Bell notification với unread count

## 3.2. Operational banner

Một banner động nằm trên hero, chỉ hiện khi có thông tin cần xử lý:

Ví dụ:

- `Đến giờ đo nhiệt độ ca sáng — còn 2 điểm chưa ghi`
- `BM.06 ca hiện tại còn 4/25 máy chưa ghi trạng thái`
- `1 máy đang H — cần kiểm tra`
- `2 kỳ bị Trưởng khoa trả lại`

CTA phải dẫn thẳng đến đúng workflow.

Không được tự sinh cảnh báo giả; count phải query thật.

## 3.3. Hero tổng quan

Hiển thị tối đa 4 KPI chính:

- Nhiệt độ/độ ẩm
- BM.06 thiết bị ca hiện tại
- Khử nhiễm
- Bảo dưỡng

Mỗi KPI có dạng `đã làm / tổng` hoặc status nghiệp vụ phù hợp.

## 3.4. Area-first cards

Giữ 5 khu vực:

- Sinh hóa — 9 máy
- Miễn dịch — 8 máy
- Nước tiểu — 4 máy
- Ly tâm — 4 máy
- Nhận bệnh phẩm — 0 máy, chỉ khử nhiễm

Mỗi card lấy dữ liệu thật:

- số máy BT/KSD/H hiện tại;
- công việc còn thiếu;
- trạng thái khử nhiễm;
- CTA vào khu vực.

## 3.5. Role-specific section

- Trưởng khoa: chờ duyệt, abnormal, máy H, kỳ Returned.
- Admin: quản trị users/master/templates/announcement/audit.
- KTV/Bác sĩ: việc trong scope của mình.

---

# 4. Nhiệt độ & Độ ẩm — màn hình vận hành P5

Route nền hiện tại có thể giữ, nhưng UX phải nâng cấp thành một màn hình chuyên biệt thay vì chỉ danh sách task.

## 4.1. Cấu trúc

1. Header + ca hiện tại.
2. Operational banner: `Đến giờ đo ...` nếu tới khung giờ.
3. Hero module card: `Theo dõi Nhiệt độ & Độ ẩm`.
4. Segmented tabs:
   - `Phiếu ca hiện tại`
   - `Lịch sử ca trước`
5. Sub-tabs:
   - `Môi trường PXN`
   - `Tủ lạnh / Tủ đá`
6. Summary:
   - số điểm đã ghi / tổng;
   - ca sáng/chiều;
   - tiêu chuẩn áp dụng.
7. Card từng điểm đo.

## 4.2. Môi trường PXN

Chỉ dùng master data đã khóa hiện tại. Không copy số điểm từ app tham chiếu nếu khác SH103-Lab.

Mỗi card:

- mã/điểm đo;
- tên vị trí;
- nhiệt độ;
- độ ẩm;
- threshold snapshot;
- badge `Đạt chuẩn / Bất thường / Chưa đo`;
- performed_at;
- người ghi;
- CTA `Ghi số đo` hoặc `Xem chi tiết`.

## 4.3. Tủ lạnh / Tủ đá

Hiển thị đủ 13 dòng tủ/ngăn đã seed, không merge mã trùng.

- Tủ mát: 2–8°C.
- Tủ đông: -30 đến -10°C.
- phân biệt TU 03/TU 06/TU 07 theo ngăn.

## 4.4. Quy tắc an toàn UX

- Không có `Reset ca đo` để xóa hàng loạt dữ liệu đã commit.
- Không có “Ghi nhanh toàn ca” tự điền số liệu giả/default.
- Nếu hỗ trợ batch entry, user phải nhập/xác nhận từng giá trị trước commit.
- `Thêm vị trí` chỉ Admin, không phải KTV/Bác sĩ.

---

# 5. Notification Center — chức năng mới P5

## 5.1. Mục tiêu

Biến icon Bell hiện tại thành chức năng thật.

Route đề xuất: `/notifications`

## 5.2. Notification types MVP

- Việc đến giờ / sắp đến giờ.
- Việc còn thiếu quá slot/ngày.
- Nhiệt độ/độ ẩm abnormal.
- BM.06 có máy `H`.
- Kỳ được `RETURNED`.
- Kỳ `READY_FOR_REVIEW` dành cho Trưởng khoa.
- Kỳ đã `APPROVED`.
- Admin Announcement.

## 5.3. Data model tối thiểu

`notifications`

- id
- recipient_user_id nullable
- recipient_role nullable
- recipient_location_id nullable
- kind
- title
- body
- severity (`INFO | SUCCESS | WARNING | CRITICAL`)
- target_url nullable
- created_at
- read_at nullable
- expires_at nullable
- source_type nullable
- source_id nullable

Không tạo duplicate notification vô hạn cho cùng một source; cần idempotency key hoặc unique rule phù hợp.

## 5.4. Bell UX

- badge unread count;
- list mới nhất;
- filter `Tất cả | Chưa đọc | Quan trọng`;
- mark as read;
- `Đánh dấu tất cả đã đọc`;
- click notification đi đúng target.

Không dùng browser push/external push làm điều kiện P5 PASS. In-app là bắt buộc; Web Push có thể backlog sau.

---

# 6. Admin Announcement — chức năng mới P5

Route đề xuất:

- User: `/announcements` hoặc tích hợp trong `/notifications`.
- Admin: `/admin/announcements`.

Admin có thể tạo thông báo:

- Toàn khoa.
- Theo role.
- Theo khu vực.
- Theo user cụ thể nếu cần.

Fields:

- title
- body
- audience_type
- audience_ref nullable
- severity
- publish_at
- expires_at nullable
- created_by
- created_at
- active

Rule:

- Chỉ `is_admin=true` được tạo/chỉnh/ẩn announcement.
- Announcement không cấp quyền nghiệp vụ và không thay đổi approval authority.
- Lưu audit khi publish/update/deactivate.

---

# 7. Báo cáo sự cố — scope expansion chính thức từ P5

Các file FINAL cũ loại Incident khỏi Core Pilot P0–P4. Từ P5, Owner đã quyết định bổ sung **Biểu mẫu Báo cáo sự cố** như một module mới. Đây là thay đổi phạm vi có chủ đích, không phải bugfix của 6 form cũ.

## 7.1. Mục tiêu

Cho nhân viên ghi nhận một sự cố liên quan vận hành khoa mà không biến mọi trạng thái `H`, abnormal hoặc spill thành incident tự động.

Incident được tạo **chủ động** bởi người dùng có quyền.

## 7.2. Không tự động hóa sai nghiệp vụ

- BM.06 `H` != Incident tự động.
- Measurement abnormal != Incident tự động.
- Spill trong KNBM != Incident tự động.

UI có thể hiện CTA `Tạo báo cáo sự cố` từ các context trên, nhưng user phải xác nhận tạo.

## 7.3. Fields MVP

- incident_code server-generated
- business_date
- occurred_at
- reported_at server-generated
- reporter_user_id
- location_id nullable
- asset_id nullable
- category
- severity
- title
- description
- immediate_action nullable
- status (`OPEN | IN_REVIEW | RESOLVED | CLOSED`)
- resolved_at nullable
- resolved_by nullable
- resolution_note nullable
- linked_record_id nullable

Không có patient-identifying data.
Không có attachment trong P5 trừ khi Owner duyệt scope mới riêng.

## 7.4. Category ban đầu

Chỉ tạo danh mục tối thiểu, có thể cấu hình Admin:

- Thiết bị
- Môi trường
- An toàn / tràn đổ
- Quy trình
- Khác

Không hard-code danh mục mở rộng nếu khoa chưa xác nhận.

## 7.5. Permission

- KTV/Bác sĩ: tạo và xem incident trong scope.
- Trưởng khoa: xem toàn khoa, review, resolve/close theo policy được implement.
- Admin: quản trị category/config nhưng không vì Admin mà được quyền chuyên môn thay Trưởng khoa.

## 7.6. Screens

- `/incidents` — danh sách/filter.
- `/incidents/new` — tạo mới.
- `/incidents/:id` — chi tiết/timeline.
- Có quick CTA từ BM.06 H / abnormal / KNBM spill.

## 7.7. Audit

Append-only audit cho:

- create
- status change
- edit trước khi closed theo rule
- resolve
- close
- reopen nếu sau này cho phép

---

# 8. Khử nhiễm bề mặt — nâng cấp UX, không tạo form trùng

BM.01_KNBM đã tồn tại từ P3. P5 chỉ nâng cấp presentation/workflow.

## 8.1. Screen

Hiển thị:

- khu vực;
- ngày;
- Daily;
- Weekly;
- Spill event;
- ghi chú;
- người thực hiện;
- trạng thái hôm nay;
- lịch sử gần nhất.

## 8.2. Nhận bệnh phẩm

Khu `NHAN_BENH_PHAM` vẫn:

- 0 máy;
- chỉ workflow khử nhiễm bề mặt;
- không hiển thị tab BM.06/Bảo dưỡng/Thiết bị.

## 8.3. Nếu Spill=true

Sau save có thể hiện CTA:

`Tạo báo cáo sự cố từ lần tràn đổ này`

Không auto-create incident.

---

# 9. Approval Center — nâng cấp presentation P4 trong P5

P4 business workflow giữ nguyên. P5 nâng UI:

- search;
- tabs `Chờ duyệt | Đã duyệt | Đã trả lại | Tất cả`;
- summary count;
- exception chips: abnormal / N/A / H / pending;
- drill-down;
- responsive mobile/tablet/desktop.

Chỉ Trưởng khoa approve.
Admin-only không được approve.

---

# 10. Export / Report Center P5

Route đề xuất: `/reports`

Flow:

1. Chọn kỳ/ngày/tháng/ca.
2. Chọn loại biểu mẫu.
3. Preview dữ liệu thật.
4. Export.

Bắt buộc:

- PDF
- Excel hoặc CSV tùy implementation hiện tại

Word `.docx` là optional, không chặn P5 PASS nếu PDF/Excel đúng và đủ nghiệp vụ.

Preview phải lấy record thật và hiển thị version/template/period metadata.

Không fake chữ ký số. Chỉ hiển thị electronic approval metadata đã có.

---

# 11. Bottom Navigation P5

Mobile bottom nav đề xuất giữ 5 mục, nhưng tối ưu cho tần suất sử dụng:

1. Tổng quan
2. Hôm nay / Nhiệt độ (quyết định final theo usability test)
3. Thiết bị
4. Khử nhiễm hoặc Khu vực
5. Tiện ích

`Tiện ích` chứa:

- Notifications
- Incidents
- Periods
- Calendar
- Reports
- Account
- Admin menu nếu có quyền

Không hard-code menu theo hình tham chiếu nếu xung đột Area-first flow.

---

# 12. Images / banners

Cho phép dùng:

- abstract laboratory illustration nhẹ;
- icon thiết bị/vector;
- subtle gradient/quality banner;
- logo/brand asset được khoa phê duyệt.

Không dùng ảnh bệnh nhân.
Không dùng stock photo watermark.
Không đưa ảnh quá nặng làm chậm PWA.
Không tự tạo hoặc gắn logo chính thức của bệnh viện nếu chưa có asset được Owner cung cấp.

---

# 13. Dashboard P5

KPI tối thiểu:

- Việc hôm nay còn thiếu
- Completion rate
- Abnormal measurements
- BM.06 H count
- Maintenance pending
- Decontamination pending
- Ready-for-review count
- Returned count
- Open incidents
- Unread announcements/notifications

Mỗi KPI phải drill-down được tới list/filter liên quan.

---

# 14. P5 routes mới / nâng cấp

Mới:

- `/notifications`
- `/incidents`
- `/incidents/new`
- `/incidents/:id`
- `/admin/announcements`
- `/reports`

Nâng cấp:

- `/`
- `/general-tasks`
- `/areas/:areaCode/knbm`
- `/approvals`
- `/periods/:periodId/review`
- `/dashboard`
- `/more`

---

# 15. QA bắt buộc P5

P5 không được PASS chỉ vì unit tests xanh.

## 15.1. Automated

- lint
- typecheck
- unit
- DB/pgTAP
- RLS tests
- Playwright authenticated Preview
- no broken internal links
- no route 404
- no server 5xx
- notification idempotency
- incident permission tests

## 15.2. Visual / browser QA

Bắt buộc screenshot/browser review ở:

- 390px mobile
- tablet
- desktop

Ít nhất các screen:

- Home
- Nhiệt độ & Độ ẩm
- Area Detail
- BM.06
- Khử nhiễm
- Notification Center
- Incident list/new/detail
- Approval Center
- Report/Export

Kiểm:

- không overflow;
- bottom nav không che CTA;
- sticky actions đúng;
- keyboard mobile không phá layout;
- màu/status dễ đọc;
- text tiếng Việt không bị cắt;
- loading/empty/error có thiết kế.

## 15.3. Preview thật

QA phải chạy trên Vercel Preview nối Supabase remote đúng project, không chỉ localhost.

---

# 16. Exit Gate P5

P5 chỉ PASS khi:

- [ ] Visual system nhất quán toàn app.
- [ ] Home có operational banner và KPI từ dữ liệu thật.
- [ ] Nhiệt độ/độ ẩm có màn hình chuyên biệt, không chỉ TaskList thô.
- [ ] Bell hoạt động như Notification Center thật.
- [ ] Admin Announcement hoạt động đúng RLS/audit.
- [ ] Incident Report CRUD/workflow MVP hoạt động và không chứa dữ liệu bệnh nhân.
- [ ] KNBM được polish, không tạo form trùng.
- [ ] Approval Center presentation hoàn chỉnh, business rule P4 không đổi.
- [ ] Report Center preview + PDF/Excel hoạt động.
- [ ] Dashboard có drill-down.
- [ ] 390px visual QA PASS.
- [ ] Preview remote E2E PASS.
- [ ] Không có 404/5xx đã biết trên flow chính.
- [ ] Không scope creep sang LIS/HIS, patient data, chemical inventory, procurement, finance.

---

# 17. P6 boundary

P6 vẫn là **hardening/QA/security/release-readiness**. Không chuyển các feature P5 chưa hoàn thành sang P6 rồi gọi P5 PASS.

P6 tập trung:

- security review;
- RLS adversarial tests;
- performance;
- accessibility audit;
- backup/restore evidence;
- PWA/offline behavior;
- regression suite;
- release gate.

---

# 18. Quy tắc cho AI coding agent

Khi Hermes/Codex triển khai P5:

1. Đọc `00–04 FINAL` trước, sau đó đọc file này.
2. File này là **Owner-approved P5 addendum**. Với các điểm được ghi rõ là scope expansion P5 (Incident, Notification Center, Admin Announcement, UI polish), file này bổ sung/ghi đè giới hạn cũ chỉ từ P5 trở đi.
3. Không sửa P1–P4 historical behavior để “khớp UI mới”.
4. Không tự thêm field/category/role/workflow nghiệp vụ ngoài tài liệu.
5. Nếu xung đột không được file này giải thích rõ, dừng và hỏi Owner.
6. Không hard-code demo data để đạt screenshot giống reference.
7. Không merge hoặc deploy Production nếu Owner chưa review Preview.

---

# 19. Design target

Mục tiêu P5 không phải “giống app tham chiếu”. Mục tiêu là:

**Nhanh hơn khi thao tác + ít bước hơn + dữ liệu thật hơn + cảnh báo rõ hơn + đúng quyền hơn + dễ audit hơn + giao diện hiện đại hơn.**

Reference visual chỉ dùng để định hướng về độ hoàn thiện; SH103-Lab phải giữ đúng nghiệp vụ riêng của khoa.
