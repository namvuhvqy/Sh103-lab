# 04_IMPLEMENTATION_PLAN_FINAL

**Dự án:** Web app quản lý biểu mẫu nội bộ Khoa/Bộ môn Sinh hóa  
**Trạng thái:** FINAL — kế hoạch triển khai từ Phase 0 đến Phase 9  
**Mục tiêu gần:** tạo **Core Pilot Candidate trong 7 ngày code** sau khi P0 đã đủ đặc tả  
**Mục tiêu cuối:** Production dùng thật toàn khoa sau khi chất lượng, UAT/Pilot và vận hành đạt yêu cầu

**Phụ thuộc bắt buộc:**
- `00_PRODUCT_SCOPE_FINAL.md`
- `01_ARCHITECTURE_FINAL.md`
- `02_FORMS_DATA_RULES_FINAL.md`
- `03_SCREEN_MENU_UIUX_FINAL.md`

> File này quy định **thứ tự làm, đầu ra, test, bằng chứng và Exit Gate**.  
> File này không được tự thay đổi phạm vi, nghiệp vụ, kiến trúc hoặc quyền đã khóa trong 4 file FINAL phía trên.

---

# 1. Cách dùng tài liệu này

Đây là **checklist điều hành dự án** cho nhóm có ít kinh nghiệm code và sử dụng AI coding agent.

Mỗi Phase chỉ được coi là xong khi có đủ:

1. **Đầu ra cụ thể** trong repo/môi trường.
2. **Test evidence** — bằng chứng test.
3. **Acceptance Criteria** — điều kiện chấp nhận.
4. **Exit Gate** — cổng nghiệm thu Phase.
5. Không có thay đổi âm thầm trái `00/01/02/03`.

Không chấp nhận câu trả lời của AI kiểu:

> “Đã hoàn thành.”

nếu không có:

- file/diff;
- migration;
- test;
- preview;
- log;
- screenshot/video UAT khi cần.

---

# 2. Thứ tự nguồn sự thật

Nếu có mâu thuẫn:

1. `00_PRODUCT_SCOPE_FINAL.md`
2. `02_FORMS_DATA_RULES_FINAL.md`
3. `01_ARCHITECTURE_FINAL.md`
4. `03_SCREEN_MENU_UIUX_FINAL.md`
5. `04_IMPLEMENTATION_PLAN_FINAL.md`

Quy tắc:

- dừng task liên quan;
- không để AI tự chọn phiên bản;
- xác định tài liệu nào cần sửa;
- sửa đặc tả trước hoặc cùng Pull Request;
- mới tiếp tục code.

---

# 3. Những quyết định FINAL mà kế hoạch này phải giữ nguyên

## 3.1. Vai trò

Chỉ có 3 vai trò nghiệp vụ:

- Trưởng khoa;
- Bác sĩ phụ trách;
- Kỹ thuật viên.

`Admin` là cờ quyền riêng:

`is_admin = true/false`

Admin không tự động được phê duyệt nghiệp vụ.

## 3.2. Phê duyệt

- chỉ Trưởng khoa phê duyệt;
- phê duyệt theo kỳ/sổ;
- không bắt duyệt từng lần đo hàng ngày;
- có Return;
- Approved không sửa đè;
- sai sau duyệt → correction/đính chính.

## 3.3. Sáu biểu mẫu Core Pilot

1. `BM.01/QL.HTAT.01`
2. `BM.02/QL.HTAT.01`
3. `BM.03/QL.HTAT.01`
4. `BM.01_KNBM`
5. `BM.02/QL.TRTB.01`
6. `BM.06/QL.TRTB.01`

Không có Báo cáo sự cố trong MVP.

## 3.4. Nhập bù

- được phép;
- không bắt lý do chỉ vì nhập muộn;
- vẫn giữ `entered_at` thật;
- không backdate `entered_at`.

## 3.5. N/A

- có `Không áp dụng`;
- bắt buộc lý do;
- BM.06 không dùng N/A thay `KSD`/`H`.

## 3.6. PWA

MVP là:

**Next.js Web App + PWA**

PWA:

- cài Home Screen;
- mobile-first;
- không offline write;
- không background mutation sync;
- Service Worker chỉ cache app shell/static assets;
- dữ liệu nghiệp vụ vẫn lấy từ server/database.

## 3.7. Những phần không được tự ý thêm

- Báo cáo sự cố;
- attachment;
- n8n;
- cảm biến tự động;
- native mobile app;
- patient data;
- LIS/HIS;
- kho hóa chất;
- mua sắm;
- tài chính;
- multi-level approval;
- bảo dưỡng 3/6/12 tháng;
- push notification phức tạp.

---

# 4. Định nghĩa các mốc sản phẩm

## 4.1. Core Pilot Candidate

Bản chạy được sau mục tiêu 7 ngày:

- chạy trên DEV/STAGING;
- 6 biểu mẫu lõi hoạt động;
- mobile/PWA chạy;
- quyền/RLS lõi chạy;
- chốt kỳ cơ bản;
- lịch sử/Dashboard/report cơ bản;
- có test;
- chưa gọi là Production.

## 4.2. Pilot

Bản được người dùng thật thử trong STAGING hoặc môi trường Pilot.

Có:

- KTV/Bác sĩ/Trưởng khoa;
- tình huống nhập thật hoặc dữ liệu giả sát thực tế;
- UAT;
- issue log;
- Go/No-Go.

## 4.3. Production

Chỉ được gọi Production khi:

- P6 PASS;
- P7 PASS;
- backup + restore drill PASS;
- RLS/security PASS;
- PWA/mobile PASS;
- không còn Critical/High;
- Trưởng khoa chấp thuận Go-Live.

---

# 5. Roadmap P0 → P9

```text
P0  Chốt đặc tả
 ↓
P1  Repo + nền tảng kỹ thuật + PWA shell
 ↓
P2  Auth + RLS + Master Data + Seed
 ↓
P3  Form/Register/Schedule Engine + 6 biểu mẫu
 ↓
P4  Period Review + Approval + Correction + Audit
 ↓
P5  History + Dashboard + PDF/Excel
 ↓
P6  Quality + Security + PWA + Backup/Restore + Regression
 ↓
P7  UAT / Pilot
 ↓
P8  Production
 ↓
P9  Ổn định / Bàn giao / Backlog V1.1+
```

---

# 6. Trạng thái Phase 0 hiện tại

Bốn file FINAL đã khóa:

- `00_PRODUCT_SCOPE_FINAL.md`
- `02_FORMS_DATA_RULES_FINAL.md`
- `01_ARCHITECTURE_FINAL.md`
- `03_SCREEN_MENU_UIUX_FINAL.md`

Vì vậy về **đặc tả để bắt đầu code**, P0 được coi là:

**READY TO PASS / CODE-READY**

Các mục chưa khóa như:

- tên app;
- logo;
- domain Production;
- hosting Production;
- backup retention;
- mã tài sản Production cuối cùng;

**không chặn P1**.

Nếu khoa yêu cầu quy trình ký xác nhận nội bộ, có thể ghi chữ ký/xác nhận sau, nhưng không cần trì hoãn việc dựng repo kỹ thuật.

---

# 7. Quy ước mã task

Mỗi task nên có mã:

`P{phase}-{MODULE}-{NN}`

Module:

| Mã | Phạm vi |
|---|---|
| `REPO` | Repo, cấu trúc, CI |
| `PWA` | Manifest, Service Worker, install |
| `AUTH` | Supabase Auth |
| `SEC` | Role, RLS, permission |
| `MST` | Locations/assets/monitoring devices |
| `FORM` | Template/version/field |
| `SCH` | Schedule/occurrence |
| `PER` | Period/register |
| `REC` | Records |
| `BM01` | Nhiệt độ/độ ẩm phòng |
| `BM02` | Tủ mát |
| `BM03` | Tủ đông |
| `KNBM` | Khử nhiễm |
| `MNT` | Bảo dưỡng |
| `BM06` | Nhật ký 25 máy |
| `APR` | Review/Approve/Return |
| `COR` | Correction |
| `AUD` | Audit |
| `HIS` | History |
| `DASH` | Dashboard |
| `RPT` | PDF/Excel |
| `OPS` | Deployment/backup/monitoring |
| `TEST` | Test infrastructure |

Ví dụ:

`P3-BM06-03 — Mobile bulk entry 25 machine statuses`

---

# 8. Quy trình làm một task bằng AI

Mỗi task phải đi qua:

1. AI đọc 4 file FINAL liên quan.
2. AI nhắc lại:
   - task làm gì;
   - file dự kiến sửa;
   - migration dự kiến;
   - test dự kiến;
   - phần **không được đổi**.
3. Tạo branch/task riêng.
4. Code.
5. Migration nếu có.
6. Test.
7. AI tự review diff.
8. Preview/STAGING.
9. Người dùng kiểm tra Acceptance Criteria.
10. PASS mới merge.

Không cho AI:

- sửa nhiều module không liên quan trong một task;
- “refactor tiện thể” kiến trúc lõi;
- đổi role/ngưỡng/slot;
- merge/deploy Production tự động khi chưa được phép.

---

# 9. Branch / Git workflow đề xuất

```text
main
 ├── feat/p1-auth-foundation
 ├── feat/p2-master-data
 ├── feat/p3-bm01-measurement
 ├── feat/p3-bm06-shift
 ├── feat/p4-period-approval
 └── fix/...
```

Quy tắc:

- `main` luôn có thể build;
- task nhỏ;
- PR có scope rõ;
- không commit secret;
- migration đi cùng code;
- test evidence trong PR;
- không force-push/rewriting main tùy tiện.

---

# 10. Pull Request template tối thiểu

```markdown
## Task
P3-BM01-01

## Mục tiêu nghiệp vụ
...

## FINAL specs đã đọc
- [ ] 00
- [ ] 01
- [ ] 02
- [ ] 03

## Files/schema đã thay đổi
...

## Không thay đổi
- role
- threshold
- slot
- approval
...

## Migration
...

## Test
...

## Evidence
...

## Risks
...

## Rollback / forward fix
...
```

