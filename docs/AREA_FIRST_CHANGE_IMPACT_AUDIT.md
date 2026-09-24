# AREA_FIRST_CHANGE_IMPACT_AUDIT
## Đánh giá tác động chuyển đổi mô hình điều hướng sang Area-First (Khu vực → Thiết bị → Phiếu)

**Ngày lập:** 24/09/2026  
**Người thực hiện:** Antigravity / Kiến trúc sư hệ thống  
**Dự án:** Web app quản lý nội bộ Khoa/Bộ môn Sinh hóa (SH103-Lab)  
**Trạng thái:** HOÀN TẤT AUDIT TRƯỚC KHI THỰC HIỆN ĐIỀU CHỈNH 5 FILE FINAL

---

### 1. Yêu cầu thay đổi mới của Chủ dự án (Owner)

- **Vấn đề của mô hình cũ (Form-First):** Giao diện và kiến trúc điều hướng hiện tại thiên về "chọn loại biểu mẫu/chức năng" (User mở app → chọn loại biểu mẫu BM.01/BM.02/BM.06... → chọn máy hoặc điểm đo). Mô hình này không phản ánh đúng thực tế vận hành hàng ngày của Kỹ thuật viên và Bác sĩ tại khoa.
- **Mô hình mới (Area-First Navigation):** Chuyển dịch toàn bộ Information Architecture theo tư duy luồng công việc thực tế:
  $$\text{KHU VỰC LÀM VIỆC} \longrightarrow \text{TRANG THIẾT BỊ THUỘC KHU VỰC} \longrightarrow \text{CÁC PHIẾU / CÔNG VIỆC LIÊN QUAN}$$
- **Khóa 4 khu vực làm việc chính:**
  1. **Sinh hóa** (`SINH_HOA`)
  2. **Miễn dịch** (`MIEN_DICH`)
  3. **Nước tiểu** (`NUOC_TIEU`)
  4. **Ly tâm** (`LY_TAM`)
- **Nguyên tắc tổ chức:**
  - Mỗi máy xét nghiệm / thiết bị chỉ hiển thị trong đúng khu vực nghiệp vụ tương ứng.
  - Tuyệt đối không đưa toàn bộ 25 máy vào một danh sách phẳng lộn xộn trên giao diện tác nghiệp khu vực.
  - Trang chủ Mobile ưu tiên: (1) Việc cần xử lý / trạng thái ca hiện tại; (2) 4 Khu vực làm việc chính; (3) Công việc chung toàn khoa (Môi trường, Kho, Tủ lạnh...); (4) Chờ duyệt / Dashboard / Báo cáo tùy role.

---

### 2. Các file tài liệu bị ảnh hưởng

Toàn bộ 5 file Source of Truth đều bị ảnh hưởng và cần cập nhật đồng bộ:
1. `docs/00_PRODUCT_SCOPE_FINAL.md`
2. `docs/01_ARCHITECTURE_FINAL.md`
3. `docs/02_FORMS_DATA_RULES_FINAL.md`
4. `docs/03_SCREEN_MENU_UIUX_FINAL.md` (Thay đổi lớn nhất về cấu trúc màn hình)
5. `docs/04_IMPLEMENTATION_PLAN_FINAL.md`

---

### 3. Chi tiết các Section bị ảnh hưởng trong từng file

