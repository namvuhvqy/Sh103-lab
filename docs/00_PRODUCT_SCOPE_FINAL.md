# 00_PRODUCT_SCOPE_FINAL

**Dự án:** Web app quản lý biểu mẫu nội bộ Khoa/Bộ môn Sinh hóa  
**Trạng thái:** FINAL – phạm vi sản phẩm và các quyết định nghiệp vụ lõi đã khóa  
**Mục đích:** Là tài liệu gốc để AI coding, bác sĩ/KTV và người quản trị cùng hiểu **app làm gì, không làm gì, ai được làm gì, và mốc nào được coi là hoàn thành**.

> Nguyên tắc: nếu code, màn hình hoặc tài liệu khác mâu thuẫn với file này thì **không tự đoán**. Dừng thay đổi, đối chiếu lại nghiệp vụ và cập nhật đặc tả trước.

---

## 1. Mục tiêu sản phẩm

Xây dựng một web app dùng cho toàn bộ nhân viên khoa Sinh hóa để thay thế việc ghi chép, tổng hợp và theo dõi nhiều biểu mẫu thủ công rời rạc.

Mô hình điều hướng chính của ứng dụng là **Area-first navigation** (Khu vực làm việc → Trang thiết bị thuộc khu vực → Các phiếu/công việc liên quan).

MVP tập trung vào chuỗi công việc:

**Lịch/việc cần làm theo khu vực → chọn thiết bị → nhập biểu mẫu liên quan → lưu lịch sử → Trưởng khoa xem/phê duyệt → khóa dữ liệu → Dashboard/Báo cáo → xuất Excel/PDF.**

Mục tiêu thực tế:

- Kỹ thuật viên và bác sĩ nhập biểu mẫu nhanh trên máy tính hoặc điện thoại theo khu vực làm việc thực tế.
- Hệ thống biết biểu mẫu nào cần thực hiện theo ngày/ca/tháng cho từng khu vực và thiết bị.
- Cho phép xem lại dữ liệu theo ngày, tháng, khu vực, máy và biểu mẫu.
- Trưởng khoa là cấp phê duyệt duy nhất trong MVP.
- Dữ liệu đã phê duyệt có lịch sử rõ ràng và không bị sửa đè âm thầm.
- Dashboard giúp nhìn nhanh tình trạng hoàn thành, thiếu, bất thường, bảo dưỡng và hoạt động thiết bị theo toàn khoa hoặc theo từng khu vực.
- Excel/PDF đầu ra phải gần với biểu mẫu giấy hiện khoa đang dùng.

---

## 2. Đối tượng sử dụng

### 2.1. Vai trò nghiệp vụ

MVP chỉ có **3 vai trò nghiệp vụ**:

1. **Trưởng khoa**
   - Xem dữ liệu toàn khoa.
   - Xem các sổ/biểu mẫu theo kỳ.
   - Trả lại khi cần chỉnh sửa.
   - Phê duyệt/chốt dữ liệu theo quy trình của từng biểu mẫu.
   - Xem Dashboard và báo cáo.

2. **Bác sĩ phụ trách**
   - Nhập các biểu mẫu được phép.
   - Xem và tra cứu dữ liệu theo phạm vi được cấp.
   - Không phải một cấp phê duyệt riêng trong MVP.

3. **Kỹ thuật viên**
   - Là nhóm nhập liệu chính.
   - Xem “Việc hôm nay”.
   - Nhập/lưu dữ liệu, hoàn thành biểu mẫu, xem lịch sử theo quyền.

### 2.2. Quyền quản trị hệ thống tách riêng khỏi vai trò nghiệp vụ

`Admin` **không phải vai trò nghiệp vụ thứ tư**.

Mỗi tài khoản có:

- một vai trò nghiệp vụ: `Trưởng khoa | Bác sĩ phụ trách | Kỹ thuật viên`;
- và một quyền quản trị riêng: `is_admin = true/false`.