---

# 11. Definition of Done chung cho một tính năng

Một tính năng chỉ xong khi:

- [ ] Có task/Acceptance Criteria.
- [ ] Đúng 4 file FINAL.
- [ ] Lint PASS.
- [ ] Type-check PASS.
- [ ] Unit test liên quan PASS.
- [ ] Integration test liên quan PASS.
- [ ] RLS test nếu đụng dữ liệu/quyền.
- [ ] Migration versioned nếu đổi DB.
- [ ] Không log secret.
- [ ] Không phá regression.
- [ ] Mobile test nếu màn hình người dùng.
- [ ] PWA standalone không vỡ nếu liên quan UI.
- [ ] Loading/empty/error/conflict state có.
- [ ] Audit nếu là nghiệp vụ quan trọng.
- [ ] Preview evidence.
- [ ] Không scope creep.
- [ ] Người nghiệp vụ duyệt nếu workflow thay đổi.

---

# 12. PHASE 0 — Chốt nghiệp vụ và đặc tả

## 12.1. Mục tiêu

Không để AI code trên giả định.

## 12.2. Đầu ra FINAL hiện có

- Scope sản phẩm.
- Vai trò.
- 6 biểu mẫu.
- Ngưỡng.
- Time slot.
- Master data nguồn.
- Nhập bù.
- N/A.
- Approval.
- Correction.
- Architecture.
- 27 màn hình.
- PWA contract.
- 7 ngày Core Pilot scope.

## 12.3. Các nội dung đã khóa

### BM.01
- 08:00–09:00;
- 14:30–15:30;
- 21–26°C;
- 20–80%.

### BM.02
- 08:00–09:00;
- 14:30–15:30;
- 2–8°C.

### BM.03
- source `NganDa`;
- 08:00–09:00;
- 14:30–15:30;
- -30 đến -10°C.

### KNBM
- Daily;
- Weekly linh động;
- Spill event.

### Maintenance
- Daily;
- Weekly linh động;
- Monthly linh động;
- Đạt/Không đạt.

### BM.06
- 4 slot FINAL;
- 25 asset;
- đúng source order;
- BT/KSD/H.

## 12.4. Những mục còn mở nhưng non-blocking

- tên chính thức app;
- branding;
- domain;
- Production host;
- backup retention;
- full user mapping;
- mã tài sản chuẩn Production;
- pixel-perfect output cuối cùng.

## 12.5. Exit Gate P0

PASS khi:

- [x] Scope MVP khóa.
- [x] Role + Admin flag khóa.
- [x] 6 biểu mẫu khóa.
- [x] Quy tắc thời gian/ngưỡng khóa.
- [x] Nhập bù/N-A khóa.
- [x] Approval/correction khóa.
- [x] Architecture khóa.
- [x] Screen/UI/PWA khóa.
- [x] Không còn blocker nghiệp vụ cần AI tự đoán.

**Kết luận:** P0 đủ điều kiện bắt đầu P1.

---

# 13. PHASE 1 — Repo, môi trường, UI shell và PWA foundation

## 13.1. Mục tiêu

Tạo “đường ray” ổn định để các AI agent code cùng một kiến trúc.

## 13.2. P1-REPO-01 — Chuẩn hóa repo

Repo cần có tối thiểu:

```text
src/
supabase/
tests/
docs/
public/
README.md
```

`docs/` chứa đúng 5 file FINAL.

## 13.3. P1-REPO-02 — Next.js + TypeScript

Thiết lập:

- Next.js;
- TypeScript;
- lint;
- formatter;
- type-check;
- test runner;
- path alias nếu dùng;
- env validation.

Không khóa package phiên bản cụ thể trong đặc tả; agent chọn version tương thích thời điểm code.

## 13.4. P1-REPO-03 — UI foundation

Cần:

- app shell;
- mobile header;
- desktop sidebar;
- bottom nav;
- loading;
- error boundary;
- empty state;
- StatusBadge;
- DataCard;
- FilterSheet;
- ConfirmDialog;
- StickyActionBar.

## 13.5. P1-PWA-01 — Manifest

Tạo:

- manifest;
- `display=standalone`;
- start_url;
- scope;
- theme/background;
- 192px;
- 512px;
- maskable icon.

DEV có thể dùng placeholder icon.

## 13.6. P1-PWA-02 — Service Worker

Chỉ cache:

- static assets;
- app shell;
- offline fallback.

Không cache:

- `/auth/*`;
- `/rest/*`;
- `/rpc/*`;
- business APIs;
- reports;
- admin data.

## 13.7. P1-PWA-03 — Offline UX

Tạo:

- online/offline detector;
- global offline banner;
- offline page;
- không fake save;
- không background write queue.

## 13.8. P1-OPS-01 — Environment

Tạo:

- `.env.example`;
- DEV env;
- secret rules;
- không commit service role.

## 13.9. P1-REPO-04 — CI

CI tối thiểu:

- install;
- lint;
- type-check;
- unit test;
- build.

PR không được merge khi CI fail.

## 13.10. P1-REPO-05 — README

README phải giúp một người mới:

1. clone;
2. install;
3. tạo env;
4. start app;
5. chạy test;
6. chạy migration/seed;
7. biết docs nào là source of truth.

## 13.11. Test P1

- build sạch;
- lint;
- typecheck;
- basic render;
- manifest load;
- offline page;
- no secret scan;
- mobile shell 360/390;
- desktop shell.

## 13.12. Exit Gate P1

- [ ] Clone repo mới chạy được.
- [ ] CI PASS.
- [ ] `docs/` đủ 5 FINAL.
- [ ] App shell responsive.
- [ ] Manifest load.
- [ ] Service Worker không cache business route.
- [ ] Offline banner hoạt động.
- [ ] Không có secret.
- [ ] README đủ cho AI/người mới tiếp tục.

---

# 14. PHASE 2 — Auth, RLS, Master Data, Seed và quyền

## 14.1. Mục tiêu

Người dùng chỉ đọc/ghi đúng phạm vi, ngay cả khi gọi URL/API trực tiếp.

## 14.2. P2-AUTH-01 — Supabase Auth

Cần:

- login;
- logout;
- session server-side;
- protected routes;
- account inactive handling.

Reset/change password theo Supabase Auth implementation phù hợp.

## 14.3. P2-SEC-01 — Profiles

Schema:

- `user_id`;
- `full_name`;
- `business_role`;
- `is_admin`;
- `active`.

Constraint role:

- DEPARTMENT_HEAD
- DOCTOR
- TECHNICIAN

## 14.4. P2-SEC-02 — Scope assignment

Tạo:

`user_scope_assignments`

Hỗ trợ:

- form;
- location;
- asset;
- view;
- enter.

Pilot có thể gán rộng cho nhóm test.

## 14.5. P2-SEC-03 — RLS foundation

Test:

### KTV
- không admin;
- không approve;
- chỉ dữ liệu đúng scope.

### Bác sĩ
- nhập/xem đúng scope;
- không approve.

### Trưởng khoa
- xem toàn khoa;
- approve.

### KTV + Admin
- quản trị;
- **vẫn không approve**.

## 14.6. P2-MST-01 — Locations (5 Khu vực làm việc & Kho)

Seed:

1. `SINH_HOA` — Khu vực làm xét nghiệm Sinh hóa (Sort: 1)
2. `MIEN_DICH` — Khu vực làm xét nghiệm Miễn dịch (Sort: 2)
3. `NUOC_TIEU` — Khu vực làm xét nghiệm Nước tiểu (Sort: 3)
4. `LY_TAM` — Khu vực Ly tâm (Sort: 4)
5. `NHAN_BENH_PHAM` — Khu vực Nhận bệnh phẩm (Sort: 5; 0 máy, chỉ khử nhiễm bề mặt)
6. `KHO` — Kho hóa chất & Lưu mẫu (Sort: 6)

Không hard-code trong component; nạp động từ database.

## 14.7. P2-MST-02 — Monitoring devices

Seed:

- NAKĐT-01 (Khu Sinh hóa)
- NAKĐT-02 (Khu Miễn dịch)
- NAKĐT-03 (Kho)
- NKĐT/NKTG theo danh sách nguồn 13 tủ.

## 14.8. P2-MST-03 — Tủ/ngăn

Seed đủ **13 dòng** từ file 02.

Các dòng có cùng mã:

- không merge;
- UUID riêng;
- parent/compartment khi xác định được;
- vị trí lưu kho/phòng theo master data.

## 14.9. P2-MST-04 — 25 máy và Ánh xạ Khu vực làm việc

Seed đúng:

- 25 dòng theo thứ tự nguồn tuyệt đối (1 đến 25);
- source order;
- source name nguyên bản;
- không tự sửa/gộp tên trùng;
- **Gán `location_id` trỏ về 4 khu vực làm việc có máy** theo bảng ánh xạ đã khóa chính thức trong file 02:
  + Khu Sinh hóa: 9 máy (STT 1, 2, 5, 6, 9, 11, 12, 17, 19);
  + Khu Miễn dịch: 8 máy (STT 4, 7, 13, 14, 15, 18, 20, 23);
  + Khu Nước tiểu: 4 máy (STT 3, 8, 10, 16);
  + Khu Ly tâm: 4 máy (STT 21, 22, 24, 25);
  + Khu Nhận bệnh phẩm: 0 máy;
  + 100% 25 máy đã được Owner xác nhận chính thức, 0 OPEN ITEM về phân khu.

## 14.10. P2-MST-05 — Monitoring assignment history

Có:

- valid_from;
- valid_to;
- location hoặc asset.

Đổi monitor không sửa lịch sử cũ.

## 14.11. P2-MST-06 — Seed idempotent

Chạy seed 2 lần:

- không nhân đôi master data;
- duplicate nguồn vẫn giữ đúng identity;
- có log.

## 14.12. P2-UI

Screen nền:

- S00 Login;
- S15 Assets;
- S16 Asset Detail;
- S18 Locations;
- S21 Users;
- S22 Master Data;
- S24 Import foundation;
- S25 Account.

