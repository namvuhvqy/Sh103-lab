# BÁO CÁO AUDIT TOÀN DIỆN PHASE 5 (P5) — SH103-LAB
**Khoa/Bộ môn Sinh hóa — Bệnh viện Quân y 103**  
**Tài liệu tham chiếu:** Mockups M01 – M08 & M06b, Tiêu chuẩn ISO 15189:2022, Docs 00–06  
**Mục tiêu audit:** Rà soát độ trung thực UI/UX so với 9 mockup, kiểm tra tính tương thích workflow vận hành thực tế tại phòng xét nghiệm lâm sàng, xác định các điểm SAI, THIẾU và CẦN BỔ SUNG để hỗ trợ Hermes hoàn thiện P5.

---

## I. TỔNG QUAN HIỆN TRẠNG ĐỒNG BỘ DỰ ÁN
1. **Mockups:** Đã bổ sung đầy đủ 9 mockup vào `docs/mockups/p5/`:
   - `M01-home-overview.jpg` (Tổng quan)
   - `M02-temperature-humidity.jpg` (Nhiệt độ & Độ ẩm)
   - `M03-equipment-bm06.jpg` (Nhật ký thiết bị BM.06)
   - `M04-decontamination.jpg` (Khử nhiễm bề mặt)
   - `M05-approvals.jpg` (Trung tâm phê duyệt)
   - `M06-reports.jpg` (Báo cáo & Thống kê)
   - `M06b-modal-xuat-bieu-mau.jpg` (Modal Xuất biểu mẫu — Màn hình phụ của M06)
   - `M07-notifications.jpg` (Trung tâm thông báo & Thông báo quản trị)
   - `M08-incidents.jpg` (Quản lý & Báo cáo sự cố)
2. **Tài liệu:** Đã đồng bộ giữa local và GitHub remote (`origin/docs/p5-product-ui-expansion`).
3. **Phân định vai trò:** M06b chính thức được định vị là Modal tương tác trực tiếp (Dialog trên Desktop/Tablet, Bottom Sheet trên Mobile) tại màn hình M06, không phải một page điều hướng tách rời.

---

## II. ĐỐI CHIẾU CHI TIẾT UI/UX VỚI BỘ MOCKUP (M01 – M08 & M06b)

### 1. M01 — Home / Tổng quan
- **So sánh Mockup:**
  - Mockup có nhận diện thương hiệu `KHOA SINH HÓA • BV 103`, chào KTV kèm vai trò, nút chuông thông báo có badge số unread màu đỏ.
  - Banner vận hành nổi bật với gradient y tế `#0e7490` teal đậm, tóm tắt tình trạng ngày (thiết bị sẵn sàng, cảnh báo ngoài ngưỡng).
  - 4 KPI cards trực quan (Hoạt động máy, Nhiệt ẩm đạt, Khử nhiễm, Sự cố).
  - Lưới 5 khu vực (Sinh Hóa, Miễn Dịch, Huyết Học - Nước Tiểu, v.v.) hiển thị rõ tiến độ ca.
- **Thực tế code P5 hiện tại của Hermes:**
  - Hermes đã tạo `OperationalBanner` và `KpiCard` nhưng mật độ thông tin (information density) còn thô; padding lớn làm giảm tính cơ động trên màn hình di động.
  - Đã bỏ block `Priority Queue` và `Quick Actions` theo đúng chỉ đạo tinh gọn của Owner (Section 2 - Doc 06).
  - Điểm cần chỉnh: Màu sắc và bo góc (`rounded-2xl` thay vì `rounded-3xl` quá bo cong không phù hợp phần mềm bệnh viện), độ tương phản chữ xám trên nền trắng cần tăng để đạt chuẩn WCAG AA.

