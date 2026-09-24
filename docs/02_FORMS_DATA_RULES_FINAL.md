# 02_FORMS_DATA_RULES_FINAL

**Dự án:** Web app quản lý biểu mẫu nội bộ Khoa/Bộ môn Sinh hóa  
**Trạng thái:** FINAL — đặc tả nghiệp vụ biểu mẫu và quy tắc dữ liệu đã khóa cho MVP/Core Pilot  
**Phụ thuộc:** `00_PRODUCT_SCOPE_FINAL.md`  
**Mục đích:** Là nguồn sự thật duy nhất cho **biểu mẫu nào tồn tại, dữ liệu nào phải lưu, lịch/ca nào áp dụng, ngưỡng nào được dùng, cách nhập bù/N-A, cách phê duyệt và cách dựng sổ/báo cáo đầu ra**.

> Nếu code, database, UI hoặc tài liệu khác mâu thuẫn với file này thì **không tự đoán và không tự sửa nghiệp vụ**. Dừng task liên quan, đối chiếu nguồn và cập nhật đặc tả trước.

---

## 1. Nguồn nghiệp vụ và thứ tự ưu tiên

### 1.1. Nguồn đã dùng

Tài liệu này được đối chiếu từ:

1. `Trả lời file 4.docx` — quyết định của khoa sau khi duyệt các câu hỏi nghiệp vụ.
2. Các quyết định bổ sung sau đó trong quá trình khóa P0:
   - cho phép nhập linh động và nhập bù;
   - không bắt buộc lý do chỉ vì nhập muộn;
   - BM.06 dùng bốn khung giờ mới;
   - Admin là quyền quản trị tách khỏi vai trò nghiệp vụ;
   - Vũ Viết Nam có thể là Kỹ thuật viên đồng thời có quyền Admin hệ thống.
3. `Phụ lục.docx` — danh sách tủ/ngăn tủ, thiết bị theo dõi, khu vực, trang thiết bị và danh sách nhân sự nguồn.
4. Bộ biểu mẫu thủ công đang dùng:
   - `BM.01_QL.HTAT_TD nhiệt độ PXN.doc`
   - `BM.02.QL.HTAT.01_TD tủ lạnh mát.xls`
   - `BM.03.QL.HTAT.01_TD tủ lạnh đá.xls`
   - `BM.01_KNBM.docx`
   - `BM.02.Bảng theo dõi - bảo dưỡng TTB.xls`
   - `BM.06. Nhật kí hoạt động TTB.docx`
5. `04_Danh_muc_bieu_mau_DataSpec_v1_1_RC_FinalReview.docx` — tài liệu audit trung gian; chỉ dùng để truy vết phát hiện, **không được ưu tiên hơn quyết định đã được khoa chốt sau đó**.

### 1.2. Thứ tự ưu tiên khi có mâu thuẫn

Từ cao xuống thấp:

1. Quyết định mới nhất đã khóa trong `00_PRODUCT_SCOPE_FINAL.md` và file này.
2. Trả lời trực tiếp của khoa/người dùng trong `Trả lời file 4.docx` và quyết định bổ sung sau đó.
3. Biểu mẫu giấy/Word/Excel đang sử dụng.
4. `Phụ lục.docx`.
5. Tài liệu RC/audit cũ.

**Không dùng repo tham khảo trên Internet để thay thế nghiệp vụ của khoa.**

---

## 2. Các quyết định thay thế nguồn cũ — phải hiểu đúng trước khi code

Bảng này cố tình ghi rõ những điểm từng có dữ liệu khác nhau để AI không lấy nhầm bản cũ.

| ID | Điểm từng mâu thuẫn | Quy tắc FINAL phải dùng |
|---|---|---|
| R-01 | BM.01 từng có ghi chú “giờ nhập 07:00–16:30” | **Không dùng 07:00–16:30 làm khóa cứng thời gian nhập.** Lịch đo vẫn là 2 lần/ngày; người dùng được nhập linh động và nhập bù. |
| R-02 | BM.03 có nhiều trang/tab và dấu vết dữ liệu cũ | **Nguồn hiện hành: tab `NganDa`.** |
| R-03 | BM.03 nguồn cũ có giờ 08:00 và 15:30 | **Dùng 08:00–09:00 và 14:30–15:30.** |
| R-04 | BM.06 bản nguồn có 07:00–12:00, 12:00–13:30, 13:30–16:00, 16:00–07:00 và có dòng lặp | **Dùng 07:00–11:30; 11:30–13:30; 13:30–16:30; 16:30–07:00 hôm sau.** |
| R-05 | BM.06 bản giấy cũ chỉ thể hiện một danh sách máy ngắn hơn | **Core Pilot dùng toàn bộ danh sách thiết bị trong `Phụ lục.docx`, giữ đúng thứ tự nguồn Phụ lục.** |
| R-06 | File bảo dưỡng nguồn có dấu vết chu kỳ 03 tháng/06 tháng/01 năm | **MVP chỉ quản lý Hằng ngày / Hằng tuần / Hằng tháng theo quyết định của khoa.** Không tự thêm 3/6/12 tháng vào Core Pilot. |
| R-07 | Biểu mẫu giấy có “Người xem xét” và “Lãnh đạo BMK” | **MVP chỉ có một cấp phê duyệt nghiệp vụ: Trưởng khoa.** |
| R-08 | Audit cũ có `late_reason` | **Không bắt buộc lý do chỉ vì nhập muộn.** Chỉ N/A/Không áp dụng mới bắt buộc lý do. |
| R-09 | Audit cũ có Báo cáo sự cố | **Báo cáo sự cố bị loại khỏi MVP/Core Pilot.** |
| R-10 | Audit cũ coi Admin như một role nghiệp vụ | **Admin là quyền quản trị riêng; vai trò nghiệp vụ chỉ có Trưởng khoa / Bác sĩ phụ trách / Kỹ thuật viên.** |

---

## 3. Danh mục biểu mẫu FINAL của MVP/Core Pilot

| # | Mã biểu mẫu | Tên | Nguồn/phiên bản | Kiểu nghiệp vụ | Chu kỳ chính | Phê duyệt |
|---:|---|---|---|---|---|---|
| 1 | `BM.01/QL.HTAT.01` | Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm | File Word nguồn; audit ghi nhận v3.0 | Đo số liệu theo thời điểm | Tháng; 2 lần/ngày | Trưởng khoa cuối kỳ/tháng |
| 2 | `BM.02/QL.HTAT.01` | Theo dõi tủ lạnh mát | Excel; v3.0 | Đo nhiệt độ tủ | Tháng; 2 lần/ngày | Trưởng khoa cuối kỳ/tháng |
| 3 | `BM.03/QL.HTAT.01` | Theo dõi tủ đông/tủ đá | Excel; v3.0; tab `NganDa` | Đo nhiệt độ tủ/ngăn đông | Tháng; 2 lần/ngày | Trưởng khoa cuối kỳ/tháng |
| 4 | `BM.01_KNBM` | Phiếu theo dõi khử nhiễm bề mặt khu vực làm việc | Word; phiên bản nguồn không xác định trong file đã nhận | Sổ đánh dấu công việc | Tháng; hằng ngày/hằng tuần/sự kiện tràn đổ | Trưởng khoa cuối kỳ/tháng |
| 5 | `BM.02/QL.TRTB.01` | Bảng theo dõi – bảo dưỡng trang thiết bị | Excel; v4.0 | Sổ bảo dưỡng | Hằng ngày/hằng tuần/hằng tháng | Trưởng khoa cuối kỳ/tháng |
| 6 | `BM.06/QL.TRTB.01` | Nhật ký hoạt động trang thiết bị | Word; v4.0 | Nhật ký nhiều máy theo ca | 4 khung giờ/ngày; kỳ từ ngày–đến ngày | Trưởng khoa khi chốt kỳ |

**Không có Báo cáo sự cố trong MVP.**

---

## 4. Quy tắc dữ liệu chung áp dụng cho tất cả biểu mẫu

### 4.1. Phân biệt thời điểm thực hiện và thời điểm nhập

Hệ thống phải lưu riêng:

- **Ngày/giờ thực hiện hoặc đo**: thời điểm nghiệp vụ mà người dùng khai báo, ví dụ đo nhiệt độ lúc 08:30.
- **Thời điểm nhập hệ thống**: thời gian hệ thống tự ghi khi người dùng lưu dữ liệu.