## 14.13. Test P2

- KTV URL admin → deny.
- Admin không Head → approve deny.
- Head → read toàn khoa.
- duplicate assets không merge.
- 13 tủ seed đủ.
- 25 máy seed đủ đúng order.
- location 3 dòng đúng.
- monitoring assignment history đúng.
- inactive asset không chọn cho new record.

## 14.14. Exit Gate P2

- [ ] Auth hoạt động.
- [ ] 3 role + Admin flag hoạt động.
- [ ] RLS test PASS.
- [ ] 13 tủ/ngăn seed.
- [ ] 3 location seed.
- [ ] 25 machine seed.
- [ ] duplicate không merge.
- [ ] Admin quản trị được master data.
- [ ] service role không có ở browser.

---

# 15. PHASE 3 — Form/Register/Schedule Engine và 6 biểu mẫu

P3 là phần lớn nhất của Core Pilot.

Nên chia:

- P3A — Template/Version + Period/Schedule
- P3B — Measurements
- P3C — KNBM + Maintenance
- P3D — BM.06
- P3E — Sổ/Today/Calendar

---

# 16. P3A — Template, Version, Period và Schedule

## 16.1. P3-FORM-01 — Form templates

Engine chỉ hỗ trợ:

- MEASUREMENT
- CHECKLIST_REGISTER
- MAINTENANCE_REGISTER
- MULTI_ASSET_SHIFT_REGISTER

Không xây form builder vô hạn.

## 16.2. P3-FORM-02 — Version

Có:

- DRAFT;
- PUBLISHED;
- ARCHIVED.

Published immutable.

## 16.3. P3-SCH-01 — Schedule rules

Loại:

- SLOT_DAILY
- DAILY
- WEEKLY_ONCE
- MONTHLY_ONCE
- EVENT

## 16.4. P3-PER-01 — Period

Status:

- OPEN
- READY_FOR_REVIEW
- RETURNED
- APPROVED

## 16.5. P3-SCH-02 — Occurrence generation

Phải:

- idempotent;
- không duplicate;
- đúng ngày;
- đúng slot;
- weekly flexible;
- monthly flexible;
- night shift đúng business_date.

## 16.6. Mapping schedule

### BM.01/02/03

- 08:00–09:00
- 14:30–15:30

### BM.06

- 07:00–11:30
- 11:30–13:30
- 13:30–16:30
- 16:30–07:00 hôm sau

### KNBM

- Daily
- Weekly flexible
- Spill EVENT

### Maintenance

- Daily
- Weekly flexible
- Monthly flexible

## 16.7. P3-SCH-03 — Today view source

Không tạo duplicate `today_tasks` table nếu không cần.

Dùng:

- periods;
- occurrences;
- current user scope;
- effective record.

## 16.8. Test P3A

- tạo period hai lần không duplicate;
- BM.01 đúng 2 slot;
- BM.06 đúng 4 slot;
- night shift date đúng;
- weekly không ép weekday;
- monthly không ép day;
- spill không sinh daily obligation.

## 16.9. Exit Gate P3A

- [ ] 6 Published template seed được.
- [ ] Period tạo được.
- [ ] Occurrence idempotent.
- [ ] Slot đúng.
- [ ] Today query đúng.
- [ ] Calendar query đúng.

---

# 17. P3B — BM.01 / BM.02 / BM.03

## 17.1. P3-BM01-01

Form BM.01:

- location;
- business_date;
- slot;
- performed_at;
- temperature;
- humidity;
- note;
- user;
- entered_at server-side.

Threshold:

- 21–26°C;
- 20–80%.

## 17.2. P3-BM02-01

Form BM.02:

- asset;
- temperature;
- performed_at;
- note;
- monitoring device snapshot;
- storage purpose read-only.

Threshold:

- 2–8°C.

## 17.3. P3-BM03-01

Form BM.03:

- asset/ngăn đông;
- temperature;
- performed_at;
- monitoring device/snapshot.

Threshold:

- -30 đến -10°C.

Version metadata:

- source `NganDa`.

## 17.4. P3-REC-01 — entered_at

`entered_at`:

- server generated;
- user không chỉnh.

## 17.5. P3-REC-02 — Nhập bù

Cho:

- nhập ngày trước;
- nhập ngoài slot.

Không:

- reason bắt buộc chỉ vì muộn.

## 17.6. P3-REC-03 — Abnormal

Ngoài threshold:

- save được;
- abnormal flag;
- UI warning;
- report/dashboard query được.

## 17.7. P3-REC-04 — N/A

N/A:

- reason required;
- occurrence → N_A.

## 17.8. UI

S05 mobile-first.

Test 360px/390px.

## 17.9. Test bắt buộc

### BM.01
- 21 = normal;
- 26 = normal;
- <21 abnormal;
- >26 abnormal;
- 20% normal;
- 80% normal;
- <20/>80 abnormal.

### BM.02
- 2 normal;
- 8 normal;
- <2/>8 abnormal.

### BM.03
- -30 normal;
- -10 normal;
- <-30/>-10 abnormal.

### Time
- nhập bù được;
- entered_at thật.

### N/A
- thiếu reason → reject.

## 17.10. Exit Gate P3B

- [ ] BM.01 end-to-end mobile.
- [ ] BM.02 end-to-end mobile.
- [ ] BM.03 end-to-end mobile.
- [ ] Threshold test PASS.
- [ ] Nhập bù PASS.
- [ ] N/A PASS.
- [ ] History snapshot đúng.

---

# 18. P3C — Khử nhiễm và Bảo dưỡng

## 18.1. P3-KNBM-01

Một record ngày có thể:

- daily=true;
- weekly=true;
- spill=true/false.

Một record có thể fulfill nhiều occurrence.

## 18.2. P3-KNBM-02 — Weekly

Weekly:

- cửa sổ tuần;
- không fix weekday;
- thực hiện ngày nào ghi ngày đó.

## 18.3. P3-KNBM-03 — Spill

Spill:

- chỉ khi phát sinh;
- không tạo obligation hàng ngày;
- không tự tạo Báo cáo sự cố.

## 18.4. P3-MNT-01

Maintenance chỉ:

- DAILY;
- WEEKLY;
- MONTHLY.

Result:

- PASS / FAIL
- UI: Đạt / Không đạt.

## 18.5. Không làm

- task catalog theo model;
- 3 tháng;
- 6 tháng;
- 12 tháng;
- attachment.

## 18.6. Test

- Daily + Weekly cùng ngày dùng một record hợp lệ.
- Weekly occurrence fulfilled đúng.
- Spill không xuất hiện như missing hàng ngày.
- Maintenance result chỉ PASS/FAIL.
- 3/6/12 month không tồn tại trong UI/schema schedule Core Pilot.

## 18.7. Exit Gate P3C

- [ ] KNBM chạy mobile.
- [ ] Daily/Weekly đồng thời PASS.
- [ ] Spill event PASS.
- [ ] Maintenance Daily/Weekly/Monthly PASS.
- [ ] Result PASS/FAIL đúng.
- [ ] Không scope creep.

---

# 19. P3D — BM.06 Multi-asset Shift

## 19.1. P3-BM06-01 — Shift record

Một record:

- một business_date;
- một slot;
- người ghi;
- usage value/unit;
- note.

## 19.2. P3-BM06-02 — 25 statuses

Mỗi shift phải có 25 status:

- BT;
- KSD;
- H.

## 19.3. P3-BM06-03 — Order

Giữ:

- 25 machine;
- source order 1–25;
- duplicate identity riêng.

## 19.4. P3-BM06-04 — Mobile UI

S06:

- card list;
- 25 máy;
- progress 0–25;
- segmented BT/KSD/H;
- bulk save.

Có thể có:

`Đánh dấu tất cả BT`

nhưng phải confirm, không auto-default.

## 19.5. Completion

Không Complete khi:

- thiếu 1 status.

## 19.6. Test

- 24/25 → reject complete.
- 25/25 → complete.
- KSD giữ KSD.
- H giữ H.
- duplicate name vẫn hai row.
- order đúng.
- 4 slot đúng.
- night business_date đúng.

## 19.7. Exit Gate P3D

- [ ] 25 assets đúng order.
- [ ] BT/KSD/H constraint.
- [ ] Mobile S06 dùng được.
- [ ] no duplicate merge.
- [ ] completion rule PASS.
- [ ] concurrency basic PASS.

---

# 20. P3E — Giao diện Area-first, Khu vực, Thiết bị, Sổ/Kỳ, Today

## 20.1. S01 Trang chủ Area-first
- Khối trạng thái ca trực hiện tại (khung giờ, người trực, tiến độ hoàn thành);
- **4 Thẻ Khu vực làm việc chính:** Sinh hóa (`SINH_HOA`), Miễn dịch (`MIEN_DICH`), Nước tiểu (`NUOC_TIEU`), Ly tâm (`LY_TAM`) kèm số máy và trạng thái vận hành ca;
- Khối Công việc chung toàn khoa (Nhiệt độ PXN BM.01, 13 dòng tủ BM.02/03);
- Khối Chờ duyệt (Trưởng khoa) / Quản trị (Admin) / Dashboard tóm tắt.

## 20.2. S02 Việc hôm nay
- Bộ lọc theo 4 Khu vực làm việc (`Tất cả` | `Sinh hóa` | `Miễn dịch` | `Nước tiểu` | `Ly tâm` | `Chung`);
- Phân loại: Cần làm, Đã làm, N/A, Còn thiếu / Nhập bù, Returned.

## 20.3. S03 Danh sách Khu vực & S04 Chi tiết Khu vực (Area Detail)
- `S03` Tổng quan 4 khu vực (`/areas`);
- `S04` Chi tiết khu vực (`/areas/:areaCode`):
  + Danh sách máy thuộc riêng khu vực đó;
  + Nhật ký ca BM.06 theo khu vực (có nút Lưu nháp);
  + Bảo dưỡng thiết bị trong khu vực (BM.02);
  + Khử nhiễm bề mặt khu vực (BM.01_KNBM Daily/Weekly/Spill);
  + Lịch sử tác nghiệp của khu vực.

