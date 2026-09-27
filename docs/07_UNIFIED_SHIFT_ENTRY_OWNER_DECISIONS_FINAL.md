# 07_UNIFIED_SHIFT_ENTRY_OWNER_DECISIONS_FINAL

**Dự án:** Web app quản lý biểu mẫu nội bộ Khoa/Bộ môn Sinh hóa — SH103-Lab
**Trạng thái:** CANONICAL FINAL — Khóa toàn bộ các quyết định mới nhất của Owner (Owner Decisions)
**Phạm vi áp dụng:** Toàn bộ hệ thống SH103-Lab (Database, Backend, Business Rules, UI/UX, Navigation, Reports/Export)
**Thứ tự ưu tiên pháp lý/nghiệp vụ:** Đây là phụ lục quyết định tối cao bổ sung và chuẩn hóa cho `00_PRODUCT_SCOPE_FINAL.md`, `01_ARCHITECTURE_FINAL.md`, `02_FORMS_DATA_RULES_FINAL.md`, `03_SCREEN_MENU_UIUX_FINAL.md`, `04_IMPLEMENTATION_PLAN_FINAL.md`, `05_P5_PRODUCT_UI_EXPANSION_FINAL.md`, `06_P5_MOCKUP_SYNC_P6_P9_FINAL.md`.

---

# 1. Nguyên tắc tính bất biến của bằng chứng nguồn (Source Evidence Immutability)

1. **Bằng chứng nguồn là bất biến:**
   - Các file nguồn Word/Excel/CSV, các tài liệu trích xuất nguồn (`PHU_LUC_DANH_MUC_TTB_NHAN_SU.md`, `phu_luc_extracted.md`), và các báo cáo audit lịch sử (`FINAL_CROSS_FILE_AUDIT.md`, `AREA_FIRST_CHANGE_IMPACT_AUDIT.md`, `P5_COMPREHENSIVE_AUDIT_REPORT.md`) được giữ nguyên vẹn giá trị lịch sử để phục vụ truy vết.
   - Không sửa đổi nội dung lịch sử trong các file nguồn/audit cũ để ngụy tạo rằng nguồn cũ đã ghi khác.
2. **Quản lý phiên bản biểu mẫu theo vòng đời (Form Revision Life-cycle):**
   - Biểu mẫu cũ (như BM.01 v3.0 ban đầu gán 3 vị trí Sinh hóa, Miễn dịch, Kho) là bản ghi lịch sử `ARCHIVED` bất biến, không bị xóa và không bị đột biến dữ liệu.
   - Quyết định chuẩn hóa 5 khu vực BM.01 được ban hành dưới dạng **BM.01 Revision mới (v3.1)** có hiệu lực từ ngày áp dụng (Effective Date). Các kỳ lịch sử giữ nguyên version v3.0; các kỳ mới vận hành trên version v3.1.
   - BM.06 v4.0 được giữ nguyên làm historical source. Owner cho phép ban hành **BM.06 v4.1** làm source revision hiện hành, chuẩn hóa 4 khung giờ và 25 trang thiết bị mà không overwrite v4.0.

---

# 2. Quy tắc 5 Khu vực BM.01 và Vị trí phụ trợ Kho (BM.01 Exact 5 Areas & Auxiliary KHO)

1. **Chuẩn hóa đúng 5 Khu vực làm việc cho BM.01 (Sort Order 1–5):**
   - STT 1: `SINH_HOA` — `Khu vực làm xét nghiệm Sinh hóa` (ID: `13a3f466-6246-59b8-96ff-7627f1b09f31`)
   - STT 2: `MIEN_DICH` — `Khu vực làm xét nghiệm Miễn dịch` (ID: `db2b1268-6e37-5c22-92dd-020b09417cd9`)
   - STT 3: `NUOC_TIEU` — `Khu vực làm xét nghiệm Nước tiểu` (ID: `4ee41a8b-1394-536a-8f24-4739a01d0304`)
   - STT 4: `LY_TAM` — `Khu vực Ly tâm` (ID: `85f0d476-cbcd-5826-9a98-da1561c0f83b`)
   - STT 5: `NHAN_BENH_PHAM` — `Khu vực Nhận bệnh phẩm` (ID: `15be70ff-59eb-57bd-b93f-5702b07c8010`)
   - Tuyệt đối không tạo các mã vị trí tự bịa như `AUTOMATION`, `LOC_NUOC_RO` làm khu vực độc lập của BM.01.