Quy tắc:

- Cho phép người dùng nhập sau thời điểm thực hiện.
- Cho phép nhập bù cho ngày/ca trước để hoàn thiện sổ.
- Không bắt buộc ghi lý do chỉ vì nhập muộn.
- Không được sửa/giả thời điểm hệ thống ghi nhận việc nhập.
- Dữ liệu nhập bù vẫn phải thể hiện đúng ngày/ca/kỳ mà nó thuộc về.

### 4.2. Lịch là mục tiêu thực hiện, không phải khóa cứng thao tác nhập

Các khung giờ được đặc tả trong từng biểu mẫu dùng để:

- tạo “Việc hôm nay”;
- xác định hai lần đo/ca cần có;
- xác định dữ liệu thuộc slot/ca nào;
- phát hiện còn thiếu ô nào trong sổ.

**Không dùng khung giờ để cấm người dùng nhập bù.**

### 4.3. Không áp dụng — N/A

Nếu ngày nghỉ/lễ hoặc một nhiệm vụ theo lịch không áp dụng do máy ngừng hoạt động hay lý do thực tế khác:

- cho phép đánh dấu **Không áp dụng (N/A)**;
- **bắt buộc ghi lý do**;
- N/A được coi là đã xử lý về mặt hoàn thiện sổ nhưng phải được phân biệt với “đã thực hiện”.

Riêng BM.06:

- nếu máy **không sử dụng** trong ca, dùng trạng thái `KSD`;
- nếu máy **hỏng**, dùng trạng thái `H`;
- không dùng N/A để thay thế hai trạng thái nghiệp vụ này.

### 4.4. Giá trị ngoài ngưỡng

Với biểu mẫu số đo:

- hệ thống vẫn cho lưu giá trị thực tế;
- tự gắn cờ **Bất thường** nếu ngoài khoảng đã khóa;
- không tự sửa giá trị;
- không tự chặn chỉ vì giá trị ngoài ngưỡng;
- Dashboard/báo cáo phải có khả năng lọc/đếm các lần bất thường.

### 4.5. Xác nhận người thực hiện

Trong MVP, “chữ ký/người thực hiện” trên biểu mẫu giấy được thay bằng:

- tài khoản đăng nhập;
- họ tên người dùng;
- vai trò nghiệp vụ;
- thời điểm hệ thống ghi nhận.

Không gọi đây là chữ ký số pháp lý.

### 4.6. Phê duyệt một cấp

- Chỉ **Trưởng khoa** có quyền phê duyệt nghiệp vụ.
- Bác sĩ phụ trách không tạo thành một tầng duyệt riêng.
- Các sổ định kỳ trong MVP ưu tiên **phê duyệt/chốt theo kỳ**, không bắt Trưởng khoa duyệt từng lần đo hằng ngày.
- Trưởng khoa được phép trả lại kỳ/sổ nếu cần sửa trước khi phê duyệt.

### 4.7. Sau khi phê duyệt

- Bản đã phê duyệt chuyển sang chỉ đọc.
- Không sửa đè dữ liệu gốc.
- Nếu phát hiện sai: tạo **bản đính chính** liên kết bản cũ.
- Bản đính chính phải có người tạo, thời điểm tạo và nội dung thay đổi.
- Bản gốc tiếp tục tồn tại để truy vết.

### 4.8. File đính kèm

- MVP **không yêu cầu file/ảnh đính kèm** cho sáu biểu mẫu trên.
- Các file Word/Excel/PDF do khoa cung cấp là **nguồn biểu mẫu và mẫu tham chiếu đầu ra**, không phải file nhân viên tải lên khi nhập liệu.

### 4.9. Phiên bản biểu mẫu

Mỗi dữ liệu lịch sử phải biết nó được tạo theo phiên bản biểu mẫu nào.

Khi biểu mẫu được thay đổi sau này:

- không dùng phiên bản mới để thay đổi cách hiểu dữ liệu cũ;
- sổ/PDF/Excel lịch sử phải dựng theo mã và phiên bản tương ứng của kỳ dữ liệu đó.

---

# 5. BM.01/QL.HTAT.01 — Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm

## 5.1. Nguồn và mục đích

Nguồn thủ công có:

- khu vực;
- tháng/năm;
- mã thiết bị theo dõi;
- số hiệu chính;
- ngày;
- giờ kiểm tra;
- nhiệt độ phòng;
- độ ẩm phòng;
- ghi chú;
- chữ ký/người thực hiện;
- phần Lãnh đạo BMK / Người xem xét ở cuối biểu mẫu.

MVP số hóa sổ này theo từng ngày và hai lần đo/ngày, sau đó tổng hợp lại thành sổ tháng.

## 5.2. Phạm vi khu vực

Áp dụng cho cả ba khu vực:

1. **Khu vực làm xét nghiệm sinh hóa** — thiết bị theo dõi `NAKĐT-01`.
2. **Khu vực làm xét nghiệm miễn dịch** — thiết bị theo dõi `NAKĐT-02`.
3. **Kho** — thiết bị theo dõi `NAKĐT-03`.

## 5.3. Lịch đo FINAL

Mỗi ngày cần **2 lần đo**:

- **Sáng:** 08:00–09:00.
- **Chiều:** 14:30–15:30.

Quy tắc nhập:

- lịch trên dùng để xác định hai ô cần hoàn thiện trong ngày;
- người dùng được nhập linh động và nhập bù ngoài khung giờ;
- không bắt buộc lý do nhập muộn;
- thời điểm nhập hệ thống vẫn được lưu tự động.

## 5.4. Ngưỡng FINAL

Cả 3 khu vực dùng cùng ngưỡng:

- **Nhiệt độ phòng hợp lệ:** từ **21°C đến 26°C**, tính cả hai đầu.
- **Độ ẩm hợp lệ:** từ **20% đến 80%**, tính cả hai đầu.

Cờ bất thường:

- nhiệt độ `< 21` hoặc `> 26` → bất thường;
- độ ẩm `< 20` hoặc `> 80` → bất thường.

## 5.5. Trường dữ liệu phải lưu

| Trường nghiệp vụ | Bắt buộc | Quy tắc |
|---|---|---|
| Khu vực | Có | Chọn 1 trong 3 khu vực trên. |
| Thiết bị theo dõi | Có | Tự lấy từ danh mục khu vực tại thời điểm ghi; vẫn lưu tham chiếu lịch sử. |
| Tháng/năm | Có | Xác định kỳ/sổ. |
| Ngày đo | Có | Ngày 1–31 hợp lệ của tháng. |
| Lần đo | Có | `Sáng` hoặc `Chiều`. |
| Giờ thực tế kiểm tra | Có | Người dùng nhập/chọn thời điểm thực tế. |
| Nhiệt độ phòng | Có | Số; so với ngưỡng 21–26°C. |
| Độ ẩm phòng | Có | Số; so với ngưỡng 20–80%. |
| Ghi chú | Không | Nội dung tự do. |
| Người thực hiện | Có | Tự lấy từ tài khoản đăng nhập. |
| Thời điểm nhập hệ thống | Có | Hệ thống tự ghi, không cho sửa tay. |
| Cờ bất thường | Hệ thống | Tính từ nhiệt độ/độ ẩm. |
| N/A | Tùy trường hợp | Nếu N/A thì bắt buộc lý do; không yêu cầu nhiệt độ/độ ẩm. |

## 5.6. Phê duyệt và khóa

- Dữ liệu trong tháng được tích lũy thành một sổ kỳ.
- Trưởng khoa là người phê duyệt/chốt cuối tháng.
- Không cần duyệt từng lần đo.
- Sau khi kỳ được phê duyệt, dữ liệu trong kỳ chỉ đọc; sửa sai qua bản đính chính.

## 5.7. Đầu ra

PDF/Excel phải gần cấu trúc giấy hiện hành, tối thiểu thể hiện:

- tên/mã biểu mẫu và phiên bản;
- khu vực;
- thiết bị theo dõi;
- tháng/năm;
- ngày 1–31;
- hai lần đo trong ngày;
- giờ kiểm tra;
- nhiệt độ;
- độ ẩm;
- ghi chú;
- người thực hiện/xác nhận;
- thông tin Trưởng khoa phê duyệt cuối kỳ.

