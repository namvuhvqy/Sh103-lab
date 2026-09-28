# Unified Shift Entry — Final Implementation Plan

> **For Hermes:** Implement only after explicit Owner approval. Use test-driven-development and subagent-driven-development task-by-task, with spec-compliance and code-quality review after each phase.

**Goal:** Đồng bộ Source of Truth và triển khai luồng “Phiên làm việc / Nhập nhanh” cho 6 biểu mẫu, roster, attribution, Admin account management, reports/export và performance mà không tạo super-record, không thay đổi P1–P4 business rules ngoài các Owner Decisions đã khóa.

**Architecture:** Giữ nguyên chuỗi `form_template_versions → register_periods → schedule_occurrences → records → detail tables`. `/quick-duty` chỉ là orchestration workspace; mỗi section lưu qua RPC riêng. Roster là assignment độc lập, không thay `records.entered_by`. Business rules phải được enforce server-side/RLS/RPC.

**Tech Stack:** Next.js 16.3.6 App Router, React 19, TypeScript, Supabase Auth/Postgres/RLS/RPC, Supabase Edge Functions cho Auth Admin API, Vitest, pgTAP, Playwright, Vercel Preview.

---

## 0. Safety gate và branch topology

- Current branch: `feat/unified-shift-entry`.
- Current HEAD: `34912c0875dd93364daa4d8ab127a16d9070c5a6`.
- Working tree trước plan: sạch; product diff sau `34912c0`: 0.
- Production `master`: `d32f6116f85cae80d7757a67c8dbedf51aee1c2f`.
- PR #6 giữ nguyên `master ← fix/p5-stabilization`, Draft/Open, head `34912c0`.
- Feature branch được tạo trên commit của PR #6. Vì vậy:
  1. Sau Owner approval, commit docs đầu tiên trên `feat/unified-shift-entry`.
  2. Push branch này.
  3. Nếu mở feature PR khi #6 chưa merge: tạo **stacked Draft PR** với base `fix/p5-stabilization`, không base `master`.
  4. Khi #6 merge, đổi base feature PR sang `master`; xác minh diff chỉ còn feature commits.
  5. Nếu #6 bị đóng/reject: tạo branch sạch từ `master` và cherry-pick riêng các feature commits; không kéo stabilization vào feature PR.
- Không merge hoặc deploy Production nếu chưa có Owner approval riêng.

---

## 1. Exact 5 BM.01 work areas và vai trò KHO — Owner-locked

Tập chính xác là đúng 5 khu vực làm việc (work areas) active có `sort_order` 1–5 trong master data cho BM.01 theo Owner Decision. `KHO` tiếp tục được giữ nguyên vẹn trong master catalog `locations` với vai trò là khu vực phụ trợ (auxiliary location) phục vụ BM.02/BM.03 và lưu trữ; tuyệt đối không xóa master record `KHO`.

| STT | ID | Code | Name trong master | Phạm vi BM.01 | Vai trò hệ thống |
|---:|---|---|---|---|---|
| 1 | `13a3f466-6246-59b8-96ff-7627f1b09f31` | `SINH_HOA` | `Khu vực làm xét nghiệm Sinh hóa` | Có (v3.1) | Main Work Area |
| 2 | `db2b1268-6e37-5c22-92dd-020b09417cd9` | `MIEN_DICH` | `Khu vực làm xét nghiệm Miễn dịch` | Có (v3.1) | Main Work Area |
| 3 | `4ee41a8b-1394-536a-8f24-4739a01d0304` | `NUOC_TIEU` | `Khu vực làm xét nghiệm Nước tiểu` | Có (v3.1) | Main Work Area |
| 4 | `85f0d476-cbcd-5826-9a98-da1561c0f83b` | `LY_TAM` | `Khu vực Ly tâm` | Có (v3.1) | Main Work Area |
| 5 | `15be70ff-59eb-57bd-b93f-5702b07c8010` | `NHAN_BENH_PHAM` | `Khu vực Nhận bệnh phẩm` | Có (v3.1) | Main Work Area |
| 6 | *(master preserved)* | `KHO` | `Kho` | Không (loại khỏi v3.1) | Auxiliary Location (BM.02/03 & Storage) |

Không tạo `AUTOMATION`, `LOC_NUOC_RO` hoặc khu vực thứ 6 cho BM.01. Không đổi các name trên. Không xóa location `KHO` khỏi DB master.

### Hiện trạng cần chuyển đổi

- Published BM.01 version `a29f37e6-d2ef-56ba-9906-af5a48056104` (v3.0) hiện map 3 location: `SINH_HOA`, `MIEN_DICH`, `KHO`.
- Phụ lục nguồn và `docs/02_FORMS_DATA_RULES_FINAL.md` đang mô tả 3 điểm: Sinh hóa, Miễn dịch, Kho.
- `src/constants/areas.ts` mô tả 5 điểm khác: `NUOC_TIEU`, `SINH_HOA`, `MIEN_DICH`, `AUTOMATION`, `LOC_NUOC_RO`.
- Live monitoring assignments mới có `NAKĐT-01` cho Sinh hóa và `NAKĐT-02` cho Miễn dịch. Ba work area mới chưa có monitoring assignment được kiểm chứng.
- Không invent mã thiết bị. `measurement_details.monitoring_device_id` hiện nullable; trong thời gian chưa có master assignment, lưu measurement hợp lệ với `NULL` và UI hiển thị “Chưa gán thiết bị theo dõi”, không fabricate code.

