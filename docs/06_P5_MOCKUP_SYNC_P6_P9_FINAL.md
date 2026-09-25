# 06_P5_MOCKUP_SYNC_P6_P9_FINAL

**Dự án:** SH103-Lab — Khoa/Bộ môn Sinh hóa  
**Trạng thái:** FINAL ADDENDUM — đồng bộ mockup Owner đã chốt và bổ sung gate P6–P9  
**Áp dụng:** P5 trở đi  
**Phụ thuộc:** `00–05 FINAL`  

> File này không thay đổi business rules lõi. Mục tiêu là khóa cách Hermes/Codex diễn giải 6 mockup đã chốt, giải quyết các điểm dễ hiểu sai khi code từ ảnh, và bổ sung các kiểm thử/exit gate P6–P9 cho scope mới của P5.

---

# 1. Thứ tự ưu tiên khi code P5+

1. Business rules/data/security: `00`, `02`, `01`.
2. UI/UX nền: `03`.
3. P5 scope expansion: `05_P5_PRODUCT_UI_EXPANSION_FINAL.md`.
4. **Mockup contract + P6–P9 hardening mới nhất: file `06` này.**
5. `04_IMPLEMENTATION_PLAN_FINAL.md` vẫn dùng cho lịch sử/sequencing P0–P9, nhưng các câu cũ như “không có Incident trong P5”, “không có Incident filter/chart”, hoặc P6–P9 chưa test Notification/Incident **được file 05/06 bổ sung/ghi đè từ P5 trở đi**.

Không được dùng screenshot để ghi đè nghiệp vụ, quyền, master data, threshold, slot hoặc source order.

---

# 2. Trạng thái mockup P5

## 2.1. Sáu mockup đã chốt

- `M01` — Home / Tổng quan.
- `M02` — Nhiệt độ & Độ ẩm.
- `M03` — Thiết bị / BM.06.
- `M04` — Khử nhiễm bề mặt.
- `M05` — Trung tâm phê duyệt.
- `M06` — Báo cáo & Thống kê.

Sáu mockup này đủ để khóa **visual system + 6 màn hình lõi** và Hermes có thể bắt đầu P5 UI implementation.

## 2.2. Hai mockup còn thiếu để P5 visual contract đầy đủ

- `M07` — Notification Center + Admin Announcement presentation.
- `M08` — Báo cáo sự cố: list/new/detail states.

Không cần một mockup riêng cho Admin Announcement nếu M07 có đủ hai mode: user inbox và admin compose/manage.

**Kết luận:** 6 ảnh hiện tại đủ cho core UI, nhưng **chưa đủ để gọi toàn bộ P5 visual design là CLOSED** vì Notification Center và Incident Report là scope bắt buộc của P5 theo file 05.

---

# 3. Quy tắc chung khi dùng ảnh mockup

Ảnh mockup là **visual reference**, không phải dữ liệu/spec nghiệp vụ.

Hermes/Codex phải giữ các rule sau:

- Mọi số đếm, tỷ lệ, trạng thái, chart lấy từ query thật; không hard-code số demo trong ảnh.
- Không copy tên máy/mã máy giả nếu không có trong master data.
- Không copy số “mẫu hôm nay”, patient workflow hoặc LIS/HIS từ ảnh tham chiếu khác.
- Không dùng patient-identifying data.
- Không tự tạo/logo bệnh viện chính thức. Chỉ dùng logo/brand asset khi Owner cung cấp/phê duyệt asset thật.
- Ngày/giờ/avatar/tên người trong ảnh chỉ là dữ liệu minh họa.
- Màu, khoảng trắng, typography, card hierarchy, icon style, density là phần được phép bám theo.
- Nếu mockup mâu thuẫn docs, docs thắng.

---

# 4. M01 — Home / Tổng quan FINAL

Owner đã điều chỉnh M01 để **bớt rối và rõ bố cục hơn**.

## 4.1. Layout FINAL

Home mobile gồm theo thứ tự:

1. Header: tên khoa, ca hiện tại, bell unread, avatar.
2. Một `Operational/Hero Status Banner` duy nhất.
3. Khối 4 KPI tổng quan.
4. Khối 5 khu vực làm việc.
5. Khối chức năng/phân hệ chính.
6. Bottom navigation.