| File | Section bị ảnh hưởng | Nội dung thay đổi cụ thể |
|---|---|---|
| `00_PRODUCT_SCOPE_FINAL.md` | §1, §3.2, §3.4, §5, §7 | Thêm quyết định sản phẩm P0: "Area-first navigation là mô hình điều hướng chính". Khóa 4 khu vực làm việc chính. Phân biệt rõ: Khu vực làm việc vs Thiết bị vs Biểu mẫu. |
| `01_ARCHITECTURE_FINAL.md` | §14, §15.1, §15.2, §16.6, §21, §31 | Tận dụng `locations` và `assets.location_id`. Định nghĩa mã 4 khu vực (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`) và khu vực phụ trợ (`KHO`). Tối ưu query/index theo `(location_id, active)`. Bổ sung scope lọc theo area. |
| `02_FORMS_DATA_RULES_FINAL.md` | §10, §11, §12 | Bổ sung bảng ánh xạ chi tiết 25 thiết bị vào 4 khu vực. Phân loại rõ thiết bị đã đủ bằng chứng vs thiết bị cần đưa vào `OPEN ITEM – Cần khoa xác nhận`. Giữ nguyên 25 dòng máy nguồn BM.06. |
| `03_SCREEN_MENU_UIUX_FINAL.md` | §4, §5, §6 đến §28 | Tái thiết kế Information Architecture. Trang chủ ưu tiên 4 thẻ Khu vực làm việc. Thiết kế chi tiết màn hình Khu vực (Area Detail) và Thiết bị (Equipment Detail). Cung cấp bảng đối chiếu màn hình cũ → mới. Sửa luồng Login (bỏ tab Đăng ký tự do). |
| `04_IMPLEMENTATION_PLAN_FINAL.md` | §14 (Phase 2), §15 (Phase 3) | Điều chỉnh P2-MST-01 (Seed 4 khu vực làm việc + kho + mapping máy) và P3-UI-01/02 (Dựng khung Area-first, Area Detail, Equipment Detail, bộ lọc theo khu vực). Giữ nguyên kế hoạch 7 ngày P0–P9. |

---

### 4. Đánh giá Database: Có cần Migration bảng mới hay không?

**KẾT LUẬN: KHÔNG CẦN TẠO BẢNG DATABASE MỚI.**
- Schema thiết kế hiện hành trong `01_ARCHITECTURE_FINAL.md` đã có sẵn:
  - Bảng `locations` (`id`, `code`, `name`, `source_name`, `active`, `sort_order`).
  - Bảng `assets` có cột `location_id uuid nullable references locations(id)`.
  - Bảng `user_scope_assignments` đã có cột `location_id uuid nullable`.
- **Hành động kỹ thuật:**
  1. Chỉ cần chuẩn hóa Seed Data cho bảng `locations` với 4 mã chuẩn (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`) và vị trí lưu trữ phụ trợ (`KHO`).
  2. Cập nhật khóa ngoại `assets.location_id` cho 25 thiết bị theo bảng mapping.
  3. Đảm bảo có chỉ mục: `CREATE INDEX idx_assets_location ON assets(location_id) WHERE active = true;`.

---

### 5. Danh sách màn hình thay đổi & Bảng ánh xạ

1. **Màn hình Đăng nhập (S00):** Loại bỏ/ẩn tab "Đăng ký" tài khoản công khai. Ứng dụng nội bộ phòng xét nghiệm chỉ cho phép Admin tạo hoặc gửi lời mời (Invite) tài khoản nhằm đảm bảo an toàn thông tin y tế.
2. **Màn hình Trang chủ (S01):** Tái cấu trúc từ danh sách form sang Area-first.
3. **Màn hình mới / chuẩn hóa:**
   - `S03_AREA_LIST`: Danh sách 4 khu vực làm việc (dành cho desktop/tablet và thanh điều hướng mở rộng).
   - `S04_AREA_DETAIL`: Chi tiết một khu vực (Sinh hóa / Miễn dịch / Nước tiểu / Ly tâm) gồm: Tổng quan ca, Danh sách thiết bị trong khu, Trạng thái máy, Nhật ký hoạt động, Bảo dưỡng, Khử nhiễm khu vực, Lịch sử.
   - `S05_EQUIPMENT_DETAIL`: Chi tiết một máy (Thông tin, tình trạng ca hiện tại, nhật ký 4 ca BM.06 của máy, bảo dưỡng máy BM.02, lịch sử đo).
4. **Bảo toàn chức năng cũ:** Các màn hình nhập biểu mẫu chi tiết (BM.01, BM.02/03, KNBM, BM.06 ca × máy), Sổ kỳ (S07), Phê duyệt (S10), Đính chính (S11), Báo cáo (S14) vẫn được giữ nguyên vẹn chức năng, chỉ thay đổi điểm truy cập (entry point) thông qua khu vực hoặc thiết bị.

---

### 6. Các quy tắc nghiệp vụ đã khóa (LOCKED) — Tuyệt đối không thay đổi