## 5.8. Test bắt buộc

- `21°C` → bình thường; `<21°C` → bất thường.
- `26°C` → bình thường; `>26°C` → bất thường.
- `20%` → bình thường; `<20%` → bất thường.
- `80%` → bình thường; `>80%` → bất thường.
- Mỗi ngày sinh đúng 2 slot Sáng/Chiều.
- Nhập bù cho ngày trước vẫn lưu được và giữ `entered_at` thật.
- N/A không có lý do → không cho hoàn tất.

---

# 6. BM.02/QL.HTAT.01 — Theo dõi tủ lạnh mát

## 6.1. Nguồn và mục đích

Biểu mẫu nguồn xác định:

- nhiệt độ yêu cầu 2–8°C;
- ghi 2 lần/ngày;
- sáng 08:00–09:00;
- chiều 14:30–15:30;
- tủ có thông tin mục đích sử dụng như Mẫu BP / Hóa chất / Khác;
- có người theo dõi và phần xem xét/lãnh đạo.

## 6.2. Ngưỡng FINAL

- **Bình thường:** `2°C ≤ nhiệt độ ≤ 8°C`.
- `<2°C` hoặc `>8°C` → bất thường.

## 6.3. Lịch FINAL

Mỗi tủ/ngăn mát cần 2 lần ghi/ngày:

- **Sáng:** 08:00–09:00.
- **Chiều:** 14:30–15:30.

Cho phép nhập linh động và nhập bù; không khóa cứng thời gian nhập.

## 6.4. Phạm vi tủ/ngăn mát từ Phụ lục

Các dòng có khoảng 2–8°C được dùng cho BM.02:

| # | Tên nguồn | Mã nguồn | Thiết bị theo dõi | Khoảng | Vị trí/mục đích nguồn |
|---:|---|---|---|---|---|
| 1 | Tủ lạnh TOWASHI | `TU 02` | `NKĐT-01` | 2–8°C | HC kho lẻ |
| 2 | Tủ lạnh MITSUBISHI (mát) | `TU 03` | `NKĐT-12` | 2–8°C | Cal, QC |
| 3 | Tủ lạnh SANAKY | `TU 04` | `NKĐT-09` | 2–8°C | HC kho chính |
| 4 | Tủ lạnh SANAKY | `TU 05` | `NKĐT-05` | 2–8°C | Tủ lưu mẫu |
| 5 | Tủ lạnh LG (ngăn mát) | `TU 06` | `NKĐT-08` | 2–8°C | QC, Cal |
| 6 | Tủ lạnh MITSUBISHI (mát) | `TU 07` | `NKĐT-14` | 2–8°C | HC kho chính |
| 7 | Tủ lạnh Acuma | `TU-08` | `NKTG-01` | 2–8°C | Tủ lưu mẫu |
| 8 | Tủ lạnh Alaska | `TU 09` | `NKTG-02` | 2–8°C | HC kho chính |
| 9 | Tủ lạnh Sanaky | `TU-10` | `NKTG-03` | 2–8°C | HC kho chính |

**Quy tắc Pilot:** nếu mã chưa chuẩn/không duy nhất, dùng **tên + vị trí/ngăn** để người dùng phân biệt. Hệ thống vẫn phải có ID nội bộ riêng cho từng dòng theo dõi; chuẩn hóa mã hiển thị trước Production.

## 6.5. Mục đích sử dụng tủ

Quyết định FINAL:

- không bắt nhân viên chọn “Mẫu BP / Hóa chất / QC-Cal / Khác” mỗi lần đo;
- đây là **thuộc tính của tủ/ngăn trong danh mục**;
- khi xem sổ/báo cáo, hệ thống lấy tự động từ danh mục của tủ/ngăn.

## 6.6. Trường dữ liệu phải lưu

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| Tủ/ngăn mát | Có | Chọn từ danh mục BM.02. |
| Mã nguồn/tên/vị trí | Dữ liệu nền | Không yêu cầu nhập lại mỗi lần. |
| Thiết bị theo dõi | Dữ liệu nền | Lấy từ danh mục, lưu tham chiếu tại thời điểm ghi. |
| Ngày đo | Có | Thuộc kỳ tháng. |
| Lần đo | Có | Sáng/Chiều. |
| Giờ thực tế kiểm tra | Có | Có thể khác thời điểm nhập app. |
| Nhiệt độ | Có | So với 2–8°C. |
| Ghi chú | Không | Cho phép để trống. |
| Người thực hiện | Có | Từ tài khoản đăng nhập. |
| Thời điểm nhập | Có | Hệ thống tự ghi. |
| Bất thường | Hệ thống | Tính từ ngưỡng 2–8°C. |
| N/A | Tùy trường hợp | Bắt buộc lý do nếu sử dụng. |

## 6.7. Phê duyệt và đầu ra

- Trưởng khoa phê duyệt/chốt theo tháng.
- Sau phê duyệt: chỉ đọc, sai thì tạo đính chính.
- PDF/Excel gần giống sổ giấy, có 31 ngày × 2 lần đo, thông tin tủ/ngăn, thiết bị theo dõi, mục đích sử dụng, người thực hiện và Trưởng khoa phê duyệt.

## 6.8. Test bắt buộc

- `2°C` và `8°C` → bình thường.
- `<2°C` hoặc `>8°C` → bất thường.
- Mỗi tủ/ngăn sinh đúng hai slot/ngày.
- Người dùng không phải nhập lại mục đích tủ mỗi lần.
- Nhập bù ngoài khung giờ vẫn được lưu.

---

# 7. BM.03/QL.HTAT.01 — Theo dõi tủ đông/tủ đá

## 7.1. Nguồn hiện hành

- File: `BM.03.QL.HTAT.01_TD tủ lạnh đá.xls`.
- Phiên bản nguồn: v3.0.
- Trong file có nhiều trang/tab và dữ liệu cũ.
- **Quyết định FINAL: dùng tab `NganDa` làm nguồn hiện hành.**

## 7.2. Ngưỡng FINAL

Nguồn/khoa xác nhận khoảng **-10°C đến -30°C**.

Để so sánh số học trong code, phải hiểu là:

- **bình thường:** `-30°C ≤ nhiệt độ ≤ -10°C`;
- `< -30°C` hoặc `> -10°C` → bất thường.

Không được đảo điều kiện do cách viết “-10 đến -30” trên biểu mẫu giấy.

## 7.3. Lịch FINAL

Mỗi tủ/ngăn đông cần 2 lần ghi/ngày:

- **Sáng:** 08:00–09:00.
- **Chiều:** 14:30–15:30.

Không dùng giờ cũ 08:00 / 15:30 từ phần dữ liệu cũ của file.

## 7.4. Phạm vi tủ/ngăn đông từ Phụ lục

| # | Tên nguồn | Mã nguồn | Thiết bị theo dõi | Khoảng | Vị trí/mục đích nguồn |
|---:|---|---|---|---|---|
| 1 | Tủ âm sâu Overmed | `TU-01` | Theo hiển thị trên tủ | -30 đến -10°C | Tủ lưu mẫu |
| 2 | Tủ lạnh MITSUBISHI (đá) | `TU 03` | `NKĐT-12` | -30 đến -10°C | Cal, QC |
| 3 | Tủ lạnh LG (ngăn đông) | `TU 06` | `NKĐT-10` | -30 đến -10°C | Không ghi rõ trong phần Phụ lục đã trích |
| 4 | Tủ lạnh MITSUBISHI (đông) | `TU 07` | `NKĐT-06` | -30 đến -10°C | HC kho chính |

Tất cả ngăn đông trên dùng cùng ngưỡng FINAL.

## 7.5. Trường dữ liệu

Giống BM.02 nhưng áp dụng danh mục/ngưỡng BM.03:

- tủ/ngăn đông;
- thiết bị theo dõi hoặc “Theo hiển thị trên tủ” đối với TU-01;
- ngày;
- lần đo Sáng/Chiều;
- giờ thực tế kiểm tra;
- nhiệt độ;
- ghi chú tùy chọn;
- người thực hiện;
- thời điểm nhập hệ thống;
- cờ bất thường;
- N/A + lý do khi cần.