Ví dụ: một Kỹ thuật viên vẫn có thể là **Kỹ thuật viên + Admin hệ thống**.

Admin hệ thống được phép quản lý các phần kỹ thuật/quản trị như:

- tài khoản và quyền;
- danh mục máy, tủ, khu vực;
- cấu hình biểu mẫu;
- cấu hình dữ liệu nền;
- các chức năng quản trị được đặc tả sau.

Admin **không tự động có quyền phê duyệt nghiệp vụ thay Trưởng khoa** chỉ vì có quyền quản trị hệ thống.

### 2.3. “Nhân viên quản lý hồ sơ”

MVP **không tạo thêm một role riêng** chỉ cho “Nhân viên quản lý hồ sơ”. Nếu cần sử dụng app, tài khoản này được gán một trong 3 vai trò nghiệp vụ ở trên theo công việc thực tế; quyền riêng chỉ được bổ sung khi có chức năng cụ thể cần thiết.

---

## 3. Phạm vi MVP – PHẢI LÀM

### 3.1. Tài khoản và phân quyền

- Đăng nhập/đăng xuất.
- Mỗi người một tài khoản.
- Phân quyền theo 3 vai trò nghiệp vụ.
- Quyền Admin tách riêng.
- Người dùng không được xem/sửa dữ liệu vượt quyền dù cố truy cập trực tiếp URL/API.

### 3.2. Danh mục cơ bản & 5 Khu vực làm việc của Khoa

Chuẩn hóa **5 khu vực làm việc** của khoa:
1. **Sinh hóa** (`SINH_HOA`) — Khu vực xét nghiệm chuyên sâu, máy sinh hóa tự động, khí máu, HbA1c.
2. **Miễn dịch** (`MIEN_DICH`) — Khu vực xét nghiệm miễn dịch tự động, hệ thống đa nhiệm SH-MD (ARCHITECT-2, Alinity) và thiết bị lắc chuyên dụng.
3. **Nước tiểu** (`NUOC_TIEU`) — Khu vực xét nghiệm nước tiểu và cặn lắng.
4. **Ly tâm** (`LY_TAM`) — Khu vực ly tâm tách huyết thanh/huyết tương.
5. **Nhận bệnh phẩm** (`NHAN_BENH_PHAM`) — Khu vực tiếp nhận, phân loại mẫu ban đầu. Khu vực này **không có máy xét nghiệm**, chỉ thực hiện **vệ sinh và khử nhiễm bề mặt (BM.01_KNBM)**.

Phân biệt rành mạch 3 cấp độ thực thể:
- **Khu vực làm việc (Work Area):** 5 khu vực làm việc nêu trên và các vị trí phụ trợ (Kho hóa chất/lưu mẫu `KHO`).
- **Trang thiết bị (Equipment / Asset):** Đủ 25 máy xét nghiệm/ly tâm và danh mục 13 tủ/ngăn tủ. 100% 25 máy đã được Owner xác nhận chính thức khu vực quản lý (9 Sinh hóa, 8 Miễn dịch, 4 Nước tiểu, 4 Ly tâm; không còn OPEN ITEM về vị trí máy).
- **Biểu mẫu / Công việc (Form / Task):** 6 nhóm biểu mẫu áp dụng cho từng thiết bị hoặc từng khu vực (Khu Nhận bệnh phẩm chỉ áp dụng BM.01_KNBM).

Danh mục cơ bản gồm:
- Nhân sự và phân công quyền.
- 5 Khu vực làm việc chính thức và vị trí theo dõi môi trường/kho.
- Tủ và ngăn tủ (13 dòng theo dõi).
- Máy/trang thiết bị (25 máy chuẩn hóa).
- Thiết bị dùng để theo dõi nhiệt độ/độ ẩm theo dữ liệu nguồn.
- Mã/tên/vị trí và trạng thái cần thiết để liên kết với biểu mẫu.

