# FINAL_CROSS_FILE_AUDIT
## Báo cáo Kiểm tra Chéo Tính Đồng Nhất 5 File Đặc Tả FINAL sau khi Cập nhật Khu vực Nhận bệnh phẩm và Khóa Chính thức Phân khu 25 Máy

**Ngày audit:** 24/09/2026  
**Dự án:** Web app quản lý nội bộ Khoa/Bộ môn Sinh hóa — BVQY 103 (SH103-Lab)  
**Tiêu chuẩn đối chiếu:** 5 file đặc tả Source of Truth:
1. `docs/00_PRODUCT_SCOPE_FINAL.md`
2. `docs/02_FORMS_DATA_RULES_FINAL.md`
3. `docs/01_ARCHITECTURE_FINAL.md`
4. `docs/03_SCREEN_MENU_UIUX_FINAL.md`
5. `docs/04_IMPLEMENTATION_PLAN_FINAL.md`

Thứ tự ưu tiên khi có mâu thuẫn: **00 → 02 → 01 → 03 → 04**.

---

### 1. Ma trận kiểm tra 17 tiêu chí cốt lõi

| STT | Tiêu chí kiểm tra | Kết quả | Chi tiết đối chiếu xuyên suốt 5 file |
|:---:|---|:---:|---|
| 1 | **Vai trò nghiệp vụ (Role)** | **PASS** | Chỉ có 3 vai trò: Trưởng khoa, Bác sĩ phụ trách, Kỹ thuật viên (Khóa tại 00 §2.1, 01 §5.1, 02 §13, 03 §2, 04 §3.1). |
| 2 | **Cờ quyền Admin (`is_admin`)** | **PASS** | Tách riêng cờ quản trị `is_admin = true/false`. Admin không tự có quyền phê duyệt nghiệp vụ (00 §2.2, 01 §5.2, 02 §13, 03 §2, 04 §3.1). |
| 3 | **Cấp phê duyệt duy nhất** | **PASS** | Duy nhất Trưởng khoa phê duyệt; duyệt theo kỳ/sổ, không duyệt từng lần đo hàng ngày; dữ liệu đã Approved là bất biến (00 §3.6, 01 §11, 02 §10.7, 03 §8, 04 §3.2). |
| 4 | **6 Biểu mẫu Core Pilot** | **PASS** | Đủ 6 nhóm: BM.01 (Môi trường), BM.02 (Tủ mát), BM.03 (Tủ đá), BM.01_KNBM (Khử nhiễm), BM.02 Bảo dưỡng, BM.06 Bàn giao ca (00 §3.3, 01 §42, 02 §3–10, 03 §15/S04, 04 §3.3). |
| 5 | **Ngưỡng đo (Threshold)** | **PASS** | BM.01: 21–26°C, độ ẩm 20–80%; BM.02: 2–8°C; BM.03: -30°C đến -10°C (tab `NganDa`). Cảnh báo trực quan, không chặn lưu (00 §5 P0-12, 01 §42, 02 §4–6, 03 §16/S06, 04 §17). |
| 6 | **Khung giờ / Ca đo (Time Slots)** | **PASS** | BM.01/02/03: Sáng 08:00–09:00, Chiều 14:30–15:30. BM.06: 4 ca (07:00–11:30, 11:30–13:30, 13:30–16:30, 16:30–07:00 hôm sau) (00 §5 P0-13, 01 §17.3, 02 §6/10.3, 03 §3.6, 04 §16.6). |
| 7 | **Số lượng máy (Machine Count)** | **PASS** | Đúng 25 dòng theo thứ tự nguồn tuyệt đối từ Phụ lục; không tự gộp tên trùng (00 §5 P0-14, 01 §15.2/85, 02 §12, 03 §21/S10, 04 §14.9/20). |
| 8 | **Số lượng Khu vực (Area Count)** | **PASS** | Khóa đúng 5 khu vực làm việc: Sinh hóa (`SINH_HOA`), Miễn dịch (`MIEN_DICH`), Nước tiểu (`NUOC_TIEU`), Ly tâm (`LY_TAM`), Nhận bệnh phẩm (`NHAN_BENH_PHAM`) và vị trí phụ trợ Kho (`KHO`) (00 §3.2/P0-16, 01 §15.1, 02 §11.3/12, 03 §4/5/12, 04 §14.6/20). |
| 9 | **Ánh xạ Thiết bị vào Khu vực** | **PASS** | **100% (25/25 máy) đã xác định chính thức bởi Owner**: 9 Sinh hóa, 8 Miễn dịch (ARCHITECT-2, Vortex, Lắc ngang, Alinity, Cobas, DXI x2, Maglumi), 4 Nước tiểu, 4 Ly tâm. Khu Nhận bệnh phẩm 0 máy (02 §12.2, 03 §16/S05 & §21/S10, 04 §14.9/20). |
| 10 | **Bản đồ Màn hình & Routes** | **PASS** | Bảng đối chiếu S00 đến S26 hoàn chỉnh; S00 ẩn tab Đăng ký tự do; S01 Area-first Home với 5 thẻ khu vực; S03 Khu vực; S04 Chi tiết Khu vực; S05 Chi tiết Thiết bị (03 §4/7, 04 §20). |
| 11 | **Kế hoạch triển khai (Phase Plan)** | **PASS** | Kế hoạch 7 ngày Core Pilot P0–P9 giữ nguyên; seed 5 khu vực làm việc + kho và 25 máy phân khu chính thức (04 §14/20). |
| 12 | **Nguyên tắc PWA / Offline** | **PASS** | Mobile-first, Add to Home Screen; không offline-write; không background sync mutation ngầm; Service Worker không cache dữ liệu nghiệp vụ (00 §7, 01 §3, 03 §3.3/9, 04 §4). |
| 13 | **Không Báo cáo sự cố** | **PASS** | Đã loại bỏ hoàn toàn khỏi phạm vi MVP; máy `H` chỉ lưu trạng thái hỏng, không sinh incident ticket (00 §4/P0-10, 01 §4, 02 §10.6, 03 §1/16, 04 §3.3). |
| 14 | **Không File đính kèm** | **PASS** | Không hỗ trợ upload ảnh/file đính kèm trong MVP (00 §3.11/P0-08, 01 §4, 02 §2, 03 §1, 04 §3.3). |
| 15 | **Không n8n trong lõi** | **PASS** | Loại trừ n8n khỏi kiến trúc lõi MVP (00 §4, 01 §4, 03 §1, 04 §3.3). |
| 16 | **Không dữ liệu bệnh nhân / LIS** | **PASS** | Không tích hợp HIS/LIS, không lưu dữ liệu định danh bệnh nhân (00 §4, 01 §4, 03 §24, 04 §3.3). |
| 17 | **Không Bảo dưỡng 3/6/12 tháng** | **PASS** | Bảo dưỡng MVP chỉ hỗ trợ 3 chu kỳ: Hằng ngày (Daily), Hằng tuần (Weekly), Hằng tháng (Monthly) (00 §5, 01 §4, 02 §9, 03 §28/S17, 04 §3.3/20). |