## 20.4. S05 Chi tiết Thiết bị (Equipment Detail)
- `/assets/:assetId`: Thông tin máy, mã nguồn, thuộc khu vực nào;
- Nhật ký 4 ca gần nhất của riêng máy;
- Lịch sử bảo dưỡng và thao tác ghi nhận bảo dưỡng máy;
- Lịch sử vận hành và các biểu mẫu áp dụng riêng.

## 20.5. S08 Lịch, S09 Việc chung & S11 Sổ/Kỳ theo dõi
- Lịch công việc (`/calendar`): Day/Week/Month, lọc theo khu vực;
- Việc chung toàn khoa (`/general-tasks`): BM.01 môi trường, BM.02/03 tủ lạnh;
- Sổ/Kỳ (`/periods/:periodId`):
  + Measurement: ma trận ngày × slot;
  + KNBM: ngày × daily/weekly/spill;
  + Bảo dưỡng: checklist & kết quả;
  + BM.06: ma trận ca × 25 máy;
  + Mobile summary: tóm tắt tiến độ, số lượng BT/KSD/H.

## 20.6. Exit Gate P3 toàn Phase

P3 PASS khi:

- [ ] Điều hướng Area-first hoạt động chuẩn: Trang chủ → 4 Khu vực → Thiết bị → Phiếu;
- [ ] Thiết bị hiển thị đúng khu vực (14 máy xác định + 11 máy OPEN ITEM có nhãn cảnh báo);
- [ ] Không đưa 25 máy vào danh sách phẳng lộn xộn khi tác nghiệp theo khu;
- [ ] BM.06 cho phép lưu nháp theo khu và hoàn tất khi đủ 25/25 máy;
- [ ] 6 biểu mẫu Core Pilot nhập và lưu dữ liệu thành công;
- [ ] Today và Calendar lọc được theo Khu vực làm việc;
- [ ] Period view và Matrix hiển thị đúng cấu trúc sổ;
- [ ] Mobile 360/390px thao tác mượt mà, không lỗi giao diện;
- [ ] Không có Báo cáo sự cố;
- [ ] Không có File đính kèm;
- [ ] Không có Bảo dưỡng 3/6/12 tháng;
- [ ] Không có n8n trong lõi.

---

# 21. PHASE 4 — Period Review, Approval, Return, Correction, Audit

## 21.1. Mục tiêu

Hoàn thiện vòng đời:

`OPEN → READY_FOR_REVIEW → RETURNED/APPROVED`

## 21.2. P4-APR-01 — Mark Ready

Người có quyền nhập:

- khi nghĩa vụ kỳ đã xử lý;
- mark ready.

Nếu còn PENDING:

- không cho ready/approve theo rule completion.

## 21.3. P4-APR-02 — Approval Queue

S09:

- chỉ kỳ chờ duyệt;
- không queue từng daily entry.

## 21.4. P4-APR-03 — Review

S10:

- summary;
- missing;
- N/A;
- abnormal;
- BM.06 H/KSD;
- drill-down record.

## 21.5. P4-APR-04 — Return

Trưởng khoa:

- Return;
- reason bắt buộc.

Kỳ → RETURNED.

Người nhập:

- sửa;
- mark ready lại.

## 21.6. P4-APR-05 — Approve

Atomic transaction:

1. verify caller = DEPARTMENT_HEAD;
2. verify state;
3. verify completion;
4. APPROVED;
5. approved_by/approved_at;
6. period_action;
7. audit;
8. commit.

## 21.7. P4-SEC-01 — Admin cannot approve

Test đặc biệt:

`TECHNICIAN + is_admin=true`

→ Approve denied.

## 21.8. P4-COR-01 — Correction

Approved:

- direct update reject;
- original giữ nguyên;
- correction revision mới;
- reason bắt buộc;
- Trưởng khoa confirm correction;
- effective pointer chuyển transactionally.

## 21.9. P4-AUD-01 — Audit

Audit tối thiểu:

- create/edit record;
- N/A;
- mark ready;
- return;
- approve;
- correction create/approve;
- role/Admin change;
- master data change;
- template publish.

## 21.10. Concurrency

- double approve không xảy ra;
- lock_version/conflict;
- double-save BM.06 không overwrite im lặng.

## 21.11. Test P4

1. Open → Ready → Approve.
2. Open → Ready → Return → Edit → Ready → Approve.
3. KTV approve → deny.
4. Admin KTV approve → deny.
5. Approved update API → deny.
6. Correction giữ original.
7. Correction effective record đổi đúng.
8. Audit đầy đủ.

## 21.12. Exit Gate P4

- [ ] Chỉ Head approve.
- [ ] Return reason bắt buộc.
- [ ] Approved immutable.
- [ ] Correction giữ bản gốc.
- [ ] Audit append-only.
- [ ] Double approve protected.
- [ ] UI S09/S10/S11 PASS mobile/tablet/desktop phù hợp.

---

# 22. PHASE 5 — History, Dashboard, PDF/Excel

## 22.1. P5-HIS-01 — History

S12:

Filter:

- date;
- period;
- template;
- person;
- location;
- asset;
- status;
- abnormal;
- N/A;
- revision.

Không có Incident filter.

## 22.2. P5-HIS-02 — Record detail

S08:

- template/version;
- business date;
- performed_at;
- entered_at;
- threshold snapshot;
- actor;
- revision;
- correction history.

## 22.3. P5-DASH-01 — KPI

KPI tối thiểu:

1. Việc hôm nay cần làm
2. Tỷ lệ hoàn thành
3. Còn thiếu
4. Bất thường
5. Bảo dưỡng chưa hoàn thành
6. Máy H trong BM.06
7. Kỳ chờ phê duyệt

## 22.4. P5-DASH-02 — Chart

- completion trend;
- abnormal trend;
- maintenance;
- BT/KSD/H.

Không:

- incident chart;
- patient chart;
- AI diagnosis.

## 22.5. P5-RPT-01 — Report source

Official report:

- APPROVED period;
- `is_effective=true`.

Progress dashboard:

- OPEN period được dùng.

## 22.6. P5-RPT-02 — PDF/Excel

Đầu ra gần biểu mẫu giấy.

Tối thiểu:

- code/name;
- version;
- period;
- subject;
- fields;
- actor;
- approval metadata;
- N/A;
- abnormal;
- effective correction.

## 22.7. P5-RPT-03 — BM.06

Matrix:

- shift × machine;
- 25 máy;
- đúng order;
- BT/KSD/H.

## 22.8. P5-RPT-04 — Golden Sample

Chọn dữ liệu mẫu:

- tính tay;
- hoặc so với Excel/Word nguồn.

Không chấp nhận:

> “sai số nhỏ tạm được”

nếu sai do logic.

## 22.9. P5-PERF-01

Không fetch toàn bộ history vào browser.

Dùng:

- filter server-side;
- pagination;
- SQL views.

## 22.10. Exit Gate P5

- [ ] History đúng.
- [ ] Dashboard KPI đúng.
- [ ] Drill-down đúng.
- [ ] PDF/Excel đúng dữ liệu.
- [ ] BM.06 order đúng.
- [ ] Report dùng effective/Approved đúng.
- [ ] Golden sample đối soát PASS.

---

# 23. PHASE 6 — Chất lượng, bảo mật, PWA, Audit, Backup/Restore

P6 **không phải n8n**.

Đây là hàng rào trước Pilot.

---

# 24. P6A — Test logic

## Unit tests

- thresholds;
- time slots;
- weekly window;
- monthly window;
- night slot;
- N/A;
- abnormal;
- report mapping.

---

# 25. P6B — Integration

Test:

- create period;
- generate occurrence;
- save record;
- mark N/A;
- BM.06 complete;
- mark ready;
- Return;
- Approve;
- Correction;
- audit.

---

# 26. P6C — RLS/Security

Ma trận test:

| Actor | Action | Expected |
|---|---|---|
| KTV | Read own scope | Allow |
| KTV | Read outside scope | Deny |
| KTV | Admin page | Deny |
| Doctor | Enter allowed scope | Allow |
| Doctor | Approve | Deny |
| Head | Read all | Allow |
| Head | Approve | Allow |
| Technician+Admin | Admin manage | Allow |
| Technician+Admin | Approve | Deny |
| User | Update Approved | Deny |
| User | Delete record | Deny |

---

# 27. P6D — E2E

Tối thiểu:

1. Login.
2. Today.
3. BM.01 normal.
4. BM.01 abnormal.
5. Nhập bù.
6. N/A.
7. BM.06 25 statuses.
8. KNBM daily+weekly.
9. Maintenance.
10. Mark Ready.
11. Head Return.
12. Resubmit.
13. Head Approve.
14. Correction.
15. Report.

---

# 28. P6E — PWA test

## Android

- manifest;
- install;
- standalone;
- Today;
- S05;
- S06;
- offline banner;
- reconnect.

## iPhone

- Safari;
- Add to Home Screen;
- safe-area;
- keyboard;
- sticky button;
- auth;
- offline.

## Service Worker

Test:

- static cache;
- API not cached;
- auth not cached;
- report not cached;
- update banner;
- dirty form not auto-reloaded.

---

# 29. P6F — Backup / Restore

Trước Pilot chính thức phải có:

- database backup;
- restore procedure;
- restore test.

Restore drill kiểm:

- profiles;
- roles;
- periods;
- records;
- approval;
- correction;
- assets;
- template versions;
- audit.

Không cần Storage backup vì MVP không có attachment business.

## Exit criteria Restore

Sau restore:

- login được;
- một kỳ Approved còn nguyên;
- correction chain còn nguyên;
- RLS còn đúng;
- BM.06 statuses đủ;
- report dữ liệu mẫu vẫn đúng.

---

# 30. P6G — Error handling

Mọi mutation có:

- validation error;
- permission error;
- conflict;
- server error.

Không show raw SQL/stack.

Không log:

- password;
- token;
- service role.

---

# 31. P6H — Mức độ lỗi