## 7.6. Phê duyệt, đầu ra và test

- Trưởng khoa chốt/phê duyệt cuối tháng.
- Đầu ra dùng layout hiện hành của tab `NganDa`, không dùng dữ liệu/layout cũ làm nguồn.
- `-30°C` và `-10°C` → bình thường.
- `< -30°C` hoặc `> -10°C` → bất thường.
- Hai slot/ngày.
- Nhập bù được phép.

---

# 8. BM.01_KNBM — Khử nhiễm bề mặt khu vực làm việc

## 8.1. Cấu trúc nguồn

Biểu mẫu giấy có:

- Khu vực;
- tháng/năm;
- hàng ngày 1–31;
- các cột `Hằng ngày`, `Hằng tuần`, `Khi có tràn đổ`, `Ghi chú`, `Chữ ký`;
- phần Lãnh đạo BMK và Người xem xét.

## 8.2. Quy tắc FINAL

### Hằng ngày

- Sau khi thực hiện khử nhiễm trong ngày, người thực hiện **tích đã thực hiện vào ngày đó**.
- Mỗi ngày trong kỳ có một trạng thái cho hạng mục Hằng ngày.

### Hằng tuần

- Khi thực hiện khử nhiễm hằng tuần vào ngày nào thì **tích hạng mục Hằng tuần tại đúng ngày thực hiện**.
- Không tự đặt một thứ/ngày cố định nếu khoa chưa quy định.
- Trong một tuần, sổ cần thể hiện được đã có lần khử nhiễm hằng tuần hay chưa.

### Khi có tràn đổ

- Chỉ ghi nhận khi sự kiện tràn đổ thực sự xảy ra.
- Không tạo việc “tràn đổ” bắt buộc hằng ngày.
- Khi xảy ra ngày nào thì tích tại ngày đó.
- **Không cần báo/duyệt ngay từng lần trong MVP; Trưởng khoa xem khi chốt cuối tháng.**

## 8.3. Phạm vi khu vực

Biểu mẫu gắn với một khu vực làm việc cho mỗi sổ tháng.

Danh mục khu vực dùng ít nhất ba khu vực đã có trong Phụ lục:

- Khu vực làm xét nghiệm sinh hóa.
- Khu vực làm xét nghiệm miễn dịch.
- Kho.

Nếu khoa bổ sung khu vực sau này thì thêm qua danh mục; không hard-code ba giá trị trong logic biểu mẫu.

## 8.4. Trường dữ liệu

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| Khu vực | Có | Một khu vực cho sổ/tháng. |
| Tháng/năm | Có | Kỳ sổ. |
| Ngày | Có | 1–31 tùy tháng. |
| Đã khử nhiễm hằng ngày | Có theo lịch | Boolean/tích. |
| Đã khử nhiễm hằng tuần | Khi thực hiện | Tích vào ngày thực hiện. |
| Có xử lý tràn đổ | Khi phát sinh | Tích vào ngày sự kiện. |
| Ghi chú | Không | Văn bản. |
| Người thực hiện | Có khi tích | Từ tài khoản. |
| Thời điểm nhập | Có | Hệ thống tự ghi. |
| N/A | Tùy trường hợp | N/A + lý do nếu nhiệm vụ hằng ngày không áp dụng. |

## 8.5. Phê duyệt và đầu ra

- Trưởng khoa phê duyệt/chốt cuối tháng.
- PDF/Excel giữ cấu trúc sổ 1–31 với ba nhóm cột Hằng ngày/Hằng tuần/Tràn đổ, ghi chú và người xác nhận.
- Sau chốt: chỉ đọc, sửa sai bằng đính chính.

## 8.6. Test bắt buộc

- Một ngày có thể có `Hằng ngày = Có`, `Hằng tuần = Có`, `Tràn đổ = Không` đồng thời.
- Tràn đổ không được tự sinh thành việc bắt buộc.
- Hằng tuần được ghi tại ngày thực hiện, không bắt buộc một thứ cố định.
- Cuối tháng tổng hợp đúng các ô đã tích.

---

# 9. BM.02/QL.TRTB.01 — Bảo dưỡng trang thiết bị

## 9.1. Quyết định MVP thay cho độ phức tạp của file nguồn

File nguồn có các dấu vết lịch bảo dưỡng dài hơn, nhưng khoa đã quyết định Core Pilot đơn giản hóa:

- tất cả máy dùng cùng cách theo dõi;
- app **không cần liệt kê chi tiết từng công việc bảo dưỡng của từng model máy**;
- chỉ theo dõi ba mức:
  - **Hằng ngày**;
  - **Hằng tuần**;
  - **Hằng tháng**;
- mỗi mức chỉ cần biết đã thực hiện hay chưa, cộng thông tin hoàn thành.

**Không đưa chu kỳ 03 tháng / 06 tháng / 01 năm vào MVP.** Nếu cần sau này, đó là thay đổi phạm vi/version sau.

## 9.2. Máy áp dụng

Dùng danh mục trang thiết bị trong Phụ lục. Mỗi máy là một đối tượng theo dõi bảo dưỡng riêng.

Tên/mã có thể chưa chuẩn trong Pilot; ID nội bộ phải riêng biệt. Chuẩn hóa mã hiển thị trước Production.

## 9.3. Cách ghi hằng ngày / hằng tuần / hằng tháng

- **Hằng ngày:** sau khi thực hiện thì tích hoàn thành cho ngày đó.
- **Hằng tuần:** khi thực hiện vào ngày nào thì ghi ngày thực tế hoàn thành; không tự đặt thứ cố định nếu khoa chưa quy định.
- **Hằng tháng:** khi thực hiện vào ngày nào thì ghi ngày thực tế hoàn thành; không tự đặt ngày cố định nếu khoa chưa quy định.

Điểm cần kiểm tra trên Dashboard/sổ:

- hạng mục chu kỳ đó đã được hoàn thành hay chưa;
- ngày/giờ hoàn thành;
- ai thực hiện;
- kết quả Đạt/Không đạt.

## 9.4. Trường dữ liệu bắt buộc khi đánh dấu hoàn thành

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| Máy/trang thiết bị | Có | Chọn từ danh mục. |
| Chu kỳ | Có | Hằng ngày / Hằng tuần / Hằng tháng. |
| Ngày thực hiện | Có | Ngày thực tế. |
| Giờ thực hiện | Có | Giờ thực tế. |
| Người thực hiện | Có | Từ tài khoản. |
| Kết quả | Có | Chỉ `Đạt` hoặc `Không đạt`. |
| Ghi chú | Không | Không bắt buộc trong quyết định hiện tại. |
| Thời điểm nhập hệ thống | Có | Tự động. |
| N/A | Tùy trường hợp | Nếu hạng mục không áp dụng thì lý do bắt buộc. |

Không yêu cầu file đính kèm trong MVP.

## 9.5. Phê duyệt và đầu ra

- Trưởng khoa phê duyệt/chốt sổ bảo dưỡng cuối kỳ/tháng.
- Đầu ra phải cho thấy theo từng máy: Hằng ngày/Hằng tuần/Hằng tháng đã làm hay chưa, ngày/giờ, người thực hiện, kết quả.
- Sau phê duyệt: chỉ đọc, sai thì đính chính.

## 9.6. Test bắt buộc

- Không yêu cầu người dùng chọn task chi tiết theo model máy.
- Chỉ có ba chu kỳ MVP.
- Không tự sinh lịch 3/6/12 tháng.
- Hoàn thành không có ngày/giờ/người thực hiện/kết quả → không được coi là hoàn tất.
- Kết quả chỉ nhận `Đạt` hoặc `Không đạt`.

---

# 10. BM.06/QL.TRTB.01 — Nhật ký hoạt động trang thiết bị

## 10.1. Cấu trúc nguồn

Bản giấy v4.0 có:

- Quyển số;
- Từ ngày / Đến ngày;
- Ngày tháng/năm;
- Người sử dụng;
- Lượng sử dụng (số giờ, số ca hoạt động);
- nhiều cột máy;
- mã trạng thái:
  - `BT` = Bình thường;
  - `KSD` = Không sử dụng;
  - `H` = Hỏng;
- Ghi chú;
- phần Lãnh đạo BMK cuối sổ.

## 10.2. Khung giờ FINAL