## 4.2. Các khối đã loại khỏi Home FINAL

**Không có block riêng:**

- `Việc ưu tiên / Priority Queue` dạng danh sách dài.
- `Thao tác nhanh / Quick Actions` dạng một hàng CTA riêng cuối Home.

Lý do: Home phải scan nhanh, không trở thành màn task-list thứ hai.

Thông tin cần xử lý được gom vào:

- operational banner;
- badge/count trong KPI;
- badge/count trong area/module cards;
- Notification Center;
- các màn chuyên biệt.

`QuickActionButton` vẫn là design primitive hợp lệ cho screen khác; **không bắt buộc xuất hiện trên Home**.

## 4.3. Home không được copy dữ liệu demo trong ảnh

- 5 khu vực phải là: Sinh hóa 9 máy, Miễn dịch 8 máy, Nước tiểu 4 máy, Ly tâm 4 máy, Nhận bệnh phẩm 0 máy.
- Không hiển thị “số mẫu hôm nay” nếu hệ thống không có nghiệp vụ mẫu/patient/LIS.
- Hero/KPI phải phản ánh BM.01/02/03, BM.06, KNBM, Maintenance/Approval theo data thật.
- Nếu không có cảnh báo vận hành, banner có thể hiển thị trạng thái trung tính như `Vận hành ổn định` từ dữ liệu thật; không fabricate warning.

---

# 5. M02 — Nhiệt độ & Độ ẩm FINAL

Mockup M02 được hiểu là **màn tổng quan chuyên biệt**, không thay đổi cấu trúc 3 biểu mẫu nguồn.

Cho phép layout:

- summary KPI;
- date/slot filter;
- chart/trend nếu có đủ dữ liệu;
- danh sách điểm đo;
- search/filter;
- drill-down vào form nhập liệu.

Business rules bắt buộc:

- BM.01: 08:00–09:00 và 14:30–15:30; 21–26°C; RH 20–80%.
- BM.02: 13 dòng tủ/ngăn liên quan theo source; 2–8°C.
- BM.03: source `NganDa`; -30 đến -10°C.
- Humidity chỉ hiện ở các record BM.01 có humidity; không bịa humidity cho tủ.
- `16` trong mockup chỉ được dùng nếu query thật tại context đó thực sự bằng 16; không coi 16 là một master-data rule chung cho mọi view.
- Chart 24h chỉ render dữ liệu có thật; không nội suy/fabricate các giờ chưa đo.
- Entry workflow vẫn phải phân biệt `Môi trường PXN` và `Tủ lạnh/Tủ đá` hoặc route/form tương đương rõ ràng.

---

# 6. M03 — Thiết bị / BM.06 FINAL

M03 là **equipment overview + latest shift status**, không thay thế màn nhập BM.06.

Bắt buộc:

- đúng 25 machine rows từ master data;
- source order 1–25 được bảo toàn trong BM.06 matrix/entry;
- status nghiệp vụ là `BT | KSD | H`;
- 4 shift đúng spec;
- current/latest status phải truy xuất được về record/shift nguồn;
- không merge thiết bị trùng tên;
- ảnh thiết bị chỉ optional; không được dùng ảnh giả để quyết định identity.

Có thể có search/filter/pagination ở overview. Khi nhập BM.06 mobile, vẫn phải bảo đảm rule `24/25 không Complete`, `25/25 mới Complete`.

---

# 7. M04 — Khử nhiễm bề mặt FINAL

Giữ mô hình area-first và BM.01_KNBM hiện có.

Cho phép:

- summary theo khu vực;
- status `Đã hoàn thành / Đang thực hiện / Chưa thực hiện / Không áp dụng` nếu mapping đúng business state;
- ngày/ca/filter;
- history;
- drill-down vào khu vực.

Không được tự thêm checklist bề mặt chi tiết chỉ vì ảnh mockup có các dòng minh họa. Các item như `Bàn tiếp nhận mẫu`, `Khu vực phân loại` chỉ được code thành master/checklist thật khi chúng tồn tại trong source/spec đã được Owner duyệt.