Trong bản Pilot, nếu một số máy/tủ chưa có mã chuẩn duy nhất thì **được phép tạm phân biệt bằng tên + vị trí**. Phải chuẩn hóa trước Production.

### 3.3. Biểu mẫu bắt buộc trong Core Pilot 7 ngày

Tất cả các nhóm sau thuộc phạm vi bắt buộc, trừ báo cáo sự cố:

1. **BM.01/QL.HTAT.01 – Theo dõi nhiệt độ, độ ẩm phòng xét nghiệm**.
2. **BM.02/QL.HTAT.01 – Theo dõi tủ lạnh mát**.
3. **BM.03/QL.HTAT.01 – Theo dõi tủ đông/tủ đá**.
4. **BM.01_KNBM – Khử nhiễm bề mặt**.
5. **BM.02/QL.TRTB.01 – Bảo dưỡng máy**.
6. **BM.06/QL.TRTB.01 – Nhật ký hoạt động trang thiết bị**.

Chi tiết trường dữ liệu, ngưỡng, giờ/ca và cách nhập của từng biểu mẫu thuộc file:

`02_FORMS_DATA_RULES_FINAL.md`

### 3.4. Lịch và việc cần làm theo khu vực

App phải hỗ trợ nghiệp vụ theo:

- ngày;
- khung giờ/ca;
- tuần;
- tháng;
- kỳ/sổ theo dõi;
- **khu vực làm việc** (cho phép nhân viên lọc nhanh công việc của khu vực mình phụ trách).

Trang “Việc hôm nay” và Trang chủ phải cho người dùng biết:

- việc cần làm theo từng khu vực làm việc;
- công việc chung toàn khoa (Môi trường, Kho, Tủ mẫu);
- việc đã hoàn thành;
- việc chưa hoàn thành;
- việc được đánh dấu Không áp dụng.

### 3.5. Nhập linh động và nhập bù

Để đơn giản và phù hợp thực tế khoa:

- Người dùng **được phép nhập linh động và nhập bù** để hoàn thiện biểu mẫu.
- Không bắt buộc ghi lý do chỉ vì nhập muộn.
- Hệ thống vẫn phải lưu **thời điểm thực tế dữ liệu được nhập vào app** để truy vết.
- Không được làm giả thời điểm nhập hệ thống.
- Nếu ngày nghỉ/lễ hoặc máy ngừng hoạt động: cho phép chọn **“Không áp dụng”** và **bắt buộc ghi lý do**.

### 3.6. Phê duyệt

MVP dùng **một cấp phê duyệt duy nhất: Trưởng khoa**.

Không tạo thêm bước duyệt của Bác sĩ phụ trách trong MVP.

Tùy biểu mẫu, việc phê duyệt có thể diễn ra sau khi hoàn thiện kỳ/sổ hoặc theo quy tắc cụ thể trong `02_FORMS_DATA_RULES_FINAL.md`, nhưng người có quyền phê duyệt cuối cùng vẫn là Trưởng khoa.

### 3.7. Sửa dữ liệu sau khi đã phê duyệt

- Dữ liệu đã phê duyệt không được sửa đè trực tiếp.
- Nếu phát hiện sai: tạo **bản đính chính mới**, liên kết với bản cũ.
- Bản cũ vẫn được giữ lại để truy vết.
- Phải biết ai tạo đính chính, lúc nào và nội dung nào thay đổi.

### 3.8. Lịch sử và truy vết

Tối thiểu phải biết được:

- ai nhập;
- thời điểm nhập;
- dữ liệu thuộc biểu mẫu/kỳ/ngày/ca nào;
- trạng thái;
- ai phê duyệt;
- thời điểm phê duyệt;
- bản đính chính nếu có.

### 3.9. Dashboard và báo cáo

MVP phải có Dashboard cơ bản và báo cáo phục vụ quản lý.