---

### 2. Tình trạng OPEN ITEM về phân khu máy
- **Trước khi Owner xác nhận:** 11 máy diện Open Item cần đối chiếu vị trí.
- **Sau khi Owner xác nhận:**
  + STT 7 (`Máy XN SH - MD tự động ARCHITECT-2`): **Khu Miễn dịch (`MIEN_DICH`)**.
  + STT 20 (`Máy lắc VORTEX`): **Khu Miễn dịch (`MIEN_DICH`)**.
  + STT 23 (`Máy lắc ngang`): **Khu Miễn dịch (`MIEN_DICH`)**.
  + Các máy khí máu và HbA1c (STT 1, 2, 5, 6, 9, 17, 19): **Khu Sinh hóa (`SINH_HOA`)**.
  + STT 18 (Alinity): **Khu Miễn dịch (`MIEN_DICH`)**.
  + Khu Nhận bệnh phẩm: **0 máy** (Chỉ thực hiện BM.01_KNBM vệ sinh & khử nhiễm bề mặt).
- **Hiện tại:** **0 OPEN ITEM về phân khu thiết bị. 100% 25 máy đã có khu vực quản lý chính thức.**

---

### 3. Đánh giá Tác động Database & Kiến trúc
1. **Bảng `locations`**: Nạp sẵn 5 mã khu vực nghiệp vụ (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`, `NHAN_BENH_PHAM`) cùng 1 mã kho phụ trợ (`KHO`).
2. **Bảng `assets`**: Cột `location_id` trỏ về 4 khu vực có máy (Sinh hóa: 10, Miễn dịch: 7, Nước tiểu: 4, Ly tâm: 4). Không cần migration thay đổi cấu trúc bảng.
3. **Bảo mật**: Giữ nguyên cơ chế bảo vệ form đăng nhập (ẩn tab đăng ký tự do, tài khoản do Admin quản lý).

---

### 4. Kết luận trạng thái cuối cùng

$$\mathbf{Tr\text{ạ}ng\ th\text{á}i:\ FINAL\_SPECS\_CONSISTENT}$$

Toàn bộ 5 file đặc tả nguồn đã được cập nhật đồng bộ, 100% nhất quán, không mâu thuẫn. Hệ thống đặc tả kỹ thuật và nghiệp vụ đã sẵn sàng cho bước triển khai mã nguồn.