2. **Vị trí phụ trợ Kho (`KHO`):**
   - `KHO` (`Kho hóa chất / Kho lưu mẫu`, Sort Order 6) là vị trí phụ trợ bên ngoài phạm vi đo môi trường BM.01 mới.
   - `KHO` dùng làm vị trí quản lý tài sản, tủ lưu trữ hóa chất/mẫu cho BM.02 (Tủ mát) và BM.03 (Tủ đông/đá).

---

# 3. Định danh Nhân sự, Danh mục Phụ lục và Tài khoản (User Identity & Staff Lifecycle)

1. **Khóa nhận diện nhân sự bằng `user_id` (Auth UUID) & STT Phụ lục:**
   - Không tạo hoặc sử dụng trường `staff_number`. Danh sách nhân sự hiển thị tuân thủ đúng **STT nguồn Phụ lục 1–25** dưới dạng source/display order metadata.
   - Mọi phân quyền, phân công ca trực (roster) và ghi nhận hành động đều gắn chặt vào `user_id` (Khóa ngoại tham chiếu `profiles.user_id`).
2. **Phân loại tài khoản (`account_kind`):**
   - `STAFF`: 25 nhân sự chính thức của Khoa Sinh hóa theo danh mục Phụ lục nguồn.
   - `SYSTEM`: Tài khoản hệ thống / Admin kỹ thuật (ví dụ: `Admin Sinh Hóa`).
   - `TEST`: Tài khoản phục vụ kiểm thử, bao gồm `TS.BS Vũ Văn Nam` (tài khoản test) và các fixture QA. Tài khoản `TEST` bị **loại trừ tuyệt đối (excluded)** khỏi bảng phân công ca trực (duty roster), báo cáo nhân sự vận hành thực tế và danh sách nhân sự chính thức.
3. **Vòng đời tài khoản & Phân quyền:**
   - Nếu tài khoản chưa có bất kỳ tham chiếu nghiệp vụ/audit/roster nào, backend có thể hard-delete sau khi reference check xác nhận an toàn. Nếu đã có tham chiếu: bắt buộc **Deactivate** (`active = false`), vô hiệu hóa scope/login và giữ nguyên identity lịch sử; tuyệt đối không cascade-delete records, approvals, audit log hoặc roster.
   - Quyền Admin (`is_admin = true`) là cờ quản trị kỹ thuật, hoàn toàn tách biệt với vai trò nghiệp vụ (`business_role`: `DEPARTMENT_HEAD | DOCTOR | TECHNICIAN`). `is_admin = true` không cấp quyền phê duyệt nghiệp vụ thay Trưởng khoa.

---

# 4. Quy tắc vận hành BM.06 (BM.06 Fixed Shifts, No Bulk/Default BT)

1. **Bốn khung giờ cố định và 25 trang thiết bị:**
   - `SHIFT_1`: `07:00–11:30`
   - `SHIFT_2`: `11:30–13:30`
   - `SHIFT_3`: `13:30–16:30`
   - `SHIFT_4`: `16:30–07:00 hôm sau`; dùng `business_date` của ngày bắt đầu ca.
   - Áp dụng đủ cho 25 thiết bị theo đúng thứ tự STT Phụ lục nguồn.
2. **Thời lượng sử dụng máy (Usage Duration):**
   - “Lượng sử dụng (Số giờ, số ca hoạt động)” được thể hiện hoàn toàn bằng mã ca và khung giờ cố định, **không có numeric input, không dùng `usage_unit` làm input và không gán mặc định `4.5`**. Các cột legacy `usage_value`/`usage_unit` nếu còn trong DB chỉ nullable để tương thích lịch sử.
3. **Tuyệt đối cấm nút điền hàng loạt mù quáng:**
   - Nghiêm cấm các tính năng tự động điền hàng loạt như "Đánh dấu tất cả BT", "Bulk All Normal".
   - Nhân viên trực ca phải chủ động xác nhận trạng thái thực tế của từng thiết bị (`BT` - Bình thường, `KSD` - Không sử dụng, `H` - Hỏng/Sự cố).

---

# 5. Bộ điều phối Phiên làm việc (Quick Duty Work-Session Orchestrator)