KNBM vẫn giữ:

- Daily;
- Weekly flexible;
- Spill event;
- một record có thể fulfill nhiều occurrence hợp lệ;
- Spill không auto-create Incident.

`NHAN_BENH_PHAM` vẫn 0 máy và chỉ workflow khử nhiễm.

---

# 8. M05 — Trung tâm phê duyệt FINAL

Mỗi card trong Approval Center phải đại diện cho **period/register**, không phải mỗi daily record.

Bắt buộc:

- tabs/search/filter được phép;
- summary count lấy từ period state thật;
- `Chờ phê duyệt | Đã phê duyệt | Bị trả lại`;
- chỉ `DEPARTMENT_HEAD` có action Approve;
- `TECHNICIAN + is_admin=true` vẫn không được Approve;
- Return cần reason;
- Approved immutable;
- correction giữ bản gốc.

Role-specific action:

- Trưởng khoa: `Xem chi tiết`, `Trả lại`, `Phê duyệt`.
- Người nhập: với `RETURNED` có thể `Chỉnh sửa / Gửi lại` theo quyền.
- Không render `Chỉnh sửa và gửi lại` cho Trưởng khoa nếu người đó chỉ đang ở vai trò reviewer của kỳ.

---

# 9. M06 — Báo cáo & Thống kê FINAL

Cho phép:

- KPI dashboard;
- completion/abnormal/maintenance/BM.06 trend;
- filter theo thời gian/khu vực/biểu mẫu;
- distribution chart;
- recent reports;
- drill-down;
- export CTA.

Data contract:

- Dashboard tiến độ có thể dùng OPEN/READY/RETURNED theo mục đích vận hành.
- Official PDF/Excel chỉ lấy `APPROVED` + effective correction đúng rule.
- Mọi chart/count lấy từ server query thật.
- Không thêm patient/sample chart.
- Incident/notification KPI chỉ hiển thị khi module P5 đã được triển khai và RLS đúng.

---

# 10. Canonical mobile navigation P5

Để 6 mockup không sinh ra 3 bottom-nav khác nhau, code FINAL dùng một navigation contract thống nhất:

1. `Tổng quan`
2. `Nhiệt độ`
3. `Thiết bị`
4. `Khử nhiễm`
5. `Thêm`

`Thêm` chứa theo quyền:

- Khu vực;
- Hôm nay/Công việc;
- Phê duyệt;
- Báo cáo;
- Notifications;
- Incidents;
- Periods/Calendar;
- Account;
- Admin menu nếu `is_admin=true`.

Có thể dùng shortcut/card ở Home cho Phê duyệt/Báo cáo nhưng **không thay đổi bottom-nav theo từng màn**. Active state phải nhất quán.

Desktop dùng sidebar tương đương.

---

# 11. P5 Exit Gate bổ sung sau mockup review

Ngoài file 05, P5 chỉ PASS khi:

- [ ] M01 Home không có Priority Queue block và không có Quick Actions block riêng.
- [ ] 6 màn lõi bám visual hierarchy mockup nhưng dùng data thật.
- [ ] Bottom navigation thống nhất theo Section 10.
- [ ] M02 không fabricate 24h series/humidity cho dữ liệu không tồn tại.
- [ ] M03 giữ đúng 25 máy, 4 ca, BT/KSD/H.
- [ ] M04 không tự sinh checklist location/surface mới.
- [ ] M05 duyệt theo period/register và đúng role.
- [ ] M06 official export chỉ dùng Approved/effective data.
- [ ] Không có logo chính thức giả, patient workflow hay LIS/HIS data.
- [ ] M07 Notification Center visual + flow được review.
- [ ] M08 Incident list/new/detail visual + flow được review.

---

# 12. PHASE 6 — Hardening / Quality / Security / PWA / Recovery

P6 không nhận feature P5 chưa xong để hợp thức hóa P5 PASS. Sau khi P5 feature-complete, P6 bổ sung các gate sau.

## 12.1. Automated regression

Bắt buộc regression cho:

- Home aggregation/query và role-specific content;
- Notification unread/read/all-read/deep-link;
- notification idempotency, không duplicate vô hạn;
- Admin Announcement audience/expiry/deactivate;
- Incident create/read/update-state/resolve/close theo policy;
- BM.06 25 rows, 4 shift, BT/KSD/H;
- KNBM Daily/Weekly/Spill;
- Approval/Return/Correction;
- Dashboard drill-down;
- PDF/Excel official-source rule.

## 12.2. RLS/Security bổ sung

Test adversarial cho bảng/function mới:

- user không đọc notification không thuộc audience;
- non-admin không publish/deactivate announcement;
- Admin không có quyền nghiệp vụ Approve chỉ vì `is_admin=true`;
- KTV/Bác sĩ incident chỉ trong scope;
- Head xem/review incident toàn khoa theo policy;
- direct API không bypass state transition/audit;
- không patient-identifying data;
- service-role không ra browser bundle/log.

## 12.3. Visual/accessibility regression

Bắt buộc ở 390px, tablet, desktop:

- M01–M08;
- no overflow;
- text tiếng Việt không cắt;
- touch target >=44px;
- keyboard/focus usable;
- status không dựa chỉ vào màu;
- contrast hợp lý;
- loading/empty/error/success/conflict state;
- bottom nav không che content/CTA;
- PWA safe-area.

Mockup không phải pixel-perfect contract; hierarchy, density, actions và information architecture mới là contract.

## 12.4. Performance

- Không tải toàn bộ history/25×N period vào client nếu không cần.
- Server filtering/pagination.
- Chart query có bounded date range.
- Banner/image asset tối ưu kích thước.
- Không để dashboard query N+1 theo area/asset.

## 12.5. Backup/Restore bổ sung

Restore drill phải kiểm thêm:

- notifications;
- announcements;
- incidents + state/audit history;
- report/export source consistency.

Không mặc định Storage backup là business requirement nếu vẫn không có attachment.

## 12.6. PWA/Offline

- API/mutation Notification/Incident/Announcement không cache như static.
- Offline không fake read/resolve/publish/save success.
- Reconnect refresh đúng trạng thái server.
- Dirty form không tự reload làm mất dữ liệu đang nhập.

## Exit Gate P6 bổ sung

- [ ] Không Critical/High.
- [ ] P5 regression PASS.
- [ ] RLS mới PASS.
- [ ] M01–M08 visual/accessibility PASS.
- [ ] Performance budget hợp lý trên mobile.
- [ ] Backup/restore dữ liệu P5 mới PASS.
- [ ] PWA offline/reconnect PASS.
- [ ] Preview/Staging không có known 404/5xx trên core flow.

---

# 13. PHASE 7 — UAT / Pilot bổ sung

Ngoài UAT cũ, phải có người thật test:

1. Home: nhìn trong vài giây biết trạng thái tổng quan, không bị rối bởi task list dài.
2. Nhiệt độ: tìm đúng điểm đo, nhập normal/abnormal, xem history/chart không hiểu sai dữ liệu.
3. Thiết bị: tìm máy, xem latest status, nhập BM.06 đủ 25/25.
4. Khử nhiễm: Daily + Weekly + Spill, Nhận bệnh phẩm đúng 0 máy.
5. Approval: Head duyệt/return; KTV/Admin không thể approve sai quyền.
6. Reports: filter, drill-down, PDF/Excel đối soát golden sample.
7. Notification: nhận đúng audience, mở deep-link, read/unread đúng.
8. Admin Announcement: Admin publish đúng audience; user nhận đúng; expiry/deactivate đúng.
9. Incident: KTV/Bác sĩ tạo; Head review/resolve/close theo policy; không auto-create từ H/abnormal/spill.
10. PWA mobile: 390px, keyboard, Add to Home Screen, offline/reconnect.

UX evidence ghi:

- task completion time;
- số lần back/nhầm;
- text khó hiểu;
- vị trí phải zoom/scroll bất thường;
- thao tác một tay trên mobile;
- screen nào quá dày thông tin.

## Exit Gate P7 bổ sung

- [ ] M01 Home được nhóm Pilot xác nhận dễ scan hơn bản cũ.
- [ ] M07/M08 được user hiểu đúng không cần giải thích kỹ thuật.
- [ ] Không Blocker/Critical/High.
- [ ] Must-fix UX/data đã xử lý.
- [ ] Trưởng khoa Go/No-Go.