---

## 2. Canonical documentation & source version sync — implementation phase 1

### Nguyên tắc quản lý phiên bản tài liệu và nguồn (Precedence Rule)

1. **Source Version Mới (v4.1) Precedes Canonical Docs:** Khi tạo version mới (như BM.06 v4.1 hoặc BM.01 v3.1), đặc tả source version mới cùng Owner Clarification có hiệu lực ưu tiên cao nhất, đứng trước canonical docs cũ.
2. **Canonical Docs được đồng bộ theo Source Version Mới:** Toàn bộ canonical docs (00 đến 07) được cập nhật nhất quán theo các quyết định mới.
3. **Historical/Source Docs giữ nguyên giá trị lịch sử:** Các file audit/trích xuất lịch sử được đánh dấu rõ là bằng chứng lịch sử (historical/reference evidence), không sửa đổi hồi tố làm sai lệch dữ kiện gốc.

### Canonical docs phải sửa

1. `docs/README.md`
   - Ghi rõ precedence của Source version mới và Owner Decision addendum.
   - Phân loại audit reports và source extracts là historical/reference, không phải canonical current rule.
2. `docs/00_PRODUCT_SCOPE_FINAL.md`
   - BM.01 = đúng 5 work areas ở §1; KHO giữ vai trò auxiliary location cho BM02/03.
   - Workflow chính Home → Phiên làm việc, không chọn form trước.
   - Roster ngày thường/nghỉ/lễ và account lifecycle.
   - BM.06: v4.0 là historical, áp dụng v4.1 hiện hành; thời lượng sử dụng định danh thuần túy qua khung giờ/ca trực cố định (fixed shift/time window); không có numeric usage input.
3. `docs/01_ARCHITECTURE_FINAL.md`
   - Work-session orchestration không super-record.
   - Roster schema/invariants.
   - Identity: Dùng `user_id` làm identity duy nhất; STT Phụ lục chỉ là `source_order`/`display_order` metadata (không gọi `staff_number`).
   - Profile classification, deactivation, Auth Admin boundary.
   - Effective revision attribution.
4. `docs/02_FORMS_DATA_RULES_FINAL.md`
   - Thay rule BM.01 3 location bằng Owner Decision 5 work areas (v3.1); KHO là auxiliary.
   - Ghi rõ đây là change mới, không rewrite lịch sử nguồn.
   - BM.06: Chuyển v4.0 thành historical reference, ban hành BM.06 v4.1 hiện hành:
     - 4 ca cố định: Ca 1 (`07:00–11:30`), Ca 2 (`11:30–13:30`), Ca 3 (`13:30–16:30`), Ca 4 (`16:30–07:00` hôm sau).
     - Thời lượng sử dụng (quantity of use) được đại diện độc quyền thông qua khung giờ ca làm việc (fixed shift/time window).
     - UI hoàn toàn KHÔNG có ô nhập numeric usage value hay đơn vị giờ/phút.
     - DB `equipment_shift_details.usage_value` và `usage_unit` để nullable chỉ nhằm mục đích backward-compatibility dữ liệu lịch sử.
     - 25 máy nhập tường minh theo source order 1–25, không bulk/default.
   - Roster ≠ `entered_by`.
5. `docs/03_SCREEN_MENU_UIUX_FINAL.md`
   - Luồng Phiên làm việc, inline sections, deep links, route disposition.
   - Temperature 5 BM.01 work areas + 9 cool + 4 freezer.
   - BM.06 UI: chỉ chọn trạng thái máy (BT / KSD / H) và ghi chú nếu có; không có input số giờ sử dụng.
   - Staff picker dùng `user_id` identity, hiển thị theo STT Phụ lục (`source_order` / `display_order`), no free text.
6. `docs/04_IMPLEMENTATION_PLAN_FINAL.md`
   - Thay phase plan cũ bằng/phụ lục hóa plan này, commit sequence và test gates.
7. `docs/05_P5_PRODUCT_UI_EXPANSION_FINAL.md`
   - Chốt unified entry, route consolidation và fake-data ban.
8. `docs/06_P5_MOCKUP_SYNC_P6_P9_FINAL.md`
   - Ghi mockup chỉ là visual reference; data/count/roster lấy từ query thật.
9. Tạo `docs/07_UNIFIED_SHIFT_ENTRY_OWNER_DECISIONS_FINAL.md`
   - Chép chính xác Owner Decisions đã khóa, effective date, exact work area IDs/codes/names, BM.06 v4.1 rules, identity design, precedence.

### Historical/source docs không sửa nội dung lịch sử

- `docs/PHU_LUC_DANH_MUC_TTB_NHAN_SU.md`
- `docs/Phu_luc.docx`
- `docs/phu_luc_extracted.md`
- `docs/FINAL_CROSS_FILE_AUDIT.md`
- `docs/AREA_FIRST_CHANGE_IMPACT_AUDIT.md`
- `docs/P5_COMPREHENSIVE_AUDIT_REPORT.md`
- `docs/p5_comprehensive_audit_report.md`
- Original Word/CSV/XLS/XLSX form files (trong đó BM.06 v4.0 được lưu trữ như historical source).