### 2. M02 — Nhiệt độ & Độ ẩm (BM.01, BM.02, BM.03)
- **So sánh Mockup:**
  - Phân tách rõ 3 phân hệ đo:
    1. Phòng xét nghiệm ($21 - 26^\circ\text{C}, \le 70\%$).
    2. Tủ mát ($2 - 8^\circ\text{C}$).
    3. Tủ đá ($-30 \rightarrow -10^\circ\text{C}$).
  - Có visual indicator (thanh đo màu hoặc dải an toàn) thể hiện giá trị hiện tại có nằm trong khoảng an toàn hay không.
- **Thực tế code P5 hiện tại của Hermes:**
  - Code đã nhóm đúng 13 tủ và phòng theo master data.
  - **Điểm yếu:** Chỉ hiển thị text số thô kèm badge trạng thái đơn giản, chưa có thước đo trực quan (visual gauge/safe range pill) như mockup M02; KTV khó nhận biết nhanh bằng mắt khi đi kiểm tra từng tủ.

### 3. M03 — Nhật ký hoạt động trang thiết bị BM.06 (4 ca)
- **So sánh Mockup:**
  - 25 máy được phân nhóm rõ theo 4 khu vực thực tế (9 Sinh Hóa, 8 Miễn Dịch, 4 Nước Tiểu, 4 Ly Tâm).
  - Trạng thái 4 ca: Sáng, Chiều, Tối, Đêm (Ca 1, 2, 3, 4).
  - 3 trạng thái chuẩn hóa: `BT` (Bình thường - xanh lá), `KSD` (Không sử dụng - xám), `H` (Hỏng/Bảo trì - đỏ cam).
  - Có tổng kết nhanh ở đầu trang (ví dụ: "24 Hoạt động · 1 Không dùng · 0 Hỏng").
- **Thực tế code P5 hiện tại của Hermes:**
  - Bảng 25 máy trên màn hình điện thoại bị tràn ngang, KTV phải cuộn ngang liên tục dễ bấm nhầm giữa các ca.
  - Thao tác chuyển đổi trạng thái chưa mượt (cần hỗ trợ 1-tap cycle: BT -> KSD -> H -> BT).

### 4. M04 — Khử nhiễm bề mặt (BM.01/KNBM)
- **So sánh Mockup:**
  - Danh mục bề mặt phân chia rõ theo 5 khu vực, phân tách checklist Đầu ca / Cuối ca / Xử lý sau tràn đổ bệnh phẩm.
- **Thực tế code P5 hiện tại của Hermes:**
  - Cơ bản đáp ứng logic checklist; cần lưu ý giữ đúng 5 khu vực và danh mục bề mặt theo master data, không tự sinh surface mới.

### 5. M05 — Trung tâm phê duyệt (Approval Center)
- **So sánh Mockup:**
  - Lọc theo Ngày, Kỳ, Biểu mẫu, Khu vực.
  - Thẻ phiếu hiển thị tóm tắt: người gửi, số lượng mục bất thường, trạng thái kiểm tra.
  - Nút Phê duyệt nhanh và Nút Trả về (kèm nhập lý do đính chính).
- **Thực tế code P5 hiện tại của Hermes:**
  - Đã có luồng duyệt kỳ theo vai trò.
  - **Điểm cần lưu ý:** Cần đảm bảo RLS chỉ hiển thị nút `Duyệt` cho `LAB_HEAD` hoặc `DEPUTY_HEAD`. KTV chỉ có quyền xem trạng thái.

### 6. M06 & M06b — Báo cáo & Thống kê + Modal Xuất biểu mẫu
- **So sánh Mockup M06 & M06b:**
  - M06: Tổng quan tình trạng kỳ trong tháng (Đã duyệt, Chờ duyệt, Đang mở), biểu đồ phân bố và danh sách kỳ có thể xuất.
  - M06b: Modal pop-up trực tiếp (hoặc Bottom Sheet trên mobile):
    + Chọn Tháng, Năm, Ngày, Ca (kèm phím tắt "Hôm nay", "Cả tháng").
    + Hiển thị số lượng bản ghi thực tế phù hợp từ DB (ví dụ: "8 bản ghi phù hợp kỳ đã chọn").
    + Bộ chọn 6 biểu mẫu đầu ra dạng thẻ tương tác có radio check: BM.01 PXN, BM.02 Tủ mát, BM.03 Tủ đá, BM.01 KNBM, BM.06 TTB 4 ca, BM.02 Bảo dưỡng máy.
    + Khung Xem trước (Preview) theo đúng bố cục biên bản Bệnh viện Quân y 103 (tiêu ngữ, tên khoa, mã biểu mẫu ISO, bảng dữ liệu, chữ ký KTV và Trưởng khoa).
    + Các nút xuất: `Tải Excel (.csv / .xlsx)`, `In phiếu / Lưu PDF`, `Đóng`.