---

# 14. PHASE 8 — Production bổ sung

Trước Go-Live:

- migration Production bao gồm schema/index/RLS/function cho Notifications/Announcements/Incidents;
- không seed demo notification/incident vào Production;
- cấu hình category incident chỉ dùng bộ đã duyệt;
- brand/logo chỉ dùng asset Owner duyệt;
- verify role/audience mapping thật;
- verify report source Approved/effective;
- verify PWA icons/theme/manifest;
- verify monitoring/error logging không chứa secret/patient data.

Production smoke thêm:

1. Bell unread/read.
2. Announcement đúng audience.
3. Incident create → review/state transition bằng test context hợp lệ.
4. Approval Head-only.
5. Report preview/export.
6. Dashboard drill-down.
7. Home/Temp/Device/KNBM mobile route.

Rollback/runbook phải biết migration nào là forward-only và cách vô hiệu hóa UI mới nếu backend dependency lỗi mà không phá dữ liệu đã ghi.

## Exit Gate P8 bổ sung

- [ ] New P5 migrations applied/verified.
- [ ] Notification/Announcement/Incident smoke PASS.
- [ ] Official report/export PASS.
- [ ] Branding asset hợp lệ.
- [ ] PWA release/version đúng.
- [ ] Monitoring + rollback/runbook sẵn sàng.

---

# 15. PHASE 9 — Ổn định / Bàn giao / Backlog bổ sung

## 15.1. Theo dõi sau Go-Live

Theo dõi thêm:

- notification duplicate/missed audience;
- announcement expiry;
- incident state stuck/open quá lâu;
- report/export failure;
- dashboard latency;
- mobile layout regression;
- user confusion ở Home/More/navigation.

## 15.2. Runbook/Admin guide

Bổ sung hướng dẫn:

- publish/deactivate Announcement;
- kiểm tra audience;
- quản trị incident category;
- xem Incident timeline/audit;
- xử lý notification/report lỗi;
- export/approval troubleshooting.

Không cho Admin nghiệp vụ vượt Head approval authority.

## 15.3. User guides

KTV/Bác sĩ:

- Bell/Notification;
- Incident create;
- Temperature/Device/KNBM flows;
- Report/history view;
- offline/reconnect behavior.

Trưởng khoa:

- Approval Center;
- Incident review/resolve/close;
- Dashboard/report;
- returned/correction.

## 15.4. Backlog V1.1+

Sau dữ liệu sử dụng thực mới đánh giá:

- Web Push;
- Zalo/email notification;
- QR thiết bị;
- sensor nhiệt độ/độ ẩm;
- import lịch sử Excel;
- offline draft/sync;
- bảo dưỡng chu kỳ nâng cao nếu nghiệp vụ xác nhận;
- analytics nâng cao;
- LIS/HIS chỉ khi bệnh viện phê duyệt riêng.

Không biến external notification/n8n thành database hay quyền lõi.

## Exit Gate P9 bổ sung

- [ ] Runbook P5 modules hoàn thành.
- [ ] Admin/Head/KTV quick guide cập nhật.
- [ ] Support ownership rõ.
- [ ] Metrics/known issues được bàn giao.
- [ ] Backlog V1.1 tách khỏi production hotfix.

---

# 16. Chỉ dẫn cho Hermes/Codex

Khi implementation theo mockup:

1. Không code trực tiếp từ ảnh trước khi đọc `00–06`.
2. Layout từ ảnh; business truth từ docs.
3. Dùng component/token chung, không copy CSS từng màn.
4. Không tạo dữ liệu demo để ảnh giống screenshot.
5. Với M01, **không thêm lại Priority Queue/Quick Actions block** nếu Owner không đổi quyết định.
6. Với M02–M06, mọi text/số liệu minh họa phải được thay bằng dữ liệu/query/label đúng domain.
7. M07/M08 cần visual review trước khi P5 visual gate CLOSED.
8. Mọi PR phải có screenshot Preview thật + test evidence; không chỉ báo “đã xong”.