1. **3 Vai trò nghiệp vụ:** Trưởng khoa / Bác sĩ phụ trách / Kỹ thuật viên.
2. **Quyền Admin:** Tách riêng bằng cờ `is_admin = true/false`. Admin không tự có quyền phê duyệt thay Trưởng khoa.
3. **Cấp phê duyệt:** Trưởng khoa là cấp phê duyệt duy nhất.
4. **Phương thức phê duyệt:** Duyệt/chốt theo kỳ/sổ, không duyệt lẻ từng lần đo hàng ngày.
5. **Nhập bù / Nhập linh động:** Cho phép nhập bù; không bắt buộc ghi lý do nhập muộn.
6. **Thời gian ghi nhận:** `entered_at` là thời gian máy chủ nhận dữ liệu thực tế, cấm backdate hệ thống.
7. **Quy tắc N/A:** Phải có lý do cụ thể; không dùng N/A thay cho `KSD` hoặc `H` trong BM.06.
8. **Bất biến sau phê duyệt:** Kỳ đã `APPROVED` là read-only; sửa đổi phải qua quy trình Đính chính (Correction), bảo toàn bản gốc.
9. **6 Biểu mẫu Core Pilot:** BM.01, BM.02, BM.03, KNBM, BM.02 Bảo dưỡng, BM.06 Bàn giao ca.
10. **Thông số BM.01:** 08:00–09:00 và 14:30–15:30; nhiệt độ 21–26°C; độ ẩm 20–80%.
11. **Thông số BM.02:** 08:00–09:00 và 14:30–15:30; nhiệt độ 2–8°C.
12. **Thông số BM.03:** Nguồn tab `NganDa`; 08:00–09:00 và 14:30–15:30; nhiệt độ -30°C đến -10°C.
13. **Thông số BM.06:** 4 ca (07:00–11:30, 11:30–13:30, 13:30–16:30, 16:30–07:00 hôm sau); 25 máy; 3 trạng thái BT / KSD / H.
14. **Bảo dưỡng:** Chỉ gồm Daily / Weekly / Monthly; không có 3/6/12 tháng trong MVP.
15. **Ranh giới Scope:** Không Incident/Sự cố; không File đính kèm; không n8n trong lõi; không native app; không dữ liệu bệnh nhân; kiến trúc Next.js + Supabase + PWA (không offline write, không sync ngầm).

---

### 7. Phân tích Dữ liệu Nguồn & Bảng Ánh xạ 25 Máy vào 4 Khu vực

Đối chiếu từ `docs/danh mục biểu mẫu/Phụ lục.docx`, `BM.06.doc` và `02_FORMS_DATA_RULES_FINAL.md`:

#### A. Nhóm 14 thiết bị ĐÃ CÓ BẰNG CHỨNG RÕ RÀNG từ tên nguồn:

| STT | Tên nguồn thiết bị | Khu vực làm việc | Căn cứ xác định |
|---:|---|:---:|---|
| 3 | Máy XN nước tiểu LabUMat 2- M1 | **Nước tiểu** | Tên chứa trực tiếp "nước tiểu" |
| 8 | Máy nước tiểu ureader Plus 2 - M1 | **Nước tiểu** | Tên chứa trực tiếp "nước tiểu" |
| 10 | Máy nước tiểu ureader Plus 2 - M2 | **Nước tiểu** | Tên chứa trực tiếp "nước tiểu" |
| 16 | Máy xét nghiệm nước tiểu LabUmat 2-M2 | **Nước tiểu** | Tên chứa trực tiếp "nước tiểu" |
| 4 | Máy Miễn dịch Cobas E602 | **Miễn dịch** | Tên chứa trực tiếp "Miễn dịch" |
| 13 | Hệ thống Automation Máy XN MD DXI-M3 | **Miễn dịch** | Tên chứa "MD" (Miễn dịch) |
| 14 | Hệ thống Automation Máy XN MD DXI-M4 | **Miễn dịch** | Tên chứa "MD" (Miễn dịch) |
| 15 | Máy xét nghiệm Miễn dịch Maglumi X3 | **Miễn dịch** | Tên chứa trực tiếp "Miễn dịch" |
| 11 | Hệ thống Automation Máy XN sinh hóa AU5800-M4-5 | **Sinh hóa** | Tên chứa trực tiếp "sinh hóa" |
| 12 | Hệ thống Automation Máy XN sinh hóa AU5800-M6 | **Sinh hóa** | Tên chứa trực tiếp "sinh hóa" |
| 21 | Máy li tâm 24 lỗ lạnh UNIVERSAL 320R | **Ly tâm** | Tên chứa trực tiếp "li tâm" |
| 22 | Máy li tâm 68 lỗ ROTOFIX 32A | **Ly tâm** | Tên chứa trực tiếp "li tâm" |
| 24 | Máy li tâm Ependox-M1 | **Ly tâm** | Tên chứa trực tiếp "li tâm" |
| 25 | Máy li tâm Ependox-M2 | **Ly tâm** | Tên chứa trực tiếp "li tâm" |