Mỗi ngày chia 4 khung giờ:

1. **07:00–11:30**
2. **11:30–13:30**
3. **13:30–16:30**
4. **16:30–07:00 hôm sau**

Không dùng các khung giờ cũ 07:00–12:00 / 13:30–16:00 trong bản nguồn cũ.

## 10.3. Danh sách máy FINAL và thứ tự hiển thị

Theo quyết định của khoa:

- dùng **toàn bộ danh sách máy trong `Phụ lục.docx`**;
- **giữ thứ tự đúng như Phụ lục**;
- không dùng danh sách 16 máy rút gọn trong mẫu BM.06 cũ làm danh sách Core Pilot.

Thứ tự FINAL:

1. Máy XN Khí Máu GEM Premier 3000
2. Máy Primier Hb 9210 -M1
3. Máy XN nước tiểu LabUMat 2- M1
4. Máy Miễn dịch Cobas E602
5. Máy Primier Hb 9210- M2
6. Máy Primier Hb 9210- M1
7. Máy XN SH - MD tự động ARCHITECT-2
8. Máy nước tiểu ureader Plus 2 - M1
9. Máy xét nghiệm khí máu Geem 3500
10. Máy nước tiểu ureader Plus 2 - M2
11. Hệ thống Automation Máy XN sinh hóa AU5800-M4-5
12. Hệ thống Automation Máy XN sinh hóa AU5800-M6
13. Hệ thống Automation Máy XN MD DXI-M3
14. Hệ thống Automation Máy XN MD DXI-M4
15. Máy xét nghiệm Miễn dịch Maglumi X3
16. Máy xét nghiệm nước tiểu LabUmat 2-M2
17. Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh Nhật Bản
18. Máy XN SH-MD Anility
19. Máy xét nghiệm khí máu Geem 3500
20. Máy lắc VORTEX
21. Máy li tâm 24 lỗ lạnh UNIVERSAL 320R
22. Máy li tâm 68 lỗ ROTOFIX 32A
23. Máy lắc ngang
24. Máy li tâm Ependox-M1
25. Máy li tâm Ependox-M2

### Lưu ý về tên lặp

Nguồn Phụ lục có tên lặp/không đồng nhất, ví dụ:

- `Máy Primier Hb 9210 -M1` xuất hiện hơn một lần theo cách ghi nguồn;
- `Máy xét nghiệm khí máu Geem 3500` xuất hiện hơn một lần;
- nhiều thiết bị chưa có mã tài sản chuẩn.

**Pilot:** không tự gộp các dòng trùng tên. Mỗi dòng nguồn là một đối tượng riêng trong danh mục bằng ID nội bộ; tạm dùng tên + vị trí/thứ tự để phân biệt nếu cần.  
**Production:** phải chuẩn hóa mã/tên chính thức trước khi dùng dữ liệu thật lâu dài.

## 10.4. Trạng thái máy FINAL

Mỗi máy trong mỗi khung giờ phải nhận một trong ba trạng thái:

- `BT` — Bình thường.
- `KSD` — Không sử dụng.
- `H` — Hỏng.

Không tự thêm trạng thái khác vào MVP nếu chưa cập nhật đặc tả.

## 10.5. Trường dữ liệu của một dòng/ca

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| Kỳ sổ | Có | Có ngày bắt đầu/ngày kết thúc; có thể có quyển số. |
| Ngày | Có | Ngày của ca. |
| Khung giờ | Có | Một trong 4 khung giờ FINAL. |
| Người sử dụng/người ghi | Có | Từ tài khoản; UI có thể hiển thị họ tên. |
| Lượng sử dụng | Có trong cấu trúc nguồn | Cho nhập số giờ hoặc số ca hoạt động theo cách khoa đang ghi; không dùng để thay thế trạng thái từng máy. |
| Trạng thái từng máy | Có | Mỗi máy chọn BT/KSD/H. |
| Ghi chú | Không | Văn bản. |
| Thời điểm nhập hệ thống | Có | Tự động. |

### Quy tắc hoàn tất ca

Một ca chỉ được coi là hoàn tất khi:

- có ngày và khung giờ;
- có người ghi;
- toàn bộ máy nằm trong danh sách áp dụng đã có trạng thái BT/KSD/H;
- dữ liệu được lưu thành công.

Nếu máy không dùng trong ca → `KSD`; nếu hỏng → `H`.

## 10.6. UI nhập và dữ liệu lưu (Hỗ trợ theo Khu vực và Toàn khoa)

Nghiệp vụ yêu cầu một ca có nhiều máy, dữ liệu hỗ trợ nhập linh hoạt theo 2 phương thức:

1. **Phương thức theo Khu vực (Area-first — ưu tiên hàng ngày):**
   - KTV vào Khu vực làm việc (Sinh hóa / Miễn dịch / Nước tiểu / Ly tâm);
   - Chọn ca hiện tại;
   - Chỉ hiển thị các máy thuộc khu vực đó để KTV kiểm tra và chọn BT/KSD/H;
   - Cho phép lưu nháp (Draft) tiến độ nhập của khu vực mà không bắt buộc phải hoàn tất cả 25 máy ngay lập tức.
2. **Phương thức Toàn khoa (Tổng hợp ca):**
   - Xem tổng quan toàn bộ 25 máy theo đúng thứ tự nguồn;
   - Kiểm tra các máy đã có trạng thái và các máy còn thiếu theo từng khu vực;
   - Hoàn tất ca (Finalize) khi và chỉ khi toàn bộ 25/25 máy của cả 4 khu vực đã có trạng thái BT/KSD/H.

Không bắt người dùng mở 25 biểu mẫu riêng lẻ cho 25 máy.

## 10.7. Phê duyệt và đầu ra

- BM.06 có kỳ từ ngày–đến ngày, không bắt buộc phải đúng một tháng nếu nguồn kỳ khác.
- Trưởng khoa phê duyệt/chốt khi kỳ kết thúc.
- Đầu ra PDF/Excel là ma trận **ca × máy**, gần cấu trúc sổ hiện hành.
- Phải hiển thị giải thích BT/KSD/H.
- Sau phê duyệt: chỉ đọc; sửa sai qua đính chính.

## 10.8. Test bắt buộc

- Mỗi ngày tạo đúng 4 khung giờ FINAL.
- Danh sách máy đúng 25 dòng và đúng thứ tự nguồn.
- Không tự gộp hai dòng chỉ vì tên giống nhau.
- Chỉ cho chọn BT/KSD/H.
- Thiếu trạng thái của một máy → ca chưa hoàn tất.
- KSD và H được giữ nguyên trong báo cáo; không đổi thành N/A.

---

# 11. Master data — tủ, khu vực và thiết bị theo dõi

## 11.1. Nguyên tắc

- Không dùng mã hiển thị làm khóa duy nhất trong database vì nguồn có mã trùng.
- Mỗi đối tượng phải có ID nội bộ riêng.
- Trong Pilot được phép phân biệt bằng tên + vị trí/ngăn + thứ tự nguồn.
- Không tự gộp hai dòng nguồn nếu chưa có xác nhận đó là cùng một thiết bị vật lý.
- Chuẩn hóa mã chính thức trước Production.

## 11.2. Danh sách tủ/ngăn tủ nguồn — đủ 13 dòng

| # | Tên | Mã nguồn | Thiết bị theo dõi | Khoảng nguồn | Vị trí/mục đích |
|---:|---|---|---|---|---|
| 1 | Tủ âm sâu Overmed | TU-01 | Theo hiển thị trên tủ | -30 đến -10°C | Tủ lưu mẫu |
| 2 | Tủ lạnh TOWASHI | TU 02 | NKĐT-01 | 2–8°C | HC kho lẻ |
| 3 | Tủ lạnh MITSUBISHI (mát) | TU 03 | NKĐT-12 | 2–8°C | Cal, QC |
| 4 | Tủ lạnh MITSUBISHI (đá) | TU 03 | NKĐT-12 | -30 đến -10°C | Cal, QC |
| 5 | Tủ lạnh SANAKY | TU 04 | NKĐT-09 | 2–8°C | HC kho chính |
| 6 | Tủ lạnh SANAKY | TU 05 | NKĐT-05 | 2–8°C | Tủ lưu mẫu |
| 7 | Tủ lạnh LG (ngăn mát) | TU 06 | NKĐT-08 | 2–8°C | QC, Cal |
| 8 | Tủ lạnh LG (ngăn đông) | TU 06 | NKĐT-10 | -30 đến -10°C | Không ghi rõ trong phần Phụ lục đã trích |
| 9 | Tủ lạnh MITSUBISHI (mát) | TU 07 | NKĐT-14 | 2–8°C | HC kho chính |
| 10 | Tủ lạnh MITSUBISHI (đông) | TU 07 | NKĐT-06 | -30 đến -10°C | HC kho chính |
| 11 | Tủ lạnh Acuma | TU-08 | NKTG-01 | 2–8°C | Tủ lưu mẫu |
| 12 | Tủ lạnh Alaska | TU 09 | NKTG-02 | 2–8°C | HC kho chính |
| 13 | Tủ lạnh Sanaky | TU-10 | NKTG-03 | 2–8°C | HC kho chính |