| Mức | Ý nghĩa | Cho Pilot? |
|---|---|---|
| Critical | mất dữ liệu, lộ quyền, app unusable | Không |
| High | sai nghiệp vụ lõi, report sai, approval sai | Không |
| Medium | có workaround, không sai dữ liệu lõi | Có điều kiện |
| Low | thẩm mỹ/tiện dụng nhỏ | Có thể backlog |

## Exit Gate P6

- [ ] Không Critical.
- [ ] Không High.
- [ ] Unit PASS.
- [ ] Integration PASS.
- [ ] RLS PASS.
- [ ] E2E PASS.
- [ ] PWA PASS.
- [ ] Backup restore PASS.
- [ ] Regression PASS.
- [ ] STAGING ổn định.

---

# 32. PHASE 7 — UAT và Pilot

## 32.1. Mục tiêu

Người thật xác nhận app đúng quy trình và dễ dùng.

## 32.2. Nhóm Pilot

Tối thiểu nên có:

- Trưởng khoa;
- 1 Bác sĩ phụ trách;
- 2–3 KTV;
- Admin hỗ trợ.

Con số cụ thể có thể điều chỉnh theo khoa.

## 32.3. Dữ liệu Pilot

Không dùng:

- patient identity;
- LIS/HIS data.

Dùng:

- dữ liệu test;
- hoặc dữ liệu biểu mẫu nội bộ được phép theo quy định đơn vị.

## 32.4. UAT bắt buộc từ file 03

### UAT-01
BM.01 25°C / 60%.

### UAT-02
BM.01 27°C abnormal nhưng save.

### UAT-03
Nhập bù.

### UAT-04
N/A reason.

### UAT-05
BM.06 24/25 fail completion, 25/25 success.

### UAT-06
KNBM Daily + Weekly cùng record.

### UAT-07
Chỉ Head approve.

### UAT-08
Correction.

### UAT-09
PWA offline.

### UAT-10
Duplicate machine identity.

## 32.5. UAT bổ sung

- BM.02 boundary 2/8;
- BM.03 boundary -30/-10;
- maintenance PASS/FAIL;
- Return/Resubmit;
- PDF;
- Excel;
- Dashboard;
- install PWA Android;
- Add to Home Screen iPhone.

## 32.6. Ghi nhận UX

Mỗi tester ghi:

- task nào khó;
- mất bao lâu;
- cần trợ giúp mấy lần;
- từ nào khó hiểu;
- màn hình nào phải zoom/kéo;
- có bấm nhầm không.

## 32.7. Issue classification

- Blocker;
- Must fix;
- Later.

## 32.8. Exit Gate P7

- [ ] 100% UAT bắt buộc PASS.
- [ ] Không Blocker.
- [ ] Không Critical/High.
- [ ] Các Must fix đã xử lý.
- [ ] Mobile/PWA được nhóm Pilot chấp nhận.
- [ ] Trưởng khoa Go/No-Go.

---

# 33. PHASE 8 — Production

## 33.1. P8-OPS-01 — Production environment

Tách:

- Supabase PROD;
- Production hosting;
- Production env.

Không dùng DEV database.

## 33.2. P8-OPS-02 — Hosting/domain

Trước Production phải chốt:

- hosting;
- domain;
- HTTPS;
- chính sách đơn vị/bệnh viện về public/cloud hosting.

Nếu chính sách chưa rõ:

**HOLD P8**

Không được tự deploy Production public.

## 33.3. P8-MST-01 — Master data Production

Trước Production:

- chuẩn hóa mã asset/tủ chính thức;
- reconcile duplicate;
- không merge lịch sử sai;
- giữ source_name.

## 33.4. P8-AUTH-01 — Tài khoản thật

- tạo user thật;
- business role đúng;
- Admin flag đúng;
- scope đúng;
- inactive người không sử dụng.

Không import test account như user Production.

## 33.5. P8-DB-01 — Migration

Quy trình:

1. backup;
2. migration;
3. verify;
4. seed approved master data;
5. deploy app;
6. smoke test.

## 33.6. P8-PWA-01

Production PWA:

- manifest dùng tên thật;
- icons thật;
- domain đúng;
- service worker đúng release;
- app version đúng.

## 33.7. P8-REL-01 — Release

Tạo:

- tag/release;
- release note;
- commit SHA;
- migration list;
- known issues;
- rollback instruction.

## 33.8. P8-SMOKE

Production smoke:

1. Login.
2. Today.
3. Tạo period test hợp lệ.
4. Nhập record.
5. N/A test nếu được phép.
6. BM.06 test nếu có test context.
7. Mark Ready.
8. Head Approve.
9. History.
10. Report.
11. Audit.
12. PWA install/launch.

Không dùng dữ liệu người bệnh.

## 33.9. Rollback

Nếu lỗi:

- rollback app release;
- nếu DB migration forward-only → dùng forward fix theo plan;
- không sửa nóng tùy tiện Production bằng UI/SQL manual.

## 33.10. Exit Gate P8

- [ ] Production đúng release.
- [ ] Migration đúng.
- [ ] Backup hoạt động.
- [ ] Smoke PASS.
- [ ] PWA PASS.
- [ ] User/role đúng.
- [ ] Rollback/runbook có.
- [ ] Go-Live được chấp thuận.

---

# 34. PHASE 9 — Ổn định, bàn giao, vận hành

## 34.1. Theo dõi

Ít nhất 1–2 chu kỳ đầu:

- lỗi nhập;
- approval;
- report;
- PWA;
- latency;
- user confusion.

## 34.2. Hotfix policy

Hotfix:

- chỉ bug;
- không trộn feature mới;
- vẫn branch/test/release.

## 34.3. Tài liệu bàn giao

### Admin runbook
- tạo user;
- đổi role;
- Admin flag;
- scope;
- asset;
- monitoring device;
- form version;
- audit;
- backup;
- restore;
- release.

### KTV/Bác sĩ quick guide
- login;
- Today;
- nhập;
- nhập bù;
- N/A;
- History;
- PWA.

### Trưởng khoa guide
- Approval Queue;
- review;
- Return;
- Approve;
- correction;
- Dashboard;
- report.

## 34.4. Backlog V1.1+

Chỉ xem xét sau dữ liệu thực tế.

Có thể gồm:

- n8n nhắc việc;
- sensor nhiệt độ/độ ẩm;
- thông báo đa kênh;
- import lịch sử;
- workflow nhiều cấp nếu nghiệp vụ thật thay đổi;
- offline draft/sync nếu thực sự cần và có security design.

Không biến n8n thành database/quyền lõi.

## Exit Gate P9

- [ ] Runbook hoàn thành.
- [ ] Người quản trị được hướng dẫn.
- [ ] User guide hoàn thành.
- [ ] Hotfix process rõ.
- [ ] Backlog V1.1 tách khỏi MVP.
- [ ] Hệ thống có owner vận hành.

---

# 35. Kế hoạch 7 ngày code — FINAL

## Điều kiện bắt đầu

Đồng hồ 7 ngày bắt đầu khi:

- P0 code-ready;
- repo có quyền truy cập;
- Supabase DEV có thể tạo;
- người code/AI có môi trường thực thi.

Hiện P0 đã đủ đặc tả.

Mục tiêu 7 ngày:

**Core Pilot Candidate trên DEV/STAGING**

không phải Production.

---

# 36. Ngày 1 — P1 + nền P2

## Mục tiêu

Có repo chuẩn, app chạy, PWA shell, Supabase DEV, Auth/RLS skeleton.

## Task

### Morning
- `P1-REPO-01` repo/docs.
- `P1-REPO-02` Next.js TS.
- `P1-REPO-03` app shell.
- CI.

### Afternoon
- Supabase DEV.
- schema profiles.
- auth integration.
- role/Admin flag.
- RLS skeleton.
- manifest/offline shell.

## Cuối ngày phải có

- build PASS;
- login demo;
- mobile shell;
- PWA manifest;
- Supabase connection;
- migration chạy;
- CI PASS.

## Không làm

- Dashboard.
- Report.
- n8n.
- sensor.
- production deploy.

## Gate Day 1

Nếu Auth/schema chưa ổn:

**không đẩy sang Day 2 bằng workaround.**

---

# 37. Ngày 2 — P2 + P3A

## Mục tiêu

Master data + Form Version + Period + Schedule/Occurrence.

## Task

- locations;
- monitoring devices;
- 13 tủ/ngăn;
- 25 machine;
- duplicate identity;
- template/version;
- 6 template seed;
- schedule rules;
- period;
- occurrence generator;
- Today basic.

## Test cuối ngày

- seed 2 lần không duplicate;
- 25 machine order đúng;
- BM.01 đúng 2 slot;
- BM.06 đúng 4 slot;
- weekly flexible;
- night shift.

## UI

- Assets basic;
- Locations basic;
- Form Catalog basic;
- Today list basic.

## Không làm

- full Dashboard;
- PDF;
- correction.

---

# 38. Ngày 3 — P3B Measurements

## Mục tiêu

BM.01/BM.02/BM.03 nhập end-to-end mobile.

## Task

- S05 Measurement UI;
- save_record;
- threshold snapshot;
- abnormal flag;
- entered_at server-side;
- nhập bù;
- N/A.

## Test

BM.01 boundary.

BM.02 boundary.

BM.03 boundary.

N/A reason.

Late/backfill.

## Cuối ngày

Một KTV test user có thể:

1. login PWA;
2. Today;
3. mở BM.01;
4. nhập;
5. thấy sổ cập nhật.

Làm tương tự BM.02/BM.03.

---

# 39. Ngày 4 — P3C + P3D + Period View

## Mục tiêu

KNBM + Maintenance + BM.06 + Sổ.

## Task

### KNBM
- daily;
- weekly;
- spill.

### Maintenance
- daily;
- weekly;
- monthly;
- PASS/FAIL.

### BM.06
- 25 machine list;
- BT/KSD/H;
- 4 slot;
- completion.

### Period view
- measurement list/matrix;
- KNBM;
- maintenance;
- BM.06 summary.

## Test cuối ngày