#### B. Nhóm 11 thiết bị CHƯA ĐỦ BẰNG CHỨNG VỊ TRÍ VẬT LÝ (`OPEN ITEM – Cần khoa xác nhận`):

| STT | Tên nguồn thiết bị | Đề xuất sơ bộ | Lý do đưa vào OPEN ITEM (Không tự ý đoán) |
|---:|---|:---:|---|
| 1 | Máy XN Khí Máu GEM Premier 3000 | Sinh hóa (?) | Máy đo khí máu, thường thuộc khu Sinh hóa nhưng nguồn Phụ lục không ghi rõ khu vực đặt máy. |
| 2 | Máy Primier Hb 9210 -M1 | Sinh hóa (?) | Máy sắc ký/đo HbA1c, có thể thuộc khu Sinh hóa; nguồn không ghi vị trí. |
| 5 | Máy Primier Hb 9210- M2 | Sinh hóa (?) | Tương tự STT 2. |
| 6 | Máy Primier Hb 9210- M1 (dòng 2) | Sinh hóa (?) | Tên nguồn trùng STT 2; cần xác nhận vị trí máy vật lý thực tế. |
| 7 | Máy XN SH - MD tự động ARCHITECT-2 | Sinh hóa hoặc Miễn dịch (?) | Tên chứa cả "SH - MD" (Sinh hóa - Miễn dịch); là hệ thống tích hợp cả hai chức năng. Cần khoa chốt khu vực quản lý. |
| 9 | Máy xét nghiệm khí máu Geem 3500 | Sinh hóa (?) | Máy khí máu; chưa có xác nhận vị trí đặt máy. |
| 17 | Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh | Sinh hóa (?) | Máy đo HbA1c; chưa có xác nhận vị trí đặt máy. |
| 18 | Máy XN SH-MD Anility | Sinh hóa hoặc Miễn dịch (?) | Tên chứa cả "SH-MD" (Alinity đa nhiệm). Cần khoa chốt khu vực đặt máy. |
| 19 | Máy xét nghiệm khí máu Geem 3500 (dòng 2) | Sinh hóa (?) | Tên trùng STT 9; cần xác nhận phòng/khu vực đặt máy vật lý. |
| 20 | Máy lắc VORTEX | Ly tâm hoặc Sinh hóa (?) | Thiết bị phụ trợ trộn mẫu; có thể nằm tại khu Ly tâm/xử lý bệnh phẩm hoặc khu Sinh hóa. |
| 23 | Máy lắc ngang | Ly tâm hoặc Miễn dịch (?) | Thiết bị phụ trợ lắc phản ứng/mẫu; chưa có chứng cứ vị trí nguồn. |

*Quy tắc xử lý trong Core Pilot:* 11 máy trên tạm thời được hiển thị với nhãn phụ `[Chờ khoa xác nhận khu]` trên giao diện quản trị; trên UI tác nghiệp, tạm gán theo đề xuất sơ bộ kèm cảnh báo để người dùng khoa kiểm tra trong quá trình UAT.

---

### 8. Ma trận rủi ro & Kế hoạch kiểm soát (Risk & Mitigation)

| Rủi ro | Mức độ | Biện pháp kiểm soát |
|---|:---:|---|
| **KTV vào nhầm khu vực không tìm thấy máy cần nhập** | Trung bình | Thiết kế thanh tìm kiếm nhanh (Quick Search/Switch) theo tên máy ở đầu trang chủ; giữ màn hình tổng quan BM.06 cho ca trực. |
| **BM.06 yêu cầu đủ 25 máy nhưng nhân viên nhập theo từng khu** | Cao | Cho phép lưu nháp (Draft) theo từng khu; tính năng "Hoàn tất ca" kiểm tra đủ 25/25 máy trên toàn bộ 4 khu vực trước khi đổi trạng thái Final. |
| **Mâu thuẫn dữ liệu giữa 5 file đặc tả** | Cao | Thực hiện cập nhật tuần tự theo thứ tự ưu tiên $00 \rightarrow 02 \rightarrow 01 \rightarrow 03 \rightarrow 04$, sau đó chạy script kiểm tra chéo toàn bộ. |

---
**KẾT LUẬN AUDIT:** Đủ điều kiện và cơ sở kỹ thuật để tiến hành cập nhật đồng bộ 5 file đặc tả FINAL.