- **Thực tế code P5 hiện tại của Hermes:**
  - Hermes đã tạo trang `/reports/export` dạng full-page độc lập thay vì mở modal trực tiếp từ `/reports`. Điều này làm đứt gãy luồng thao tác của người dùng.
  - Bản xem trước bảng dữ liệu đã có nhưng phần header tiêu chuẩn (Logo Viện 103, mã hiệu ISO, chữ ký điện tử phê duyệt) chưa đạt tỷ lệ chuẩn in A4.

### 7. M07 — Trung tâm thông báo (Notification Center)
- **So sánh Mockup:**
  - Phân loại rõ ràng: Tất cả / Cảnh báo nhiệt ẩm / Nhắc việc / Phê duyệt.
  - Chạm vào thông báo sẽ điều hướng trực tiếp đến đối tượng tương ứng (deep linking).
- **Thực tế code P5:**
  - Hermes đã scaffold `/notifications`, cần đảm bảo badge đếm số chưa đọc cập nhật realtime qua Supabase channel hoặc polling ngắn.

### 8. M08 — Quản lý & Báo cáo Sự cố (Incidents)
- **So sánh Mockup:**
  - Bộ lọc sự cố: Mới tiếp nhận / Đang xử lý / Đã giải quyết / Đã đóng.
  - Form tạo sự cố tiện dụng (chọn thiết bị/vị trí, phân loại mức độ, chụp/đính kèm mô tả, đề xuất CAPA).
- **Thực tế code P5:**
  - Đã có `/incidents` và `/incidents/new`. Cần hoàn thiện flow đóng sự cố và xác nhận từ Trưởng khoa.

---

## III. ĐÁNH GIÁ ỨNG DỤNG THỰC TẾ TRONG MÔI TRƯỜNG KHOA XÉT NGHIỆM

1. **Thao tác trong điều kiện lâm sàng đặc thù:**
   - KTV thường mang găng tay y tế, tay thao tác trên tablet hoặc điện thoại thông minh chuyên dụng. Các nút tương tác (nút toggle ca, nút check) bắt buộc phải đạt kích thước tối thiểu $44 \times 44\text{ px}$ với khoảng cách an toàn tránh bấm nhầm.
2. **Tính nghiêm ngặt của Ngưỡng Nhiệt độ & An toàn sinh học:**
   - Khi nhiệt độ tủ lạnh bảo quản hóa chất vượt quá $8^\circ\text{C}$ hoặc rơi xuống $<2^\circ\text{C}$, hóa chất xét nghiệm có nguy cơ biến tính ngay lập tức.
   - **Yêu cầu thực tế:** Hệ thống phải kích hoạt Cảnh báo ngay lập tức (Immediate Alert Modal/Banner) bắt buộc KTV ghi rõ nguyên nhân bất thường trước khi lưu bản ghi, đồng thời tự động đẩy thông báo sang M07.
3. **Quy trình bàn giao 4 ca xét nghiệm (BM.06):**
   - Khoa xét nghiệm hoạt động 24/7 với 4 ca trực liên tục. Mỗi KTV chỉ chịu trách nhiệm trên ca trực của mình.
   - **Yêu cầu thực tế:** Hệ thống phải cho phép "Lưu nháp theo từng ca / từng phân khu" mà không bắt buộc phải hoàn thành cả 4 ca trong ngày mới được lưu. Kỳ chỉ chuyển sang `READY_FOR_REVIEW` khi Ca 4 kết thúc và đủ 25 máy.