- daily+weekly same record;
- spill no daily obligation;
- maintenance no 3/6/12;
- BM.06 24/25 fail;
- 25/25 pass.

---

# 40. Ngày 5 — P4 Approval + Correction + Audit

## Mục tiêu

Hoàn chỉnh vòng đời kỳ.

## Task

- Mark Ready;
- Approval Queue;
- Review screen;
- Return;
- Resubmit;
- Approve;
- approved immutability;
- correction;
- audit;
- concurrency basic.

## Test

- KTV approve deny.
- Doctor approve deny.
- Technician+Admin approve deny.
- Head approve allow.
- double approve safe.
- approved direct update deny.
- correction preserves original.

## Cuối ngày

End-to-end:

`Login → nhập → sổ → Mark Ready → Head Review → Approve → read-only`

phải chạy.

---

# 41. Ngày 6 — P5 History + Dashboard + Report

## Mục tiêu

Có dữ liệu quản lý và output.

## Task

- S12 History;
- S13 Dashboard;
- S14 Reports;
- SQL views;
- PDF basic;
- Excel basic;
- approved/effective source;
- BM.06 matrix output.

## Golden sample

Chọn ít nhất:

- BM.01;
- BM.02 hoặc BM.03;
- BM.06;

đối soát dữ liệu.

## Không làm

- pixel-perfect vô hạn;
- automation;
- incident report.

## Cuối ngày

Trưởng khoa:

- xem Dashboard;
- drill-down;
- export PDF/Excel.

---

# 42. Ngày 7 — P6 tối thiểu + STAGING + Core Pilot Candidate

## Mục tiêu

Không thêm feature mới trừ blocker.

## Task

### Morning
- regression;
- RLS matrix;
- E2E;
- PWA test;
- mobile test.

### Afternoon
- STAGING deploy;
- backup;
- restore thử;
- smoke;
- UAT dry run.

## Bắt buộc test

- BM.01 normal/abnormal;
- nhập bù;
- N/A;
- BM.06;
- KNBM;
- approval;
- correction;
- report;
- Admin-not-approver;
- offline PWA.

## Cuối ngày

Nếu PASS:

**CORE PILOT CANDIDATE**

Nếu còn Critical/High:

**HOLD**

Không đổi tên thành Production để chạy theo deadline.

---

# 43. Nếu 7 ngày bị trễ thì cắt gì trước

Không cắt:

- RLS;
- nhập bù;
- entered_at;
- N/A rule;
- approval;
- immutable Approved;
- correction;
- BM.06 25 machine correctness;
- test ngưỡng;
- no secret;
- backup/restore trước Pilot chính thức.

Có thể giảm polish:

1. animation;
2. dark mode;
3. đẹp pixel-perfect report;
4. Admin template builder UI nâng cao;
5. import UI đẹp;
6. chart nâng cao;
7. global search;
8. extra dashboard styling.

Nếu cần:

- seed template/version bằng migration trước;
- builder UI nâng cao hoàn thiện sau Core Pilot;

nhưng schema/versioning vẫn phải đúng.

---

# 44. Critical path 7 ngày

Critical path:

```text
Repo
→ Auth/RLS
→ Master Data
→ Template/Period/Schedule
→ Records
→ 6 forms
→ Period Review
→ Approval
→ History/Report
→ RLS/E2E/PWA
```

Nếu một mắt xích critical fail:

- dừng;
- sửa nền;
- không xây feature phía sau bằng mock sai.

---

# 45. Công việc có thể chạy song song

Nếu có nhiều AI agent:

## Track A — Database
- migrations;
- RLS;
- functions;
- seed;
- tests.

## Track B — Frontend core
- shell;
- Today;
- forms;
- period.

## Track C — PWA/UI
- manifest;
- service worker;
- mobile layout;
- offline/update UX.

## Track D — Report/Test
- views;
- reports;
- E2E;
- fixtures.

Nhưng cần tránh 2 agent cùng sửa một migration/file lõi cùng lúc.

---

# 46. Quy tắc chia task cho nhiều AI agent

Mỗi agent phải được cung cấp:

- task ID;
- 4 FINAL specs;
- branch;
- owner file/module;
- forbidden changes.

Ví dụ:

### Agent DB
Được sửa:
- `supabase/migrations/*`
- `supabase/tests/*`

Không được:
- đổi business rules;
- đổi UI spec.

### Agent UI
Được:
- component/page.

Không được:
- tự sửa threshold;
- tự nới role;
- tự gọi service role.

---

# 47. Test strategy FINAL

## 47.1 Unit

Test logic nhỏ.

Ví dụ:

- 26°C BM.01 normal;
- 26.1 abnormal.

## 47.2 Integration

Test nhiều layer:

`record → occurrence → period → audit`

## 47.3 RLS

Test database lock.

## 47.4 E2E

Giả lập user.

## 47.5 UAT

Người thật xác nhận.

## 47.6 Restore drill

Backup phục hồi được.

---

# 48. Test matrix theo biểu mẫu

| Form | Unit | Integration | E2E | UAT |
|---|---:|---:|---:|---:|
| BM.01 | ✓ | ✓ | ✓ | ✓ |
| BM.02 | ✓ | ✓ | ✓ | ✓ |
| BM.03 | ✓ | ✓ | ✓ | ✓ |
| KNBM | ✓ | ✓ | ✓ | ✓ |
| Maintenance | ✓ | ✓ | ✓ | ✓ |
| BM.06 | ✓ | ✓ | ✓ | ✓ |

---

# 49. Test matrix theo quyền

| Case | KTV | Doctor | Head | KTV+Admin |
|---|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | ✓ |
| Read allowed | ✓ | ✓ | ✓ | ✓ |
| Enter allowed | ✓ | ✓ | theo scope | ✓ |
| Admin page | — | — | nếu Admin | ✓ |
| Approve | — | — | ✓ | — |
| Correction approve | — | — | ✓ | — |
| Manage user | — | — | nếu Admin | ✓ |

---

# 50. PWA acceptance matrix

| Hạng mục | Android | iPhone | Desktop |
|---|---:|---:|---:|
| Web access | ✓ | ✓ | ✓ |
| Install | ✓ | Add Home Screen | N/A/optional |
| Standalone | ✓ | ✓ | — |
| Offline banner | ✓ | ✓ | ✓ |
| No offline write | ✓ | ✓ | ✓ |
| Update banner | ✓ | ✓ | ✓ |
| BM.06 mobile entry | ✓ | ✓ | — |
| Safe area | — | ✓ | — |

---

# 51. Report acceptance matrix

Mỗi report phải kiểm:

- code;
- version;
- period;
- subject;
- values;
- record count;
- effective revision;
- approval metadata;
- N/A;
- abnormal;
- machine order.

Không chỉ nhìn “đẹp”.

---

# 52. Data integrity invariants

Bất kỳ Phase nào cũng không được phá:

1. `entered_at` server-controlled.
2. Published version immutable.
3. Approved period immutable.
4. Original correction không mất.
5. N/A cần reason.
6. BM.06 status chỉ BT/KSD/H.
7. 25 machine identity riêng.
8. Duplicate source code không dùng làm PK.
9. Monitoring assignment history không rewrite.
10. RLS không bypass qua Admin flag.
11. Service role không xuống browser.
12. Report lịch sử dùng đúng version.

---

# 53. Migration policy

Mọi schema change:

- migration file;
- review;
- DEV test;
- STAGING test;
- test from clean DB;
- no manual Production schema tweak.

Một migration xong khi:

- fresh DB chạy được;
- seed được;
- RLS đúng;
- tests PASS;
- không secret;
- rollback/forward-fix plan nếu rủi ro.

---

# 54. Seed policy

Tách:

- schema migration;
- master seed;
- test fixtures.

Không:

- trộn test user vào Production;
- merge assets theo tên tự động;
- sửa tên nguồn mất dấu vết.

---

# 55. Logging policy

Log kỹ thuật không chứa:

- password;
- access token;
- refresh token;
- service role;
- DB password.

Audit nghiệp vụ:

- actor;
- action;
- entity;
- before/after khi phù hợp;
- timestamp.

---

# 56. Release policy

Không deploy Production từ working tree không rõ commit.

Production cần:

- main PASS;
- tag/release;
- commit SHA;
- migration list;
- release notes;
- rollback plan.

---

# 57. Deployment sequence Production

1. Confirm Go-Live.
2. Backup.
3. Apply compatible migration.
4. Verify DB.
5. Deploy app.
6. Verify Service Worker/version.
7. Smoke.
8. Monitor.
9. Rollback/forward-fix nếu fail.

---

# 58. Risk Register FINAL

| ID | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | AI sửa lan module | Cao | task nhỏ + branch + diff |
| R2 | Sai nghiệp vụ | Cao | 4 FINAL docs |
| R3 | Sai RLS | Cao | role matrix test |
| R4 | Report sai | Cao | golden sample |
| R5 | Mất dữ liệu | Cao | backup + restore |
| R6 | App khó nhập mobile | TB/Cao | mobile-first + UAT |
| R7 | Scope phình | Cao | out-of-scope list |
| R8 | Hosting trái chính sách | Cao | HOLD P8 nếu chưa xác nhận |
| R9 | Threshold sai | Cao | file 02 source of truth |
| R10 | 7 ngày bị hiểu là Prod | Cao | Core Pilot naming |
| R11 | Duplicate asset bị merge | Cao | UUID + source order |
| R12 | Nhập bù làm sai thời gian | Cao | performed_at vs entered_at |
| R13 | Admin duyệt thay Head | Cao | RLS + explicit test |
| R14 | PWA cache dữ liệu cũ | Cao | static-only service worker |
| R15 | Offline báo đã lưu giả | Cao | no offline mutation |
| R16 | Approved bị sửa đè | Cao | DB immutability |
| R17 | Correction mất original | Cao | revision chain |
| R18 | BM.06 thiếu machine/status | Cao | 25/25 completion |
| R19 | Name/code trùng | Cao | no auto merge |
| R20 | Version mới phá lịch sử | Cao | Published immutable + snapshot |
| R21 | Agent thêm incident/attachment | TB | scope check CI/review |
| R22 | Agent thêm 3/6/12 maintenance | TB | test/spec check |
| R23 | Service role bị lộ client | Critical | env/server boundary |
| R24 | Migration Prod thủ công | Critical | migration-only policy |
| R25 | Browser/PWA phiên bản cũ | Cao | release-aware SW/update UX |