Tối thiểu gồm:

- cần làm / đã làm / còn thiếu;
- dữ liệu bất thường theo ngưỡng đã được khoa xác nhận;
- tình trạng bảo dưỡng;
- tình trạng hoạt động thiết bị;
- tra cứu theo thời gian, biểu mẫu, máy/khu vực và người nhập;
- báo cáo theo kỳ phù hợp nghiệp vụ.

### 3.10. Excel/PDF

- Có xuất Excel/PDF.
- Đầu ra **phải gần giống biểu mẫu giấy hiện đang dùng**.
- Không yêu cầu giống tuyệt đối từng pixel nếu không ảnh hưởng nội dung/nghiệp vụ; mức chi tiết cuối cùng được khóa trong file dữ liệu biểu mẫu và màn hình.

### 3.11. File đính kèm

**Chưa cần file/ảnh đính kèm trong MVP.**

Các Word/Excel/PDF do khoa cung cấp là **nguồn biểu mẫu để số hóa và làm mẫu đầu ra**, không phải file người dùng phải tải lên mỗi ngày.

---

## 4. Ngoài phạm vi MVP – KHÔNG LÀM

Các phần sau không được tự ý thêm vào MVP:

- Báo cáo sự cố.
- Quản lý kho hóa chất.
- Mua sắm, tài chính.
- Quản lý vật tư/kho theo kiểu ERP.
- LIS/HIS hoặc tích hợp hệ thống nghiệp vụ bệnh viện.
- Kết nối mạng nội bộ nghiệp vụ bệnh viện.
- Dữ liệu định danh người bệnh trong phạm vi hiện tại.
- Ứng dụng mobile native riêng.
- Cảm biến nhiệt độ/độ ẩm tự động.
- n8n Automation trong lõi MVP.
- Gửi Zalo/email/Telegram tự động.
- Workflow nhiều cấp phê duyệt.
- AI tự đưa ra quyết định chuyên môn hoặc tự đặt ngưỡng chuyên môn.
- Chữ ký số pháp lý.

Những nội dung có thể xem xét ở Version sau chỉ được đưa vào backlog sau khi MVP ổn định.

---

## 5. Các quyết định P0 đã khóa

| ID | Quyết định | Trạng thái |
|---|---|---|
| P0-01 | Vai trò nghiệp vụ chỉ gồm Trưởng khoa / Bác sĩ phụ trách / Kỹ thuật viên | LOCKED |
| P0-02 | Quyền Admin tách riêng bằng cờ quyền quản trị | LOCKED |
| P0-03 | Trưởng khoa là cấp phê duyệt duy nhất | LOCKED |
| P0-04 | Cho phép nhập linh động và nhập bù; không bắt buộc lý do nhập muộn | LOCKED |
| P0-05 | Hệ thống vẫn lưu thời điểm nhập thật để truy vết | LOCKED |
| P0-06 | Ngày nghỉ/lễ hoặc máy ngừng: “Không áp dụng” + lý do | LOCKED |
| P0-07 | Sau phê duyệt: tạo bản đính chính mới, giữ bản cũ | LOCKED |
| P0-08 | Chưa cần file đính kèm trong MVP | LOCKED |
| P0-09 | Excel/PDF phải gần giống biểu mẫu giấy đang dùng | LOCKED |
| P0-10 | Bỏ báo cáo sự cố khỏi MVP | LOCKED |
| P0-11 | 6 nhóm biểu mẫu còn lại đều thuộc scope Core Pilot 7 ngày | LOCKED |
| P0-12 | BM.03 dùng tab `NganDa` làm nguồn hiện hành | LOCKED |
| P0-13 | BM.06 dùng 4 khung giờ: 07:00–11:30; 11:30–13:30; 13:30–16:30; 16:30–07:00 | LOCKED |
| P0-14 | BM.06 dùng toàn bộ danh sách máy từ Phụ lục và giữ thứ tự như sổ giấy | LOCKED |
| P0-15 | Mã máy/tủ chưa chuẩn có thể tạm dùng tên + vị trí trong Pilot; phải chuẩn hóa trước Production | LOCKED |
| P0-16 | Area-first navigation là mô hình điều hướng chính; khóa 5 khu vực: Sinh hóa, Miễn dịch, Nước tiểu, Ly tâm, Nhận bệnh phẩm (chỉ KNBM); 25 máy phân khu chính thức | LOCKED |