4. **Chuẩn hóa Pháp lý & Tiêu chuẩn ISO 15189:2022:**
   - Biểu mẫu in ấn và xuất PDF/Excel là bằng chứng thanh tra và đánh giá chất lượng phòng xét nghiệm.
   - Mọi bản xuất phải có đầy đủ: Mã tài liệu (`BM.01/QL.HTAT.01`, `BM.06/QL.TRTB.01`...), Lần ban hành (LBH: 01), Ngày ban hành, Chữ ký/Họ tên của KTV thực hiện và Trưởng khoa/Phụ trách kỹ thuật phê duyệt.

---

## IV. TỔNG KẾT: CÁC ĐIỂM SAI, THIẾU VÀ CẦN BỔ SUNG Ở P5

| Phân hệ | Hiện trạng / Điểm SAI | Điểm THIẾU | Yêu cầu BỔ SUNG cho Hermes |
| :--- | :--- | :--- | :--- |
| **M06 & M06b** | Tách thành trang URL `/reports/export` độc lập làm mất ngữ cảnh | Thiếu Component Modal pop-up trực tiếp trên M06; thiếu nút chọn nhanh "Hôm nay", "Cả tháng" | Chuyển `/reports/export` thành Dialog (Desktop) / Bottom Sheet (Mobile) ngay tại `/reports`; đồng bộ đúng mockup M06b |
| **Preview Biểu mẫu** | Layout bảng chưa đúng tỷ lệ biên bản in A4 của Viện 103 | Thiếu thông tin Mã hiệu ISO, Người thực hiện, Người phê duyệt và ngày giờ duyệt chính thức | Chuẩn hóa header form in ấn có đầy đủ tiêu ngữ Viện 103, mã biểu mẫu ISO, chữ ký số/điện tử |
| **M03 (BM.06)** | Bảng 25 máy x 4 ca cuộn ngang khó bấm trên mobile | Thiếu bộ đếm nhanh tình trạng 25 máy; thiếu toggle 1-chạm (BT/KSD/H) | Thêm thanh tóm tắt tình trạng máy; tối ưu responsive card cho từng khu vực trên mobile |
| **M02 (Nhiệt ẩm)** | Hiển thị bảng số đơn thuần | Thiếu dải an toàn (safe range pill) và cảnh báo tức thì khi ngoài ngưỡng | Thêm chỉ báo màu sắc theo dải đo ($2-8^\circ\text{C}$, $21-26^\circ\text{C}$); bật prompt ghi chú khi nhập ngoài ngưỡng |
| **M05 (Phê duyệt)** | Cần kiểm tra kỹ quyền hạn nút duyệt | Thiếu hiển thị rõ ràng các mục bất thường cần chú ý trước khi ký duyệt | Hiển thị danh sách cảnh báo/ngoại lệ ngay trên thẻ duyệt để Trưởng khoa ra quyết định nhanh |
| **UI Tokens & Layout** | Một số card dùng `rounded-3xl` quá bo cong, màu sắc chưa đồng nhất | Thiếu các thẻ trạng thái y tế chuẩn (`.clinical-badge`, `.clinical-card`) | Chuẩn hóa bảng màu Teal/Cyan y tế (`#0e7490`, `#0891b2`), bo góc chuẩn `rounded-2xl` |

---

## V. KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO
1. **Đồng bộ Docs:** Đẩy các cập nhật về M06b và báo cáo audit lên cả GitHub và local repo.
2. **Chuyển giao cho Hermes:** Bàn giao báo cáo audit để Hermes bám sát và tinh chỉnh code `src/` đạt chuẩn pixel-perfect so với bộ 9 mockup.
3. **Kiểm thử nghiệm thu:** Sử dụng tài khoản thử nghiệm `namvuhvqy@gmail.com` để rà soát toàn bộ luồng sau khi Hermes hoàn tất.