Chúng được README đánh dấu historical/source evidence; không chỉnh để giả rằng nguồn cũ vốn đã ghi 5 work areas hay v4.1 rules.

### Docs-first verification

1. Chạy cross-file search, không còn canonical statement “BM.01 = 3 khu” hoặc yêu cầu nhập số giờ sử dụng cho BM.06 hiện hành.
2. Commit riêng: `docs(p5): lock unified workflow owner decisions`
3. Push `feat/unified-shift-entry`.
4. Đọc lại file qua GitHub API/`gh api repos/.../contents/...?...ref=feat/unified-shift-entry` và so SHA/content với local.
5. Chỉ sau khi verified local = GitHub mới bắt đầu migration/code.

---

## 3. Migration thực sự cần

### M1 — BM.01 v3.1, BM.06 v4.1 và profile classification

Tạo migration mới, không sửa migration cũ:

- Thay `prevent_published_config_mutation()` để cả `PUBLISHED` và `ARCHIVED` đều immutable.
- Cho phép transition có kiểm soát `PUBLISHED → ARCHIVED`, cấm sửa nội dung version đã published.
- Archive BM.01 v3.0 sau khi đóng `effective_to`; không xóa version, period, occurrence hoặc record cũ.
- Tạo BM.01 v3.1, copy fields/schedule rules, map đúng 5 work areas Owner-locked (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`, `NHAN_BENH_PHAM`). Giữ nguyên master record `KHO` cho BM.02/03.
- Giữ threshold BM.01 21–26°C, humidity 20–80%, `MORNING/AFTERNOON`.
- Archive BM.06 v4.0 như historical version; tạo và publish BM.06 v4.1 hiện hành:
  - Quantity of use đại diện thuần túy qua fixed shift/time window.
  - Cột `usage_value` và `usage_unit` trong `equipment_shift_details` giữ nguyên nullable (không bắt buộc nhập) chỉ để tương thích dữ liệu lịch sử; migration đảm bảo không có constraint bắt buộc nhập numeric usage.
- Mọi kỳ mới dùng BM.01 v3.1 và BM.06 v4.1; kỳ lịch sử giữ v3.0/v4.0 và scope lịch sử.
- **Identity & Staff Order (Loại hoàn toàn `profiles.staff_number`):**
  - Định danh nhân sự duy nhất bằng `profiles.user_id` (UUID).
  - Không thêm cột `staff_number`.
  - Nếu thực sự cần lưu thứ tự hiển thị STT Phụ lục 1–25 trong DB: chỉ thiết kế trường minimal `profile_source_order integer null unique` dành riêng cho tài khoản `account_kind = 'STAFF'`; ưu tiên xử lý qua seed metadata/ordering presenter thay vì coi đó là mã định danh nhân viên.
- Bổ sung `profiles.account_kind` với check `STAFF | SYSTEM | TEST`, default an toàn `SYSTEM` cho migration, sau đó backfill:
  - 25 Phụ lục → `STAFF` (gán `profile_source_order` 1–25).
  - `TS.BS Vũ Văn Nam` → `TEST`.
  - `Admin Sinh Hóa` → `SYSTEM`.
  - disabled QA fixtures → `TEST`.
- Roster eligibility được suy ra server-side: `active AND account_kind='STAFF'`; không cần cột boolean trùng lặp.

### M2 — Roster schema và server invariant

Tạo:

`duty_rosters`
- `id uuid PK`
- `business_date date`
- `duty_kind`: `WEEKDAY_LUNCH | WEEKDAY_AFTERNOON | WEEKDAY_NIGHT | HOLIDAY_24H`
- `window_start timestamptz`, `window_end timestamptz`
- `status`: `ACTIVE | SUPERSEDED | CANCELLED`
- `revision_no`, `supersedes_roster_id`
- `lock_version`
- `created_by`, `created_at`
- unique partial index cho một active roster mỗi `(business_date,duty_kind)`.

`duty_roster_members`
- `roster_id FK RESTRICT`
- `user_id FK profiles(user_id) RESTRICT`
- `member_order` 1 hoặc 2
- `business_role_snapshot`
- `assigned_at`
- PK `(roster_id,user_id)` và unique `(roster_id,member_order)`.

Invariant bằng deferred constraint trigger + RPC:

- `WEEKDAY_LUNCH`: đúng 2 staff khác nhau; 1 `DOCTOR`/`DEPARTMENT_HEAD` + 1 `TECHNICIAN`.
- `WEEKDAY_AFTERNOON`: đúng 2 active `STAFF` khác nhau; combination role bất kỳ.
- `WEEKDAY_NIGHT`: đúng 1 doctor-class + 1 technician.
- `HOLIDAY_24H`: đúng 1 doctor-class + 1 technician, window `07:00 → 07:00 hôm sau`; cùng roster được resolve cho mọi occurrence trong 24 giờ.
- Morning ngày thường không bắt roster cứng.
- Không chọn inactive, `SYSTEM`, `TEST`, duplicate.
- Không update/delete history; thay roster bằng revision mới và supersede bản cũ.
- RLS: authenticated staff đọc roster liên quan; admin quản trị; entry permission không tự phát sinh từ `is_admin`.

### M3 — Admin lifecycle helpers và RLS hardening

- `staff_reference_summary(target_user_id)` — admin-only, trả count theo records, corrections, approvals/actions, audit events, roster, incidents/notifications và scopes cần xem xét.
- `set_staff_profile_and_scopes(...)` — admin-only, validate role/admin tách biệt, audit changes.
- `deactivate_staff_profile(target_user_id, reason)` — set `active=false`, deactivate scopes, audit event; không xóa history.
- Hard delete chỉ chạy qua trusted Edge Function sau khi reference summary = 0.
- Thắt `assert_entry_access`/entry helpers để inactive profile không ghi mới; `is_admin` không cấp professional entry/approval ngoài scope hiện hành.
- Không cascade-delete records, audit, corrections, approvals hoặc roster history.

### Không cần migration

- `equipment_shift_statuses.updated_by` và `updated_at` đã tồn tại trong live schema và migration `20260924152000_p3_shift_status_contributor_audit.sql`.
- Correction chain đã đủ `revision_no`, `revision_of_record_id`, `is_effective`, `correction_requests`, `audit_events`.
- Redirect `/general-tasks`, Temperature UX, report fallback cleanup và performance refactor không cần schema.

---

## 4. RPC/Edge Function plan

### RPC mới

1. `save_duty_roster(target_business_date, target_duty_kind, target_member_ids, target_expected_lock)`
   - Atomic validate + revision/supersede + audit.
2. `get_work_session_context(target_business_date, target_context_code)`
   - Read-only orchestration payload: current roster, permitted occurrences, status, form/period/location/asset identity.
   - Không tạo session/super-record.
3. `staff_reference_summary(target_user_id)`.
4. `set_staff_profile_and_scopes(...)`.
5. `deactivate_staff_profile(target_user_id, target_reason)`.

### RPC sửa

- `ensure_operational_month`: chọn đúng current published/effective form version (BM.01 v3.1, BM.06 v4.1); không tạo duplicate từ archived version.
- Không thay signature `save_measurement_record`, `save_decontamination_record`, `save_maintenance_record`.
- `save_equipment_shift_draft`:
  - Chấp nhận `usage_value` và `usage_unit` là `NULL`.
  - Không validate bắt buộc numeric usage.
  - Loại bỏ hoàn toàn UI default `4.5`.
  - Lưu trữ trạng thái 25 máy và note của ca trực.

### Supabase Edge Function mới

`supabase/functions/admin-staff/index.ts`

- Nhận caller JWT.
- Kiểm tra caller `active=true` và `is_admin=true` trong DB.
- Dùng Supabase-hosted service role secret, không đưa service-role vào Vercel, browser, GitHub Actions hoặc source.
- Actions:
  - create auth user → create profile/scopes; rollback auth user nếu profile transaction lỗi.
  - update allowed auth metadata + profile/scopes (gán `profile_source_order` nếu là STAFF).
  - deactivate: DB deactivate + Auth ban/revoke sessions.
  - hard delete: chỉ khi `staff_reference_summary.total=0`; delete scopes/profile rồi Auth user, với compensating error handling.
- Không cho `is_admin=true` tự biến thành `DEPARTMENT_HEAD`.

---

## 5. Route plan

| Route | Decision | Final role |
|---|---|---|
| `/quick-duty` | KEEP + REBUILD | Entry workspace chính “Phiên làm việc / Nhập nhanh” |
| `/temperature` | KEEP + MERGE | Workspace chuyên sâu BM.01 (5 work areas) / BM.02 / BM.03 |
| `/general-tasks` | REMOVE PAGE + 308 REDIRECT | Redirect `/temperature` |
| `/tasks` | KEEP | Task inbox: hôm nay/còn thiếu/quá hạn/N/A/nhập bù; deep-link workspace section |
| `/bm06` | KEEP | Specialized BM.06 v4.1 fallback/history/full-screen entry (không input số giờ) |
| `/equipment` | KEEP | Presentation/drill-down, query 4 ca thật nếu hiển thị 4 ca |
| `/decontamination` | KEEP | KNBM overview/history |
| `/maintenance/[occurrenceId]` | KEEP | Specialized fallback |
| `/reports` | KEEP | Real report/period overview; no fake KPI |
| `/periods` | KEEP | Completeness/review/approval/correction/revision |
| `/admin/users` | KEEP + EXPAND | Staff create/edit/deactivate/remove/scopes (dùng user_id, order STT Phụ lục) |

`/general-tasks` được xóa khỏi Sidebar/More/navigation; permanent redirect cấu hình ở `next.config.ts` để trả 308.

---

## 6. Component reuse và UI composition

### Reuse/refactor

- `InlineTemperatureCard` và `InlineTemperatureList`: tách form UI khỏi save transport; reuse trong Temperature và Quick Duty.
- `MeasurementForm`: reuse validation/field model cho BM.01–03.
- `ShiftRegisterForm`: reuse cùng BM.06 v4.1 editor; loại bỏ bulk BT và loại bỏ hoàn toàn numeric usage input; hỗ trợ embedded accordion và full-screen mobile sheet.
- `DecontaminationForm`: reuse trong section KNBM.
- `MaintenanceForm`: reuse theo occurrence.
- `TasksFeedback`, `WorkflowFeedback`, `MobileActionSheet`, shell components.

### Components dự kiến tạo

- `src/components/work-session/WorkSessionWorkspace.tsx`
- `src/components/work-session/WorkSessionSection.tsx`
- `src/components/work-session/SessionRosterCard.tsx`
- `src/components/work-session/MeasurementSection.tsx`
- `src/components/work-session/StorageMeasurementsSection.tsx`
- `src/components/work-session/Bm06SessionSection.tsx` (chỉ hiển thị trạng thái 25 máy + ghi chú; không input usage)
- `src/components/work-session/SessionSaveState.tsx`
- `src/components/staff/StaffPicker.tsx` (dùng `user_id`, sắp xếp theo `profile_source_order` / STT Phụ lục)
- `src/components/staff/RosterEditor.tsx`
- `src/components/temperature/TemperatureFilters.tsx`
- `src/components/temperature/TemperatureHistoryChart.tsx`
- `src/components/admin/StaffAccountForm.tsx`
- `src/components/admin/StaffRemovalDialog.tsx`

Mỗi section có state độc lập: `idle | local-draft | saving | saved | error | conflict`; không rollback section khác.

---

## 7. Field → DB → RPC mapping

### Shared identity

| UI | DB | Authority |
|---|---|---|
| Form | `form_template_versions.id` | server từ occurrence |
| Kỳ | `register_periods.id` | server |
| Task | `schedule_occurrences.id` | server/deep link |
| Ngày | `business_date` | occurrence; SHIFT_4 dùng ngày bắt đầu |
| Slot/ca | `slot_code` | occurrence |
| Người bấm lưu | `records.entered_by` | `auth.uid()`, không UI input |
| Thời điểm nhập | `records.entered_at` | DB clock |
| Giờ thực hiện | `records.performed_at` | user-provided business time |
| Note | `records.note` | section payload |
| N/A | `records.is_na/na_reason` | `mark_occurrence_na` hoặc measurement RPC |

### Six forms

1. BM.01 (v3.1): 5 work areas; `MORNING/AFTERNOON`; temperature + required humidity → `measurement_details`; `save_measurement_record`.
2. BM.02: 9 asset periods; `MORNING/AFTERNOON`; temperature, humidity null → `measurement_details`; same RPC.
3. BM.03: 4 asset periods; `MORNING/AFTERNOON`; temperature, humidity null; same RPC.
4. KNBM: period/location/date + Daily/Weekly/Spill → `decontamination_details`; `save_decontamination_record`.
5. Maintenance: occurrence/asset/cadence/performed_at/result/note → `maintenance_details`; `save_maintenance_record`.
6. BM.06 (v4.1): occurrence/business_date/SHIFT_1..4 + note; `usage_value` và `usage_unit` gửi `NULL`; 25 `{asset_id,status}` rows → `equipment_shift_statuses`; `save_equipment_shift_draft`.

No free-text personnel field maps vào records. Roster maps riêng.

---

## 8. Roster → profile mapping & Identity design

- **Identity Principle:** Toàn bộ quan hệ dữ liệu, foreign keys, RPC parameters và form state sử dụng duy nhất `profiles.user_id` (UUID). Không sử dụng trường `staff_number`.
- **STT Phụ lục / Display Order:** Thứ tự 1–25 từ Phụ lục chỉ được coi là metadata phục vụ sắp xếp hiển thị (`source_order` / `display_order` / `profile_source_order`).
- Staff picker query: `profiles(user_id,full_name,business_role,profile_source_order)` where `active=true AND account_kind='STAFF'`.
- Sort theo `profile_source_order ASC NULLS LAST`, fallback `full_name ASC`.
- Picker value luôn là `user_id`; label là master `full_name`.
- `TS.BS Vũ Văn Nam`, system accounts, test fixtures, inactive users không selectable.
- Selected user IDs → `duty_roster_members.user_id`.
- Snapshot role → `business_role_snapshot`; current name remains resolved through retained profile.
- Roster does not set or override `records.entered_by`.
- Effective correction author remains effective record `entered_by`.

---

## 9. Attribution model

- Original record immutable: giữ `entered_by`, `entered_at`, original detail.
- Correction creates replacement revision, `entered_by=auth.uid()`, reason in `correction_requests`.
- Approval switches `is_effective`; official views/exports use effective revision author.
- History query expands root + revisions and joins:
  - original actor/name/time;
  - each revision actor/name/time;
  - correction reason/requester/reviewer/time;
  - BM.06 per-status `updated_by/updated_at` where relevant.
- Không thêm duplicate `original_entered_by`/`corrected_by` columns.
- Deactivated profiles remain retained for historical joins.

---

## 10. Fake/fallback removal scope

Audit và sửa có tests trước ở:

- `src/app/page.tsx`
- `src/app/temperature/page.tsx`
- `src/components/forms/TemperatureLabDashboard.tsx`
- `src/components/p5/QCTrendChart.tsx`
- `src/app/equipment/page.tsx`
- `src/app/calendar/page.tsx`
- `src/app/reports/page.tsx`
- `src/app/reports/export/page.tsx`
- `src/app/api/reports/[periodId]/csv/route.ts`
- `src/app/api/reports/[periodId]/xlsx/route.ts`
- `src/app/api/reports/[periodId]/pdf/route.ts`

Xóa fallback `BT`, `Bình thường`, `ĐẠT`, `Hoàn thành`, `KTV`, `KTV trực`, tên người, temperature/humidity/usage, KPI/percentage/roster/history giả. Null → blank/“Chưa ghi”/“Không đủ dữ liệu”. Xóa “ký số/chữ ký số pháp lý”.

---

## 11. Expected files to modify/create

### Docs

Các file tại §2.

### Database

- Create `supabase/migrations/<timestamp>_bm01_v31_bm06_v41_profile_classification.sql`
- Create `supabase/migrations/<timestamp>_duty_roster.sql`
- Create `supabase/migrations/<timestamp>_admin_staff_lifecycle.sql`
- Modify/add pgTAP tests in `supabase/tests/p2_foundation_test.sql`, `p2_rls_test.sql`, `p3_engine_test.sql`, `p4_approval_test.sql`; create `p6_unified_workflow_test.sql`.

### Server/data/domain

- `src/lib/forms/domain.ts`
- `src/lib/forms/context.ts`
- `src/lib/forms/queries.ts`
- `src/lib/forms/workflow.ts`
- `src/lib/forms/presenters.ts`
- `src/lib/p5/operational-queries.ts`
- Create `src/lib/work-session/context.ts`
- Create `src/lib/work-session/types.ts`
- Create `src/lib/roster/domain.ts`
- Create `src/lib/roster/queries.ts`
- Create `src/lib/admin/staff.ts`
- Create `supabase/functions/admin-staff/index.ts`

### Routes/components

Routes and components tại §5–§6, plus shell navigation, `next.config.ts`, admin users page, API/action adapters.

### Tests

Create targeted tests:

- `tests/bm01-five-work-areas.test.ts`
- `tests/work-session-context.test.ts`
- `tests/work-session-save-isolation.test.tsx`
- `tests/roster-domain.test.ts`
- `tests/staff-picker.test.tsx`
- `tests/bm06-final-rules.test.tsx` (kiểm tra không numeric usage, 4 ca cố định, 25 máy)
- `tests/temperature-filters.test.tsx`
- `tests/temperature-chart-series.test.tsx`
- `tests/admin-staff-lifecycle.test.ts`
- `tests/correction-attribution.test.ts`
- `tests/no-fabricated-operational-data.test.ts` expanded
- `tests/route-consolidation.test.ts`
- Playwright authenticated workflow/performance specs under `tests/e2e/` or `scripts/` according to existing harness convention.

---

## 12. TDD implementation sequence

### Phase 1 — Canonical docs & Source precedence sync

1. Update docs listed in §2, ban hành BM.06 v4.1, BM.01 v3.1, quy tắc precedence và loại bỏ hoàn toàn `staff_number`.
2. Cross-file consistency check.
3. Commit/push/verify GitHub = local.

### Phase 2 — RED database contracts

1. Write pgTAP failures for BM.01 v3.1 (5 work areas, KHO auxiliary), BM.06 v4.1 (nullable usage, fixed windows) and preserved historical versions.
2. Write roster invariant/RLS/history failures.
3. Write staff classification (`account_kind`, `profile_source_order`), deactivation/reference failures (không có `staff_number`).
4. Run `supabase test db`; confirm targeted failures.

### Phase 3 — GREEN migrations

1. Apply M1–M3 locally.
2. Run pgTAP.
3. Reset local DB from zero and rerun to prove deterministic migrations.
4. Do not push remote migration until review passes.

### Phase 4 — Work-session query/domain

1. RED tests for date/context/roster/occurrence grouping and SHIFT_4 previous business date.
2. Implement `get_work_session_context` và typed server adapter.
3. Verify RLS-scoped result; no super-record writes.

### Phase 5 — Quick Duty workspace

1. RED component tests for section isolation and server-confirmed success only.
2. Build workspace with reusable forms, local-draft labeling, deep links.
3. Validate 320–430px no horizontal overflow.

### Phase 6 — Roster UI

1. RED tests for role combinations and picker exclusions (`user_id` identity, `profile_source_order` sorting).
2. Implement staff picker and roster editor.
3. Confirm one operator can select both afternoon members.

### Phase 7 — BM.01/02/03 + Temperature

1. RED tests for 5 work areas / 9 cool / 4 freezer scope, Morning/Afternoon, humidity, abnormal, backfill.
2. Replace hard-coded areas with form-version/master query.
3. Implement filters and true time-series chart per selected semantic series.
4. Add loading/empty/error/conflict states.

### Phase 8 — BM.06 + Equipment

1. RED tests for exact time boundaries, overnight date, no numeric usage input, 24/25 failure, 25/25 success, conflict.
2. Remove `16:40`, bulk BT, usage default và numeric usage form inputs.
3. Equipment four-shift display queries actual date+asset+four slots only.

### Phase 9 — Reports/export/correction

1. RED tests for all fabricated fallbacks.
2. Effective revision attribution in official output.
3. History shows original + revisions + reason.
4. Approved-only guard and 25×4 mapping remain enforced.

### Phase 10 — Admin account management

1. RED tests for admin authorization, `account_kind`, `profile_source_order`, reference-aware deletion, inactive login/entry/roster denial.
2. Implement Edge Function and UI.
3. Verify service-role never enters Vercel/browser/source.

### Phase 11 — Performance

1. Capture comparable authenticated BEFORE benchmark for all seven routes.
2. Add server timing instrumentation around auth, ensure RPC and Supabase queries.
3. Optimize only proven hotspots: query fan-out, repeated client/auth/profile/unread calls, `ensure_operational_month` on read paths, prefetch and route bundles.
4. Capture AFTER with identical fixture/network/run count.

### Phase 12 — Full QA and independent review

Lint, typecheck, Vitest, pgTAP, build, browser E2E, mobile matrix, exports, security review, code review. Only then push final commits and Preview.

---

## 13. Acceptance test matrix

- BM.01: exact five work area IDs/codes/names; KHO preserved in master as auxiliary; 2 occurrences/day/location; humidity required; thresholds; backfill; no UI-only catalog.
- BM.02: exactly 9 snapshot assets, each own period/occurrence/measurement, Morning/Afternoon.
- BM.03: exactly 4 snapshot assets, same guarantees.
- KNBM: Daily/Weekly/Spill; spill no auto incident.
- Maintenance: Daily/Weekly/Monthly, occurrence cadence match.
- BM.06 (v4.1): 4 exact shifts, no `16:40`, overnight date, source order 1–25, no duplicate-name merge, no status/usage default, no bulk BT, no numeric usage input (represented exclusively by shift window), 24/25 fail, 25/25 finalize, stale lock conflict.
- Identity & Roster: identity by `user_id` only; STT Phụ lục is display/source order metadata only; weekday lunch/night 1 doctor-class + 1 technician; afternoon any two distinct active staff; holiday one pair 24h; occurrences remain separate; no test/system/inactive/duplicate.
- Attribution: roster does not alter `entered_by`; original immutable; replacement/effective switch; history/reason preserved.
- Admin: create/edit/scope/deactivate; hard-delete only zero refs; inactive cannot login/new-entry/roster; history joins survive; admin flag gives no approval.
- Routes: `/general-tasks` returns 308 to `/temperature`; task deep links correct workspace section.
- Export: APPROVED + effective only; missing data blank; no fabricated actor/status/result; BM.06 25 machine order × real shifts.
- UX: 320, 360, 375, 390, 412, 430px; no horizontal viewport overflow; touch targets ≥44px; keyboard/focus/error labels.

---

## 14. Performance BEFORE baseline

Authenticated local optimized build at commit `34912c0`:

| Route | Cold/Warm TTFB | Cold/Warm DOM/load | Requests | Cold resources |
|---|---:|---:|---:|---:|
| `/` | 224/261 ms | 1750/1473 ms | 40 | 56,670 B |
| `/temperature` | 249/248 ms | 877/849 ms | 35 | 25,527 B |
| `/quick-duty` | 313/244 ms | 354/266 ms | 34 | 14,793 B |
| `/bm06` | 203/256 ms | 1400/1523 ms | 34 | 18,533 B |
| `/reports` | 355/190 ms | 621/441 ms | 36 | 17,679 B |

- `/tasks` và `/equipment` chưa có comparable browser baseline trong lần chạy trước; bắt buộc đo trước bất kỳ performance code nào.
- Browser Supabase/Auth count = 0 vì calls hiện server-side; phải instrument server/query timings, không diễn giải 0 là không có call.
- Protected Vercel Preview chưa đo authenticated được vì Deployment Protection; protection page không phải route payload.

### Performance targets

So sánh median ít nhất 5 cold + 10 warm runs, cùng commit environment/fixture:

- Warm authenticated TTFB local: ≤200 ms cho `/`, `/temperature`, `/tasks`, `/bm06`, `/equipment`, `/reports`; `/quick-duty` ≤220 ms.
- Warm DOM/load: ≤900 ms cho data-heavy routes; `/quick-duty` ≤700 ms.
- Giảm ≥25% server Supabase/Auth calls ở Home/Temperature/BM06 nếu trace xác nhận duplicate.
- Một auth/profile resolution mỗi navigation request, không lặp không cần thiết.
- `ensure_operational_month` không chạy lặp trên mỗi nested read; explicit bounded ensure path.
- Không tăng initial route JS transfer >10% so với baseline tương ứng; lazy-load chart/admin/BM.06 full-screen sections.
- Không eager-prefetch các report/export/admin routes từ mobile primary flow.
- Images: responsive Next Image, không tải ảnh thiết bị ngoài viewport.
- Remote Preview target chỉ chốt sau khi có secure bypass: p75 warm TTFB ≤600 ms và navigation load ≤1.5 s trong cùng region. Không claim improvement nếu confidence interval/run medians không tốt hơn.

---

## 15. Admin account-management design

- `/admin/users` trở thành management workspace; không tạo page/dashboard mới.
- Create form: full name, account email/username, business role, admin flag, account kind (default STAFF), optional `profile_source_order` (1–25 cho STAFF Phụ lục), scopes, active state. Password lấy server-side policy/shared handover workflow hiện hành; không log/return plaintext ngoài one-time secure handoff.
- Identity: Tất cả thao tác tham chiếu qua `user_id`.
- Edit: role/admin/scopes/active/source_order; audit every change.
- “Xóa nhân viên” mở reference summary:
  - zero references → hard delete option;
  - any references → UI giải thích và thực hiện deactivation only.
- Inactive profile retained and excluded from selectors; Auth user banned/revoked.
- `profiles.user_id → auth.users` remains `ON DELETE RESTRICT` as safety net.

---

## 16. Business ambiguities / non-blocking source gaps

- Ba BM.01 work areas mới (`NUOC_TIEU`, `LY_TAM`, `NHAN_BENH_PHAM`) chưa có mã thiết bị theo dõi đã được nguồn/master xác nhận. Không invent. Implementation vẫn hỗ trợ occurrence và measurement với nullable `monitoring_device_id`, đồng thời hiển thị cảnh báo master-data; Admin có thể gán thiết bị thật sau khi khoa cung cấp.
- Cơ chế xác định holiday không có source calendar hiện tại. Roster `HOLIDAY_24H` được Admin lập tường minh theo business date; không tự suy luận ngày lễ. Weekend có thể preselect nhưng server invariant vẫn dựa trên `duty_kind` đã lưu.
- Đây là thiếu master input, không phải Owner business decision và không chặn kiến trúc.

**OWNER_DECISION_REQUIRED: NONE**

---

## 17. Rollback plan

- UI/routes behind `UNIFIED_SHIFT_ENTRY_ENABLED`; disabled → quay về specialized routes hiện hành.
- Admin management behind `ADMIN_STAFF_MANAGEMENT_ENABLED`.
- Migrations additive và backward-compatible; không drop old version/table/record.
- BM.01 v3.0 và BM.06 v4.0 archived nhưng được giữ toàn bộ. Rollback bằng compensating migration republish v3.0/v4.0 và archive v3.1/v4.1; không sửa/delete lịch sử.
- Roster tables có thể ngừng sử dụng bằng feature flag; data giữ lại.
- Edge Function version deploy độc lập; rollback về previous function version.
- Preview rollback bằng Vercel immutable deployment; Production chỉ rollback sau explicit authorization.
- Nếu PR #6 không merge, reconstruct clean feature branch bằng cherry-pick feature commits từ `master`.
- Không dùng `git reset --hard`, force-push hoặc destructive DB down migration khi chưa có Owner approval.

---

## 18. Commit sequence

1. `docs(p5): lock unified workflow owner decisions`
2. `test(db): specify bm01 v31 bm06 v41 and profile classification rules`
3. `feat(db): publish bm01 v3.1 bm06 v4.1 and classify account kinds`
4. `test(db): specify roster invariants and history`
5. `feat(roster): add server-enforced duty assignments`
6. `feat(work-session): add occurrence context orchestration`
7. `feat(ui): rebuild quick duty as work session workspace`
8. `feat(temperature): unify five-area and storage workflows`
9. `fix(bm06): enforce v4.1 fixed shift windows and explicit 25-machine entry`
10. `fix(reports): remove fabricated operational fallbacks`
11. `feat(admin): add reference-safe staff management`
12. `perf(p5): reduce verified auth and query overhead`
13. `test(p5): complete unified workflow acceptance coverage`
14. `docs(ops): record preview QA and rollback evidence`

Mỗi commit chỉ stage allowlisted files; `artifacts/` và `mockup` không chạm.

---

## 19. Preview/QA strategy

1. Docs commit/push verified first.
2. Local DB reset + pgTAP before touching remote schema.
3. Remote migration only against Preview/staging Supabase target hoặc explicitly authorized project workflow; create schema/data snapshot first.
4. Push feature commits to `feat/unified-shift-entry`.
5. Stacked Draft PR base `fix/p5-stabilization` while #6 remains unmerged.
6. Deploy immutable Vercel Preview only; Production unchanged.
7. Seed only clearly tagged QA users/data; cleanup in `finally`, verify zero remnants.
8. Browser QA roles: Technician, Doctor, Department Head, Admin-non-head, inactive.
9. E2E flows:
   - work session partial independent saves;
   - roster variants;
   - 5 work areas / 9 cool / 4 freezer measurements;
   - BM.06 4 shifts + overnight + 25 machines + no numeric usage input + conflict;
   - period approval/correction/effective export;
   - admin create/deactivate/hard-delete eligibility (`user_id` based).
10. Download and inspect real XLSX/PDF/CSV from an approved QA period; verify cell/order/actor values programmatically and visually.
11. Capture console errors, bad responses, overflow and accessibility checks.
12. Capture authenticated BEFORE/AFTER performance with secure Vercel bypass if available; otherwise report local optimized figures separately.
13. Independent security/spec review before marking Draft PR ready.
14. Owner QA on immutable Preview URL.
15. No merge/deploy until explicit Owner approval.

---

## 20. Final quality gates

- Canonical docs local = GitHub branch.
- Git diff excludes PR #6 stabilization when viewed against stacked base.
- ESLint: 0 errors/0 warnings.
- TypeScript: PASS.
- Vitest: all tests PASS.
- pgTAP/RLS: all tests PASS.
- Production build: PASS.
- Browser acceptance matrix: PASS.
- No temporary users/scripts/ports.
- No secrets in source, logs, Vercel env or GitHub Actions.
- PR #6 unchanged; Production unchanged.