Chi tiết chuyên môn từng biểu mẫu không lặp lại ở đây để tránh hai nơi chứa cùng một quy tắc.

---

## 6. Mốc 7 ngày và định nghĩa “thành công”

### 6.1. Core Pilot Candidate – mục tiêu 7 ngày

Đồng hồ 7 ngày chỉ tính **sau khi Phase 0 đã đủ dữ liệu cần thiết cho code nghiệp vụ**.

Sau 7 ngày, mục tiêu là có một bản chạy được trên DEV/STAGING để nhóm đại diện thử các luồng cốt lõi.

Bản này gọi là:

**Core Pilot Candidate**

Nó **không đồng nghĩa Production**.

Nếu phát sinh xung đột giữa “kịp 7 ngày” và “đúng dữ liệu/quyền/test”, ưu tiên đúng dữ liệu, quyền và test; không bỏ hàng rào an toàn để chạy theo thời gian.

### 6.2. Production

Chỉ được mở toàn khoa khi các phase chất lượng/vận hành tương ứng đã PASS, tối thiểu gồm:

- phân quyền/RLS đã test;
- các luồng nghiệp vụ chính đã test;
- backup và thử restore thành công;
- UAT/Pilot đạt;
- không còn lỗi nghiêm trọng ảnh hưởng dữ liệu/quyền;
- Trưởng khoa chấp thuận Go-Live.

---

## 7. Nguyên tắc thiết kế sản phẩm

1. **Mobile-first cho người nhập liệu**  
   KTV/Bác sĩ phải nhập thuận tiện trên điện thoại, không bắt nhập bảng rộng kiểu Excel.

2. **Sổ tháng là cách xem/tổng hợp, không nhất thiết là cách nhập**  
   Người dùng có thể nhập theo ngày/ca; hệ thống tổng hợp thành sổ tháng để xem và xuất.

3. **Không tự đặt nghiệp vụ**  
   AI không được tự tạo ngưỡng, vai trò, giờ đo, cách duyệt hoặc quy tắc chuyên môn.

4. **Không sửa lịch sử âm thầm**  
   Dữ liệu đã phê duyệt phải truy vết được.

5. **Phân quyền phải có hiệu lực ở tầng dữ liệu/backend**  
   Không coi việc ẩn nút trên UI là bảo mật.

6. **Mẫu biểu có phiên bản**  
   Khi mẫu thay đổi sau này, dữ liệu cũ vẫn phải gắn với phiên bản cũ tương ứng.

7. **Giữ MVP đơn giản**  
   Không thêm service, plugin hoặc automation nếu không cần cho chức năng lõi.

8. **Điều hướng Area-first (Khu vực → Thiết bị → Phiếu)**  
   Mô hình tư duy: nhân viên khoa nghĩ "Tôi đang làm việc ở khu nào?" trước khi chọn máy và phiếu. Mỗi máy chỉ hiển thị trong đúng khu vực nghiệp vụ tương ứng. Không đưa toàn bộ 25 máy vào một danh sách phẳng lộn xộn nếu người dùng đang làm việc theo khu vực.

---

## 8. Những nội dung chưa chốt nhưng KHÔNG chặn P1

Các mục sau có thể hoàn thiện ở phase thích hợp, không cần trì hoãn việc dựng nền tảng repo:

- tên chính thức của ứng dụng;
- branding/logo/màu nhận diện cuối cùng;
- domain Production;
- nơi host Production cuối cùng;
- chính sách giữ backup bao nhiêu ngày;
- danh sách tài khoản thật đầy đủ;
- mã thiết bị chuẩn cuối cùng trước Production;
- mức tinh chỉnh cuối cùng của layout PDF/Excel.

Các mục này **không cho phép làm thay đổi những quyết định P0 đã LOCKED ở trên** nếu chưa cập nhật tài liệu chính thức.

---

## 9. Bộ tài liệu FINAL và thứ tự ưu tiên

Repo sẽ có 5 file đặc tả chính:

```text
docs/
├── 00_PRODUCT_SCOPE_FINAL.md
├── 01_ARCHITECTURE_FINAL.md
├── 02_FORMS_DATA_RULES_FINAL.md
├── 03_SCREEN_MENU_UIUX_FINAL.md
└── 04_IMPLEMENTATION_PLAN_FINAL.md
```

Phạm vi trách nhiệm:

- `00_PRODUCT_SCOPE_FINAL.md`: **làm gì / không làm gì / vai trò / quyết định P0 / ranh giới release**.
- `02_FORMS_DATA_RULES_FINAL.md`: **nghiệp vụ chi tiết của từng biểu mẫu và dữ liệu**.
- `01_ARCHITECTURE_FINAL.md`: **kiến trúc kỹ thuật và database/backend**.
- `03_SCREEN_MENU_UIUX_FINAL.md`: **màn hình, menu, thao tác, UI/UX**.
- `04_IMPLEMENTATION_PLAN_FINAL.md`: **thứ tự P0–P9, task, test, Exit Gate, Pilot, Production**.

### Quy tắc khi tài liệu mâu thuẫn

- Không để AI tự chọn một phiên bản.
- Dừng task liên quan.
- Xác định tài liệu nào đang sai.
- Sửa tài liệu và commit thay đổi trước khi tiếp tục code.

---

## 10. Trạng thái Phase 0 theo file này

**Phạm vi sản phẩm: LOCKED.**  
**Vai trò và mô hình quyền: LOCKED.**  
**Scope biểu mẫu Core Pilot: LOCKED.**  
**Nguyên tắc duyệt / nhập bù / N-A / đính chính: LOCKED.**

Phase 0 chỉ được coi là hoàn tất toàn bộ sau khi file `02_FORMS_DATA_RULES_FINAL.md` được đối chiếu và khóa các quy tắc chi tiết còn lại của từng biểu mẫu.

P1 kỹ thuật (repo, Next.js, Supabase DEV, CI, cấu trúc dự án) có thể bắt đầu song song vì không phụ thuộc các chi tiết chưa khóa ở cấp biểu mẫu.

---

## 11. Nguồn dùng để khóa tài liệu này

Tài liệu này được tổng hợp từ các quyết định đã thống nhất trong quá trình đặc tả, bao gồm:

- các biểu mẫu thủ công khoa đang sử dụng;
- `Phụ lục.docx`;
- bộ biểu mẫu đầu ra đã cung cấp;
- `Trả lời file 4.docx`;
- bộ Kiến trúc / Screen-Menu-UIUX / Kế hoạch RC đã audit trước đó;
- các quyết định bổ sung sau audit về nhập bù, BM.06 và mô hình quyền Admin tách riêng.

Không dùng repo tham khảo trên Internet để thay thế quyết định nghiệp vụ của khoa.

---

## 12. Xác nhận khóa file

- **Admin/Điều phối:** ____________________  Ngày: __________
- **Đại diện Bác sĩ/KTV:** ____________________  Ngày: __________
- **Trưởng khoa:** ____________________  Ngày: __________

Khi có thay đổi phạm vi sau khi file này đã được commit, phải sửa file và ghi rõ lý do trong commit/PR; không thay đổi âm thầm trong code.