### Tủ có cùng mã nhưng nhiều ngăn

`TU 03`, `TU 06`, `TU 07` có các ngăn/loại theo dõi khác nhau. Trong biểu mẫu và dữ liệu lịch sử phải phân biệt được từng dòng/ngăn; không được vì trùng mã nguồn mà ghi đè hoặc gộp dữ liệu nhiệt độ.

## 11.3. Khu vực làm việc chính và thiết bị theo dõi môi trường

Khoa chuẩn hóa **5 khu vực làm việc**:
1. **Khu Sinh hóa** (`SINH_HOA`)
2. **Khu Miễn dịch** (`MIEN_DICH`)
3. **Khu Nước tiểu** (`NUOC_TIEU`)
4. **Khu Ly tâm** (`LY_TAM`)
5. **Khu Nhận bệnh phẩm** (`NHAN_BENH_PHAM`) — Chỉ thực hiện vệ sinh và khử nhiễm bề mặt (BM.01_KNBM), không có máy xét nghiệm.
Và vị trí lưu trữ phụ trợ: **Kho / Lưu mẫu** (`KHO`).

| Mã Khu vực | Tên khu vực | Mã thiết bị theo dõi | Biểu mẫu áp dụng tại khu vực | Đặc thù nghiệp vụ |
|---|---|---|---|---|
| `SINH_HOA` | Khu vực làm xét nghiệm Sinh hóa | NAKĐT-01 | BM.01 (Môi trường), BM.01_KNBM (Khử nhiễm bề mặt), BM.06 (9 máy), BM.02 (Bảo dưỡng) | Xét nghiệm hóa sinh, khí máu, HbA1c |
| `MIEN_DICH` | Khu vực làm xét nghiệm Miễn dịch | NAKĐT-02 | BM.01 (Môi trường), BM.01_KNBM (Khử nhiễm bề mặt), BM.06 (8 máy), BM.02 (Bảo dưỡng) | Xét nghiệm miễn dịch, ARCHITECT, Alinity, máy lắc |
| `NUOC_TIEU` | Khu vực làm xét nghiệm Nước tiểu | *(Chờ khoa bổ sung điểm đo nếu có)* | BM.01_KNBM (Khử nhiễm bề mặt), BM.06 (4 máy), BM.02 (Bảo dưỡng) | Tổng phân tích nước tiểu & cặn lắng |
| `LY_TAM` | Khu vực Ly tâm | *(Chờ khoa bổ sung điểm đo nếu có)* | BM.01_KNBM (Khử nhiễm bề mặt), BM.06 (4 máy), BM.02 (Bảo dưỡng) | Tách huyết thanh/huyết tương |
| `NHAN_BENH_PHAM` | Khu vực Nhận bệnh phẩm | *(Chờ khoa bổ sung điểm đo nếu có)* | BM.01_KNBM (Khử nhiễm bề mặt hằng ngày, tuần, tràn đổ) | Tiếp nhận, đối chiếu mẫu ban đầu; **không có máy** |
| `KHO` | Kho hóa chất / Kho lưu mẫu | NAKĐT-03 | BM.01 (Môi trường kho), BM.02/BM.03 (Tủ lưu kho chính/kho lẻ) | Lưu trữ hóa chất, sinh phẩm, mẫu lưu |

Khi thiết bị theo dõi thay đổi trong tương lai, dữ liệu cũ phải vẫn biết thiết bị nào đã được dùng tại thời điểm ghi; không cập nhật ngược lịch sử sang thiết bị mới.

---

# 12. Master data — danh mục 25 trang thiết bị và ánh xạ vào các Khu vực làm việc

## 12.1. Nguyên tắc ánh xạ