1. **Không tạo Super-Record / Super-Entity:**
   - `/quick-duty` (hoặc luồng Nhập nhanh theo phiên) là **Giao diện điều phối (Work-Session Orchestrator / Workspace)** gom các công việc trong ca trực, KHÔNG tạo bảng super-record gom gộp nhiều biểu mẫu vào một dòng dữ liệu thô.
   - Mỗi section nghiệp vụ (Nhiệt độ phòng BM.01, Tủ lạnh BM.02/BM.03, Khử nhiễm BM.01_KNBM, Nhật ký máy BM.06, Bảo dưỡng BM.02/QL.TRTB.01) lưu qua các RPC chuyên biệt tương ứng, ghi nhận độc lập vào `records` và các bảng chi tiết.
2. **Trải nghiệm giao diện linh hoạt (Inline / Accordion / Sheet):**
   - Trình bày công việc dạng Accordion / Tabs / Inline Section / Bottom Sheet tối ưu cho thiết bị di động, giúp KTV hoàn thành nhanh mọi nhiệm vụ trong phiên trực mà không cần chuyển qua lại nhiều màn hình rời rạc.
3. **Hợp nhất điều hướng (Route Consolidation):**
   - Loại bỏ route dư thừa `/general-tasks` khỏi luồng tác nghiệp chính. Các công việc nhiệt độ môi trường và tủ lạnh được tích hợp trực tiếp vào Phiên làm việc (`/quick-duty`) và màn hình chuyên biệt Nhiệt độ (`/temperature`). `/general-tasks` redirect 308 duy nhất về `/temperature`.

---

# 6. Bảng phân công ca trực (Duty Roster & Attribution Invariants)

1. **Cấu trúc ca trực:**
   - Ngày thường:
     - Trưa (`WEEKDAY_LUNCH`): 2 nhân sự (1 Bác sĩ/Trưởng khoa + 1 Kỹ thuật viên).
     - Chiều (`WEEKDAY_AFTERNOON`, 13:30–16:30): đúng 2 nhân sự STAFF hợp lệ bất kỳ; không bắt buộc 1 Bác sĩ + 1 Kỹ thuật viên.
     - Đêm (`WEEKDAY_NIGHT`): 2 nhân sự (1 Bác sĩ + 1 Kỹ thuật viên).
   - Ngày nghỉ / Lễ (`HOLIDAY_24H`): Trực 24 giờ (`07:00 → 07:00 hôm sau`) gồm 1 Bác sĩ + 1 Kỹ thuật viên.
2. **Phân định rõ Roster và Người nhập thực tế (`entered_by`):**
   - Phân công ca trực (Roster Assignment) xác định ai chịu trách nhiệm ca trực đó.
   - Bản ghi đo đạc/nhập liệu thực tế lưu chính xác `entered_by = auth.uid()` của người đang thao tác trên máy, đảm bảo tính giải trình (attribution & audit trail) tuyệt đối, không ghi đè người nhập bằng danh sách roster.

---

# 7. Source-of-Truth Precedence for P6+

`07_UNIFIED_SHIFT_ENTRY_OWNER_DECISIONS_FINAL.md` là **source-of-truth addendum ưu tiên cao nhất** cho P6 Unified Shift Entry và mọi phase sau có liên quan đến ca trực, nhập nhanh, BM.01/BM.06, điều hướng Calendar/Tasks, QA gate và performance.

Thứ tự ưu tiên khi có mâu thuẫn:

1. `07_UNIFIED_SHIFT_ENTRY_OWNER_DECISIONS_FINAL.md` — Owner Decisions mới nhất cho Unified Shift Entry.
2. Các quyết định Owner mới hơn được ghi thành addendum sau này.
3. `00_PRODUCT_SCOPE_FINAL.md`.
4. `02_FORMS_DATA_RULES_FINAL.md`.
5. `01_ARCHITECTURE_FINAL.md`.
6. `03_SCREEN_MENU_UIUX_FINAL.md`.
7. `05_P5_PRODUCT_UI_EXPANSION_FINAL.md` và `06_P5_MOCKUP_SYNC_P6_P9_FINAL.md` trong phạm vi visual/mockup/P5 expansion.
8. `04_IMPLEMENTATION_PLAN_FINAL.md` chỉ còn là roadmap/sequencing nền; mọi câu cũ trái với 07 không còn là blocker.
9. Audit/process artifacts (`AREA_FIRST_CHANGE_IMPACT_AUDIT.md`, `FINAL_CROSS_FILE_AUDIT.md`, `p5_comprehensive_audit_report.md`) chỉ là lịch sử đối chiếu, không ghi đè 07.