---

# 59. Decision Log FINAL

| ID | Quyết định | Trạng thái |
|---|---|---|
| D-001 | Next.js + Supabase | LOCKED |
| D-002 | PWA, không native app | LOCKED |
| D-003 | 3 business role | LOCKED |
| D-004 | Admin là flag riêng | LOCKED |
| D-005 | Chỉ Trưởng khoa approve | LOCKED |
| D-006 | Approval theo period | LOCKED |
| D-007 | Approved immutable | LOCKED |
| D-008 | Correction giữ original | LOCKED |
| D-009 | Nhập bù được phép | LOCKED |
| D-010 | Không late_reason bắt buộc | LOCKED |
| D-011 | N/A + reason | LOCKED |
| D-012 | 6 form Core Pilot | LOCKED |
| D-013 | Không incident | LOCKED |
| D-014 | Không attachment | LOCKED |
| D-015 | Không n8n MVP | LOCKED |
| D-016 | Maintenance chỉ D/W/M | LOCKED |
| D-017 | BM.06 4 slot + 25 machine | LOCKED |
| D-018 | PWA không offline mutation | LOCKED |
| D-019 | Service Worker static cache only | LOCKED |
| D-020 | 7 ngày = Core Pilot Candidate | LOCKED |

---

# 60. Traceability — screen → phase

| Screen | Phase chính |
|---|---|
| S00 Login | P2 |
| S01 Home | P3 |
| S02 Today | P3 |
| S03 Calendar | P3 |
| S04 Form Catalog | P3 |
| S05 Entry | P3 |
| S06 BM.06 | P3 |
| S07 Period | P3/P4 |
| S08 Record detail | P3/P5 |
| S09 Approval queue | P4 |
| S10 Review | P4 |
| S11 Correction | P4 |
| S12 History | P5 |
| S13 Dashboard | P5 |
| S14 Reports | P5 |
| S15 Assets | P2 |
| S16 Asset detail | P2/P5 |
| S17 Maintenance | P3 |
| S18 Locations | P2 |
| S19 Templates | P3/Admin |
| S20 Template version | P3/Admin |
| S21 Users | P2 |
| S22 Master | P2 |
| S23 Audit | P4/P6 |
| S24 Import | P2 |
| S25 Account | P2 |
| S26 PWA | P1/P6 |

---

# 61. Traceability — business form → phase

| Form | P2 | P3 | P4 | P5 | P6 |
|---|---:|---:|---:|---:|---:|
| BM.01 | master | input | approval | report | tests |
| BM.02 | tủ | input | approval | report | tests |
| BM.03 | tủ/ngăn | input | approval | report | tests |
| KNBM | location | register | approval | report | tests |
| Maintenance | asset | register | approval | dashboard/report | tests |
| BM.06 | 25 assets | shift | approval | matrix/report | tests |

---

# 62. Traceability — architecture → phase

| Architecture | Phase |
|---|---|
| Next.js foundation | P1 |
| PWA foundation | P1 |
| Supabase Auth | P2 |
| Profiles/RLS | P2 |
| Master data | P2 |
| Template/version | P3 |
| Schedule | P3 |
| Period | P3 |
| Records/details | P3 |
| Approval RPC | P4 |
| Correction | P4 |
| Audit | P4/P6 |
| Views | P5 |
| Report engine | P5 |
| Security regression | P6 |
| Backup/restore | P6/P8 |
| Production release | P8 |

---

# 63. Những phần có thể để sau Core Pilot nhưng trước Production

Nếu 7 ngày quá căng, có thể chưa polish:

- Template Builder UI nâng cao;
- Import UI nâng cao;
- chart đẹp;
- report pixel-perfect;
- branding;
- dark mode;
- global search.

Nhưng trước Production vẫn cần:

- quyền;
- user mapping;
- mã asset chuẩn;
- backup;
- restore;
- report đúng;
- runbook.

---

# 64. Những phần tuyệt đối không “để sau” nếu đã đưa Pilot

Không để sau:

- RLS;
- role;
- Admin-not-approver;
- threshold;
- slot;
- entered_at;
- N/A reason;
- Approved lock;
- correction original;
- BM.06 25 status;
- duplicate identity;
- service worker no-business-cache;
- no offline fake save.

---

# 65. Checklist trước khi bắt đầu mỗi ngày 7-day sprint

- [ ] Main xanh.
- [ ] Không migration pending.
- [ ] Test hôm trước xanh.
- [ ] Task hôm nay có scope.
- [ ] Agent đã đọc FINAL docs.
- [ ] Không blocker nghiệp vụ mới.
- [ ] Backup DEV/STAGING nếu migration lớn.

---

# 66. Checklist cuối mỗi ngày

- [ ] Code committed.
- [ ] CI PASS.
- [ ] Migration clean.
- [ ] Relevant tests PASS.
- [ ] Preview chạy.
- [ ] Mobile quick test.
- [ ] Không scope creep.
- [ ] Ghi issue còn lại.
- [ ] Main merge chỉ khi PASS.

---

# 67. Daily evidence format

Mỗi ngày nên có file/PR note:

```markdown
# Day X Evidence

## Completed
...

## Tests
...

## Screens
...

## DB migrations
...

## Known issues
...

## Blockers
...

## Scope deviations
None / ...

## Go for next day
PASS / HOLD
```

---

# 68. Exit Gate tổng hợp P0–P9

| Phase | PASS khi |
|---|---|
| P0 | 4 FINAL spec code-ready |
| P1 | repo/CI/PWA shell ổn |
| P2 | Auth/RLS/master seed PASS |
| P3 | 6 form + Today/Calendar/Period PASS |
| P4 | Approval/Return/Correction/Audit PASS |
| P5 | History/Dashboard/Report đối soát PASS |
| P6 | No Critical/High + security/PWA/restore PASS |
| P7 | UAT bắt buộc PASS + Go |
| P8 | Production release/smoke/backup PASS |
| P9 | Bàn giao/runbook/ổn định |

---

# 69. Definition of “HOLD”

Đánh dấu HOLD nếu:

- mâu thuẫn FINAL docs;
- test Critical fail;
- RLS chưa chứng minh;
- migration không reproducible;
- report sai;
- approved editable;
- restore fail;
- PWA cache business data;
- service role xuất hiện client;
- Production policy chưa được xác nhận.

HOLD không phải thất bại.

HOLD là:

> không đi tiếp với nền tảng sai.

---

# 70. Definition of “PASS”

PASS không có nghĩa “không còn bug”.

PASS nghĩa:

- mục tiêu Phase đạt;
- evidence đủ;
- không Critical/High liên quan;
- risk còn lại được ghi nhận;
- task tiếp theo không dựa trên giả định sai.

---

# 71. Quy tắc thay đổi đặc tả trong lúc code

Nếu bác sĩ/KTV thay đổi nghiệp vụ:

1. dừng task liên quan;
2. xác định file FINAL bị ảnh hưởng;
3. sửa file;
4. đánh giá migration;
5. cập nhật tests;
6. commit spec + code cùng hoặc spec trước;
7. không “code trước, tài liệu sửa sau”.

---

# 72. Quy tắc nếu AI đề xuất công nghệ mới

AI phải giải thích:

- vấn đề gì cần giải quyết;
- built-in hiện tại không đủ ở đâu;
- package/service mới thêm rủi ro gì;
- maintenance;
- bundle impact;
- rollback.

Không thêm:

- Redis;
- queue;
- n8n;
- microservice;
- database mới;

chỉ vì “best practice” chung.

---

# 73. Quy tắc no-tech owner

Người sở hữu dự án không cần đọc toàn code.

Mỗi PR phải trả lời được bằng ngôn ngữ dễ hiểu:

- thay đổi gì;
- màn hình nào;
- dữ liệu nào;
- ai được dùng;
- test thế nào;
- rollback ra sao.

AI không chỉ gửi:

- hash;
- stack trace;
- code diff thô.

---

# 74. Minimum evidence trước Pilot

Cần có:

- CI result;
- RLS test report;
- E2E result;
- UAT dry run;
- PWA install evidence;
- backup restore evidence;
- report golden sample;
- migration history.

---

# 75. Minimum evidence trước Production

Ngoài P6/P7:

- release SHA;
- migration versions;
- Production env checklist;
- backup timestamp;
- restore drill result;
- user/role sign-off;
- smoke result;
- release note;
- rollback instructions;
- Go-Live approval.

---

# 76. Production ownership checklist

Cần xác định trước P8:

- GitHub owner;
- Supabase owner;
- hosting owner;
- domain owner;
- backup owner;
- release approver;
- user administration owner.

Tên cụ thể có thể điền sau.

---

# 77. Backup retention

Chưa khóa số ngày.

Không invent.

P8 phải chốt:

- frequency;
- retention;
- restore responsibility.

Đến khi đó P1–P7 vẫn không bị chặn.

---

# 78. Data retention

Chưa khóa thời gian lưu nghiệp vụ.

MVP:

- không tự xóa history theo timer;
- không hard-delete Approved.

Policy retention chỉ thêm khi đơn vị quyết định.

---

# 79. Hosting policy

Production host chưa khóa.

Có thể dùng host hỗ trợ:

- Next.js;
- HTTPS;
- environment secret;
- server execution;
- PWA;
- preview/staging.

Vercel là một lựa chọn kỹ thuật, không phải quyết định FINAL bắt buộc.

---

# 80. Supabase environments

Khuyến nghị:

- DEV;
- STAGING;
- PROD tách.

7 ngày:

- DEV + STAGING là đủ.

Production:

- tạo PROD riêng.

---

# 81. Dữ liệu bệnh nhân

MVP không có patient data.

Trong mọi Phase:

- không thêm patient_id;
- không nhập kết quả xét nghiệm bệnh nhân;
- không kết nối LIS/HIS.

Nếu xuất hiện requirement này:

**STOP + new architecture/security review**

---

# 82. PWA versioning checklist

Mỗi release:

- app version tăng;
- SW version tương thích;
- cache static cũ dọn phù hợp;
- không trộn JS cũ/API mới;
- update prompt không phá dirty form.

---

# 83. Security checklist per PR

Nếu PR đụng data:

- [ ] RLS?
- [ ] service role?
- [ ] URL direct access?
- [ ] server validation?
- [ ] secret?
- [ ] audit?
- [ ] Approved immutability?
- [ ] cross-role test?

---

# 84. Database checklist per PR

- [ ] migration?
- [ ] constraint?
- [ ] unique?
- [ ] FK?
- [ ] RLS?
- [ ] fresh DB test?
- [ ] seed?
- [ ] no destructive manual change?

---

# 85. UI checklist per PR

- [ ] 360px
- [ ] 390px
- [ ] desktop if relevant
- [ ] loading
- [ ] empty
- [ ] error
- [ ] conflict
- [ ] offline
- [ ] labels tiếng Việt
- [ ] no hidden permission assumption
- [ ] no scope creep

---

# 86. Form checklist per PR

- [ ] đúng form code
- [ ] đúng version
- [ ] đúng slot
- [ ] đúng threshold
- [ ] đúng field
- [ ] entered_at server
- [ ] N/A rule
- [ ] nhập bù
- [ ] abnormal
- [ ] report mapping

---

# 87. BM.06 checklist riêng

- [ ] 4 slot FINAL
- [ ] 25 assets
- [ ] order 1–25
- [ ] duplicate separate
- [ ] BT/KSD/H only
- [ ] 25/25 completion
- [ ] no N/A replacement
- [ ] no incident auto-create
- [ ] mobile card UX
- [ ] matrix report

---

# 88. Approval checklist riêng

- [ ] Head only
- [ ] Admin flag irrelevant to approval
- [ ] Return reason
- [ ] completion recheck
- [ ] atomic transaction
- [ ] audit
- [ ] double-click safe
- [ ] Approved immutable

---

# 89. Correction checklist riêng

- [ ] Original preserved
- [ ] new revision
- [ ] reason
- [ ] actor/time
- [ ] Head review
- [ ] effective pointer switch atomic
- [ ] occurrence relink
- [ ] history/report use effective

---

# 90. Report checklist riêng

- [ ] server query
- [ ] correct period
- [ ] correct template version
- [ ] effective record
- [ ] Approved metadata
- [ ] N/A
- [ ] abnormal
- [ ] correction
- [ ] machine order
- [ ] golden compare

---

# 91. PWA checklist riêng

- [ ] manifest
- [ ] icons
- [ ] standalone
- [ ] Android install
- [ ] iOS Home Screen
- [ ] safe area
- [ ] offline banner
- [ ] no business cache
- [ ] no offline write
- [ ] update prompt
- [ ] dirty form protected

---

# 92. “Không làm” checklist trước merge

PR không được vô tình thêm:

- [ ] Incident
- [ ] Attachment
- [ ] n8n
- [ ] Sensor
- [ ] Native mobile
- [ ] 3/6/12 maintenance
- [ ] extra approval level
- [ ] patient/LIS/HIS
- [ ] offline mutation queue
- [ ] Admin approval bypass

Nếu có:

**REJECT PR hoặc cập nhật scope chính thức trước.**

---

# 93. Kế hoạch sau ngày 7

Ngày 7 không kết thúc dự án.

Sau đó:

### P6 đầy đủ
- hardening;
- restore;
- device testing;
- regression.

### P7
- UAT/Pilot.

### P8
- Production.

### P9
- stabilize/hand-over.

---

# 94. Ước lượng tương đối độ phức tạp theo phase

Không phải cam kết thời gian cứng.

| Phase | Độ phức tạp |
|---|---|
| P0 | Vừa — đã làm xong phần lớn |
| P1 | Dễ/Vừa |
| P2 | Vừa |
| P3 | Cao — lõi sản phẩm |
| P4 | Cao — data integrity |
| P5 | Vừa/Cao |
| P6 | Cao — chứng minh chất lượng |
| P7 | Vừa — phụ thuộc người dùng |
| P8 | Vừa/Cao — vận hành |
| P9 | Vừa |

Critical nhất:

- P3;
- P4;
- P6.

---

# 95. Nếu phát hiện architecture sai ở Day 3–5

Không “vá cho chạy”.

Thực hiện:

1. HOLD task.
2. Re-read 00/02.
3. xác định schema sai.
4. migration forward fix nếu cần.
5. update architecture nếu thật sự thay đổi.
6. regression.
7. tiếp tục sprint.

Chậm 0.5–1 ngày tốt hơn mang lỗi dữ liệu sang P4/P5.

---

# 96. Nếu bác sĩ đổi biểu mẫu trong sprint

Nếu chỉ:

- wording;
- label;
- help text;

có thể minor.

Nếu đổi:

- field bắt buộc;
- threshold;
- slot;
- cadence;
- approval;
- machine list;

là **business change**.

Phải update `02` và impact analysis.

---

# 97. Evidence folder đề xuất

Trong repo:

```text
docs/evidence/
├── p1/
├── p2/
├── p3/
├── p4/
├── p5/
├── p6/
├── uat/
└── production/
```

Có thể lưu:

- markdown summary;
- screenshots;
- test reports;
- golden comparisons.

Không commit secret/log nhạy cảm.

---

# 98. Architecture Decision Record

Dùng khi có quyết định kỹ thuật lớn.

Ví dụ:

```text
docs/decisions/
ADR-001-pwa-service-worker-strategy.md
ADR-002-report-library.md
```

Không dùng ADR để thay nghiệp vụ.

---

# 99. Core Pilot demo script

Demo 10–15 phút:

1. PWA trên mobile.
2. Login KTV.
3. Today.
4. BM.01 nhập normal.
5. BM.01 abnormal.
6. BM.06 nhập ca.
7. Sổ kỳ.
8. Login Head.
9. Approval queue.
10. Review/Approve.
11. Dashboard.
12. PDF/Excel.
13. Record detail.
14. Correction flow demo ngắn.
15. Offline banner.

---

# 100. Pilot success criteria

Pilot được coi tốt khi:

- user hoàn thành task không cần hỗ trợ liên tục;
- dữ liệu đúng;
- approval đúng;
- report đúng;
- mobile đủ dễ;
- không Critical/High;
- backup/restore chứng minh được;
- Trưởng khoa đồng ý tiến Production.

Không dùng số phần trăm “90%” như tiêu chí duy nhất.

---

# 101. Production Go/No-Go form

```markdown
## Security
- [ ] RLS PASS
- [ ] No Critical/High
- [ ] No secrets leaked

## Data
- [ ] Master data approved
- [ ] User roles approved
- [ ] Report golden samples PASS

## Operations
- [ ] Backup PASS
- [ ] Restore PASS
- [ ] Rollback ready
- [ ] Monitoring/logs accessible

## Product
- [ ] UAT PASS
- [ ] PWA/mobile PASS
- [ ] Head approval

## Decision
GO / NO-GO
```

---

# 102. Phase transition log

| Phase | Owner | Evidence | Result | Date |
|---|---|---|---|---|
| P0 | @ | 00–03 FINAL | READY/PASS | @ |
| P1 | @ | @ | PASS/HOLD | @ |
| P2 | @ | @ | PASS/HOLD | @ |
| P3 | @ | @ | PASS/HOLD | @ |
| P4 | @ | @ | PASS/HOLD | @ |
| P5 | @ | @ | PASS/HOLD | @ |
| P6 | @ | @ | PASS/HOLD | @ |
| P7 | @ | @ | PASS/HOLD | @ |
| P8 | @ | @ | PASS/HOLD | @ |
| P9 | @ | @ | PASS/HOLD | @ |

---

# 103. Những mục còn cần điền trong quá trình triển khai

Không chặn P1:

| ID | Mục | Chốt trước |
|---|---|---|
| O-01 | Tên app chính thức | P8 |
| O-02 | Logo/branding | P8 |
| O-03 | Domain | P8 |
| O-04 | Production host | P8 |
| O-05 | Chính sách cloud bệnh viện | P8 |
| O-06 | Backup retention | P8 |
| O-07 | Data retention | P8/P9 |
| O-08 | Mã asset chính thức | P8 |
| O-09 | User mapping thật đầy đủ | P7/P8 |
| O-10 | Owner các tài khoản kỹ thuật | P8 |
| O-11 | Ngày Pilot | P7 |
| O-12 | Ngày Go-Live | P8 |
| O-13 | Mức polish PDF cuối cùng | P5/P7 |

Không để những mục này quay lại làm thay đổi P0 LOCKED nếu chưa sửa spec.

---

# 104. Kết luận FINAL

Bộ đặc tả hiện đã đủ để chuyển từ thiết kế sang triển khai:

```text
00 Scope
  ↓
02 Business/Data
  ↓
01 Architecture
  ↓
03 Screen/UI/PWA
  ↓
04 Implementation Plan
  ↓
P1 Code
```

Mục tiêu thực thi:

**7 ngày → Core Pilot Candidate**

sau đó:

**P6 hardening → P7 Pilot → P8 Production → P9 ổn định**

Không đánh đổi:

- đúng nghiệp vụ;
- phân quyền;
- dữ liệu;
- test;
- backup;

để lấy tốc độ.

---

# 105. Xác nhận khóa kế hoạch

- **Admin/Điều phối:** ____________________  Ngày: __________
- **Đại diện Bác sĩ/KTV:** ____________________  Ngày: __________
- **Trưởng khoa:** ____________________  Ngày: __________

Sau khi commit file này, mọi thay đổi Phase, scope 7 ngày, Exit Gate hoặc tiêu chí Production phải được cập nhật có kiểm soát, không sửa âm thầm trong code hoặc qua chỉ dẫn miệng cho AI.