1. Danh sách nguồn gồm **đúng 25 dòng** và phải được **giữ nguyên thứ tự tuyệt đối** trong BM.06 Core Pilot.
2. Mỗi máy được gán một `location_id` trỏ về bảng `locations` tương ứng với một trong các khu vực làm việc có trang thiết bị (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`). Khu `NHAN_BENH_PHAM` không có máy.
3. **Trạng thái xác nhận (LOCKED):** Toàn bộ 25 máy đã được Owner xác nhận chính thức phân khu:
   - 14 máy đã xác định chắc chắn từ nguồn tài liệu ban đầu;
   - 11 máy trước đây để diện Open Item nay đã được Owner xác nhận chính thức: STT 7 (ARCHITECT-2) thuộc Miễn dịch, STT 20 (Vortex) thuộc Miễn dịch, STT 23 (Lắc ngang) thuộc Miễn dịch; các máy khí máu và HbA1c (STT 1, 2, 5, 6, 9, 17, 19) thuộc Sinh hóa; Alinity (STT 18) thuộc Miễn dịch.
   - **Hiện tại: 0 OPEN ITEM về phân khu thiết bị.**
4. Không tự sửa chính tả/tên nguồn trong dữ liệu seed FINAL nếu việc sửa có thể làm hai máy thành một.

## 12.2. Bảng ánh xạ chi tiết 25 thiết bị (Đã khóa chính thức)

| STT | Tên nguồn thiết bị | Khu vực làm việc chính thức | Mã vị trí | Trạng thái xác nhận | Căn cứ xác định / Quyết định Owner |
|---:|---|:---:|:---:|:---:|---|
| 1 | Máy XN Khí Máu GEM Premier 3000 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Máy đo khí máu; Owner chốt thuộc khu Sinh hóa. |
| 2 | Máy Primier Hb 9210 -M1 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Máy sắc ký đo HbA1c; Owner chốt thuộc khu Sinh hóa. |
| 3 | Máy XN nước tiểu LabUMat 2- M1 | Nước tiểu | `NUOC_TIEU` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "nước tiểu". |
| 4 | Máy Miễn dịch Cobas E602 | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "Miễn dịch". |
| 5 | Máy Primier Hb 9210- M2 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Máy đo HbA1c số 2; Owner chốt thuộc khu Sinh hóa. |
| 6 | Máy Primier Hb 9210- M1 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn trùng STT 2 (dòng 2); Owner chốt thuộc khu Sinh hóa. |
| 7 | Máy XN SH - MD tự động ARCHITECT-2 | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Hệ thống SH-MD; Owner chốt giao khu Miễn dịch quản lý. |
| 8 | Máy nước tiểu ureader Plus 2 - M1 | Nước tiểu | `NUOC_TIEU` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "nước tiểu". |
| 9 | Máy xét nghiệm khí máu Geem 3500 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Máy đo khí máu Geem 3500; Owner chốt thuộc khu Sinh hóa. |
| 10 | Máy nước tiểu ureader Plus 2 - M2 | Nước tiểu | `NUOC_TIEU` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "nước tiểu". |
| 11 | Hệ thống Automation Máy XN sinh hóa AU5800-M4-5 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "sinh hóa". |
| 12 | Hệ thống Automation Máy XN sinh hóa AU5800-M6 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "sinh hóa". |
| 13 | Hệ thống Automation Máy XN MD DXI-M3 | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "MD" (Miễn dịch). |
| 14 | Hệ thống Automation Máy XN MD DXI-M4 | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "MD" (Miễn dịch). |
| 15 | Máy xét nghiệm Miễn dịch Maglumi X3 | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "Miễn dịch". |
| 16 | Máy xét nghiệm nước tiểu LabUmat 2-M2 | Nước tiểu | `NUOC_TIEU` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "nước tiểu". |
| 17 | Máy xét nghiệm HbA1C-HLC-723G11 — Hãng Tosoh Nhật Bản | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Máy HPLC đo HbA1c; Owner chốt thuộc khu Sinh hóa. |
| 18 | Máy XN SH-MD Anility | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Hệ thống đa nhiệm Alinity c/i; Owner chốt thuộc khu Miễn dịch. |
| 19 | Máy xét nghiệm khí máu Geem 3500 | Sinh hóa | `SINH_HOA` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên trùng STT 9 (dòng 2); Owner chốt thuộc khu Sinh hóa. |
| 20 | Máy lắc VORTEX | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Thiết bị lắc xoay trộn mẫu; Owner chốt thuộc khu Miễn dịch. |
| 21 | Máy li tâm 24 lỗ lạnh UNIVERSAL 320R | Ly tâm | `LY_TAM` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "li tâm". |
| 22 | Máy li tâm 68 lỗ ROTOFIX 32A | Ly tâm | `LY_TAM` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "li tâm". |
| 23 | Máy lắc ngang | Miễn dịch | `MIEN_DICH` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Thiết bị lắc ngang; Owner chốt thuộc khu Miễn dịch. |
| 24 | Máy li tâm Ependox-M1 | Ly tâm | `LY_TAM` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "li tâm". |
| 25 | Máy li tâm Ependox-M2 | Ly tâm | `LY_TAM` | **ĐÃ XÁC NHẬN CHÍNH THỨC** | Tên nguồn ghi rõ "li tâm". |

## 12.3. Thống kê phân bổ thiết bị theo khu vực chính thức

- **Khu Sinh hóa (`SINH_HOA`):** Đúng **9 máy** (STT 1, 2, 5, 6, 9, 11, 12, 17, 19).
- **Khu Miễn dịch (`MIEN_DICH`):** Đúng **8 máy** (STT 4, 7, 13, 14, 15, 18, 20, 23).
- **Khu Nước tiểu (`NUOC_TIEU`):** Đúng **4 máy** (STT 3, 8, 10, 16).
- **Khu Ly tâm (`LY_TAM`):** Đúng **4 máy** (STT 21, 22, 24, 25).
- **Khu Nhận bệnh phẩm (`NHAN_BENH_PHAM`):** **0 máy** (chỉ có biểu mẫu khử nhiễm bề mặt BM.01_KNBM).
- **Tổng cộng:** Đúng **25 máy**; **100% (25/25 máy) đã xác định chính thức, 0 OPEN ITEM**.

## 12.4. Quy tắc áp dụng biểu mẫu cho từng thiết bị và khu vực

1. **BM.06 (Nhật ký 4 ca):** Áp dụng bắt buộc cho toàn bộ 25 máy theo 4 khung giờ mỗi ngày (9 Sinh hóa, 8 Miễn dịch, 4 Nước tiểu, 4 Ly tâm).
2. **BM.02/QL.TRTB.01 (Bảo dưỡng thiết bị):** Áp dụng theo chu kỳ Daily / Weekly / Monthly cho các máy có yêu cầu bảo dưỡng theo danh mục kỹ thuật của khoa.
3. **BM.01_KNBM (Khử nhiễm bề mặt):** Áp dụng theo **Khu vực làm việc** (`location_id`) cho cả 5 khu vực (`SINH_HOA`, `MIEN_DICH`, `NUOC_TIEU`, `LY_TAM`, `NHAN_BENH_PHAM`), gồm chu kỳ Hằng ngày (Daily), Hằng tuần (Weekly) và Xử lý tràn đổ (Spill).
4. **BM.01 (Nhiệt độ - Độ ẩm PXN):** Áp dụng cho các điểm đo môi trường được gán vào khu vực Sinh hóa, Miễn dịch và Kho.
5. **BM.02 / BM.03 (Tủ lạnh mát / Tủ đá):** Áp dụng cho 13 dòng tủ/ngăn tủ; hiển thị tại nhóm "Công việc chung toàn khoa" hoặc theo vị trí đặt tủ (Kho lẻ, Kho chính, Tủ lưu mẫu, QC/Cal).

---

# 13. Quy tắc dữ liệu người dùng liên quan đến biểu mẫu

Chi tiết mô hình vai trò thuộc `00_PRODUCT_SCOPE_FINAL.md`. File này chỉ khóa những điểm ảnh hưởng trực tiếp đến biểu mẫu:

- vai trò nghiệp vụ: Trưởng khoa / Bác sĩ phụ trách / Kỹ thuật viên;
- chỉ Trưởng khoa có quyền phê duyệt nghiệp vụ;
- KTV và Bác sĩ phụ trách có thể nhập biểu mẫu theo phạm vi được cấp;
- `is_admin` không làm người dùng tự động trở thành Trưởng khoa;
- Vũ Viết Nam có thể là `Kỹ thuật viên` và đồng thời `is_admin = true`;
- quyền Admin hệ thống không được dùng để giả phê duyệt thay Trưởng khoa.

### 13.1. Hai điểm nhân sự chưa cần khóa để code Form Engine

Nguồn trả lời còn hai trường hợp không đủ dữ liệu để xác định vai trò nghiệp vụ chính xác trong ba role mới:

- Đậu Văn Hoàng — được ghi `Admin app`, nhưng vai trò nghiệp vụ chưa được chốt trong nguồn hiện tại.
- Ngô Trung Hiếu — được ghi `Admin app`, nhưng vai trò nghiệp vụ chưa được chốt trong nguồn hiện tại.
- Đàm Thị Phương Lan — được ghi `Nhân viên quản lý hồ sơ`; MVP không tạo role riêng, nhưng chưa có xác nhận cuối là Bác sĩ phụ trách hay Kỹ thuật viên.

Quy tắc:

- không để ba điểm này chặn P1/Form Engine;
- tài khoản test có thể dùng dữ liệu giả;
- trước khi tạo tài khoản Production thật, phải gán mỗi người một vai trò nghiệp vụ hợp lệ; quyền Admin được gán riêng nếu cần.

---

# 14. Data dictionary chuẩn cho implementation

Phần này dùng để tránh mỗi module đặt một tên dữ liệu khác nhau. Kiến trúc database chi tiết sẽ nằm trong `01_ARCHITECTURE_FINAL.md`, nhưng ý nghĩa nghiệp vụ dưới đây là cố định.

## 14.1. Trường chung

| Tên logic | Ý nghĩa nghiệp vụ | Quy tắc |
|---|---|---|
| `template_code` | Mã biểu mẫu | BM.01..., BM.02... |
| `template_version` | Phiên bản biểu mẫu | Không đổi dữ liệu cũ khi ra version mới. |
| `period_id` | Kỳ/sổ | Tháng hoặc từ ngày–đến ngày. |
| `scheduled_date` | Ngày theo lịch | Ngày mà ô/ca thuộc về. |
| `slot_code` | Lần đo/ca | Ví dụ `MORNING`, `AFTERNOON`, `SHIFT_1`... |
| `observed_at` | Thời điểm thực hiện/đo | Người dùng khai báo khi biểu mẫu có giờ thực tế. |
| `entered_at` | Thời điểm nhập app | Hệ thống tự ghi, không sửa tay. |
| `entered_by` | Người nhập | Từ tài khoản. |
| `location_id` | Khu vực | Dùng cho BM.01, KNBM. |
| `asset_id` | Máy/tủ/ngăn tủ | Dùng cho tủ, bảo dưỡng, BM.06. |
| `monitoring_device_id` | Thiết bị theo dõi | Lưu tham chiếu theo thời điểm ghi. |
| `note` | Ghi chú | Tùy chọn trừ nơi đặc tả bắt buộc. |
| `is_abnormal` | Bất thường | Hệ thống tính theo ngưỡng. |
| `is_not_applicable` | Không áp dụng | Chỉ true khi thực sự N/A. |
| `not_applicable_reason` | Lý do N/A | Bắt buộc nếu N/A. |
| `approved_by` | Người phê duyệt | Chỉ Trưởng khoa. |
| `approved_at` | Thời điểm phê duyệt | Hệ thống ghi. |
| `revision_of` | Bản gốc của đính chính | Không null nếu là bản đính chính. |
| `revision_reason` | Lý do đính chính | Bắt buộc khi tạo đính chính. |

**Không có `late_reason` bắt buộc trong MVP.**

## 14.2. Trạng thái dữ liệu

Tên enum kỹ thuật có thể thay đổi ở `01_ARCHITECTURE_FINAL.md`, nhưng nghĩa nghiệp vụ tối thiểu phải bao phủ:

- **Chưa làm / Pending** — việc theo lịch chưa có dữ liệu.
- **Đã ghi / Completed** — dữ liệu đã nhập đủ ở cấp entry/ca.
- **Không áp dụng / N/A** — có lý do.
- **Kỳ đang mở / Open** — sổ chưa chốt.
- **Trả lại / Returned** — Trưởng khoa yêu cầu sửa trước khi phê duyệt.
- **Đã phê duyệt / Approved** — khóa dữ liệu kỳ.
- **Đính chính / Revised** — có bản mới liên kết bản cũ.

Không dùng trạng thái “Late” để bắt người dùng giải trình trong MVP.

---

# 15. Quy tắc tổng hợp sổ và báo cáo

## 15.1. Nguyên tắc

- Cách nhập trên điện thoại có thể là card/form ngắn.
- Cách xem/xuất có thể là bảng ma trận rộng giống giấy.
- Không bắt KTV nhập trực tiếp vào bảng 31 cột/25 máy trên điện thoại.

## 15.2. Sổ tháng

BM.01, BM.02, BM.03, KNBM và bảo dưỡng phải có view theo tháng để:

- thấy ngày nào đã có dữ liệu;
- ngày nào còn thiếu;
- ô nào N/A;
- ô nào bất thường;
- ai thực hiện;
- cuối kỳ Trưởng khoa xem/chốt.

## 15.3. BM.06

Phải có view ma trận theo kỳ:

- hàng = ngày + khung giờ;
- cột = 25 máy theo thứ tự nguồn;
- ô = BT/KSD/H;
- kèm người sử dụng, lượng sử dụng, ghi chú.

## 15.4. Dữ liệu được dùng cho báo cáo

- Báo cáo quản lý chính ưu tiên dữ liệu của kỳ đã được Trưởng khoa phê duyệt.
- Dashboard tiến độ có thể dùng kỳ đang mở để thể hiện còn thiếu/đã làm.
- Bản đính chính phải thay thế về mặt “bản hiện hành” nhưng không xóa bản gốc trong lịch sử.

---

# 16. Quy tắc Excel/PDF

Quyết định của khoa: **đầu ra phải gần giống biểu mẫu giấy hiện tại**.

Mức bắt buộc:

- đúng mã/tên biểu mẫu;
- đúng phiên bản của kỳ dữ liệu;
- đúng khu vực/máy/tủ;
- đúng kỳ/tháng/ngày/ca;
- đúng trường và giá trị;
- đúng thứ tự máy ở BM.06;
- có người thực hiện và thông tin Trưởng khoa phê duyệt;
- thể hiện N/A, bất thường và đính chính nếu phù hợp;
- không làm mất thông tin chỉ vì layout app khác layout giấy.

Không yêu cầu giống tuyệt đối từng pixel trong Core Pilot nếu nội dung và cấu trúc nghiệp vụ không thay đổi. Việc tinh chỉnh để in gần như mẫu gốc có thể tiếp tục ở P5 mà không được đổi schema nghiệp vụ.

---

# 17. Validation và Acceptance Criteria theo nghiệp vụ

## 17.1. Validation chung

- Không cho hoàn tất entry nếu thiếu trường bắt buộc.
- N/A phải có lý do.
- Người thực hiện lấy từ tài khoản; không cho user thường giả người khác.
- `entered_at` do server/hệ thống ghi.
- Approved không được sửa trực tiếp.
- Đính chính phải liên kết bản gốc.
- Giá trị bất thường được lưu và đánh dấu, không bị tự sửa.

## 17.2. Bảng test tối thiểu

| Case | Kết quả phải đạt |
|---|---|
| BM.01 21°C / 26°C | Bình thường |
| BM.01 20.9°C / 26.1°C | Bất thường |
| BM.01 20% / 80% RH | Bình thường |
| BM.01 19.9% / 80.1% RH | Bất thường |
| BM.02 2°C / 8°C | Bình thường |
| BM.02 1.9°C / 8.1°C | Bất thường |
| BM.03 -30°C / -10°C | Bình thường |
| BM.03 -30.1°C / -9.9°C | Bất thường |
| Nhập dữ liệu của ngày trước | Được phép; `entered_at` vẫn là giờ hiện tại |
| N/A không lý do | Không cho hoàn tất |
| KNBM không có tràn đổ | Không tạo lỗi/việc thiếu “tràn đổ” |
| Bảo dưỡng hoàn thành không có Kết quả | Không cho hoàn tất |
| BM.06 thiếu status 1 máy | Ca chưa hoàn tất |
| BM.06 status ngoài BT/KSD/H | Từ chối |
| Trưởng khoa approve kỳ | Kỳ khóa read-only |
| User thường sửa kỳ Approved | Bị chặn |
| Tạo đính chính | Bản cũ vẫn còn; bản mới liên kết bản cũ |

---

# 18. Những điểm cố tình KHÔNG tự suy đoán trong file này

Các điểm sau chưa cần để khóa nghiệp vụ sáu biểu mẫu và **không được AI tự điền**:

1. Mã tài sản chuẩn Production cho các thiết bị trùng/thiếu mã.
2. Vai trò nghiệp vụ chính xác của Đậu Văn Hoàng và Ngô Trung Hiếu bên cạnh quyền Admin.
3. Vai trò nghiệp vụ cuối của Đàm Thị Phương Lan.
4. Tên chính thức của ứng dụng/branding.
5. Domain/hosting/backup retention.
6. Mức căn chỉnh PDF/Excel tới từng pixel.

Các điểm trên không làm thay đổi lịch, ngưỡng, trường dữ liệu và cách duyệt đã khóa trong file này.

---

# 19. Checklist khóa file 02

File này được coi là hợp lệ để làm nguồn cho `01_ARCHITECTURE_FINAL.md` khi tất cả các câu dưới đây là **Có**:

- [x] 6 biểu mẫu Core Pilot đã được xác định.
- [x] Báo cáo sự cố đã loại khỏi MVP.
- [x] BM.01 đã khóa 2 khung giờ và ngưỡng nhiệt độ/độ ẩm.
- [x] BM.02 đã khóa ngưỡng 2–8°C và 2 khung giờ.
- [x] BM.03 đã khóa tab `NganDa`, ngưỡng và 2 khung giờ.
- [x] KNBM đã khóa logic Hằng ngày / Hằng tuần / Tràn đổ.
- [x] Bảo dưỡng đã khóa chỉ Hằng ngày / Hằng tuần / Hằng tháng cho MVP.
- [x] BM.06 đã khóa 4 khung giờ.
- [x] BM.06 đã khóa toàn bộ danh sách máy theo Phụ lục và thứ tự nguồn.
- [x] BT/KSD/H đã được định nghĩa.
- [x] Nhập linh động/nhập bù đã được khóa.
- [x] N/A + lý do đã được khóa.
- [x] Duyệt một cấp Trưởng khoa đã được khóa.
- [x] Sửa sau duyệt bằng đính chính, giữ bản gốc.
- [x] Chưa cần file đính kèm trong MVP.
- [x] Excel/PDF phải gần biểu mẫu giấy.

**Kết luận:** `02_FORMS_DATA_RULES_FINAL.md` đủ để chuyển sang thiết kế kiến trúc/database, với các điểm Production chưa cần khóa được liệt kê rõ ở Mục 18.

---

# 20. Xác nhận thay đổi sau khi commit

Sau khi file này được commit vào repo:

- thay đổi ngưỡng;
- thay đổi giờ/ca;
- thêm/bớt biểu mẫu;
- thay đổi danh sách trạng thái;
- đổi cấp phê duyệt;
- đổi quy tắc nhập bù/N-A;
- đổi cấu trúc dữ liệu bắt buộc;

đều phải được xem là **thay đổi nghiệp vụ**, cập nhật file này trước hoặc cùng Pull Request. Không được sửa âm thầm chỉ trong code/database.