# 8. BM.06 v4.1 Current Revision — 25 Device Columns, Source Order 1–25

BM.06 v4.1 là biểu mẫu hiện hành cho Nhật ký hoạt động trang thiết bị. BM.06 v4.0 được giữ nguyên làm historical source, không overwrite/xóa.

BM.06 v4.1 bắt buộc:

1. Có đủ **25 cột/dòng thiết bị** theo đúng `source_order` Phụ lục **1–25**; không còn trạng thái kế hoạch `14 + 11 OPEN ITEM`.
2. Mapping khu vực đã khóa: Sinh hóa 9 máy, Miễn dịch 8 máy, Nước tiểu 4 máy, Ly tâm 4 máy, Nhận bệnh phẩm 0 máy.
3. Mỗi ngày có 4 ca cố định: `SHIFT_1` 07:00–11:30, `SHIFT_2` 11:30–13:30, `SHIFT_3` 13:30–16:30, `SHIFT_4` 16:30–07:00 hôm sau theo `business_date` ngày bắt đầu ca.
4. Trạng thái thiết bị chỉ dùng `BT | KSD | H`; không dùng N/A thay thế `KSD` hoặc `H`.
5. “Lượng sử dụng” được suy ra từ ca/khung giờ; không có numeric usage input, không default `4.5`, không bulk/default `BT`.
6. Draft được phép lưu khi chưa đủ 25/25; Completed/Final chỉ khi đủ 25/25 thiết bị đã có trạng thái hợp lệ.

# 9. Calendar/Tasks Legacy Routing — Not Primary Entry Workflow

Từ P6 Unified Shift Entry:

1. `/quick-duty` là Phiên làm việc / Nhập nhanh chính cho KTV.
2. `/equipment` là màn hình thiết bị có lồng ghép nhập BM.06 SHIFT_1–SHIFT_4 dưới danh sách thiết bị.
3. `/temperature` là màn hình chuyên biệt nhiệt độ/độ ẩm; danh sách điểm đo phía dưới là read-only, nhập qua nút `Nhập số liệu`.
4. `/approvals` là màn hình phê duyệt đơn giản một nơi.
5. `/calendar` và `/tasks` **không còn là workflow nhập chính**. Nếu còn route thì chỉ để legacy redirect/backward compatibility cho saved links; không expose như CTA/menu nghiệp vụ chính.

# 10. P6 Additional Gates Before Refactor/Implementation

Không bắt đầu refactor/code P6 tiếp theo cho đến khi Owner duyệt roadmap/canonical docs mới.

P6 bổ sung các gate bắt buộc:

## 10.1. Codebase Cleanup & Simplification Gate

- Audit route/component trùng vai trò trước khi refactor.
- Cắt/gộp màn hình và CTA nghiệp vụ dư thừa để KTV không phải chuyển nhiều màn hình.
- Không xóa route legacy nếu có saved links; route legacy phải redirect rõ về màn hình chính.
- Không gọi là “đã tối ưu” nếu chưa có BEFORE/AFTER measurable evidence.

## 10.2. End-to-End Gate bắt buộc

E2E phải có flow thực tế tối thiểu:

`Home → Phiên làm việc (/quick-duty) → roster tự nhận kíp từ danh sách nhân sự chính thức → nhập biểu mẫu → save → refresh → trạng thái đúng → export đúng`

Phải đọc lại dữ liệu server/database hoặc export parse được; không chỉ dựa vào toast/UI tạm.

## 10.3. Mutation State Gate

Mọi form quan trọng phải thể hiện và test rõ các trạng thái:

- `Draft`: lưu nháp/partial, không ngụy tạo completed.
- `Saving`: đang gửi server, chống double-submit.
- `Saved`: server xác nhận thành công và refresh/read-back đúng.
- `Error`: lỗi validation/permission/conflict/server, không báo đã lưu.
- `Completed`: chỉ khi đủ điều kiện hoàn tất nghiệp vụ của form/kỳ/ca.

## 10.4. Performance Gate

P6 phải có metrics đo được, tối thiểu:

- BEFORE baseline trước thay đổi.
- AFTER sau thay đổi.
- Cùng route, cùng viewport/device profile, cùng môi trường đo.
- Ghi rõ TTFB, DOMContentLoaded, LCP hoặc chỉ số tương đương, request count/JS size nếu có.
- Không claim “tối ưu” nếu không có số đo BEFORE/AFTER.
