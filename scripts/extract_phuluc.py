import zipfile
import xml.etree.ElementTree as ET
import os
import glob
import shutil

search_pattern = "/mnt/c/Users/Admin/Desktop/docs sh103-lab/danh mục biểu mẫu/*"
docx_path = None
for f in glob.glob(search_pattern):
    if "ph" in f.lower() or "lục" in f.lower():
        docx_path = f
        break

if not docx_path:
    raise FileNotFoundError("Could not find Phụ lục file")

# Copy docx to docs directory
shutil.copy(docx_path, "docs/Phu_luc.docx")
print("Copied docx to docs/Phu_luc.docx")

markdown_content = """# Phụ lục: Danh mục Trang thiết bị, Tủ lạnh và Nhân sự Khoa Sinh hóa — Bệnh viện Quân y 103

> Tài liệu nguồn: `C:\\Users\\Admin\\Desktop\\docs sh103-lab\\danh mục biểu mẫu\\Phụ lục.docx`  
> Đồng bộ vào hệ thống: Tháng 09/2026  
> Tiêu chuẩn áp dụng: ISO 15189:2022  

---

## 1. Danh mục 13 Tủ bảo quản / Tủ lạnh & Tủ đá (BM.02 & BM.03)

| STT | Tên thiết bị | Mã thiết bị | Thiết bị theo dõi | Khoảng nhiệt độ cho phép | Vị trí đặt thiết bị | Biểu mẫu áp dụng |
|:---:|:---|:---:|:---:|:---:|:---|:---:|
| 1 | Tủ âm sâu Overmed | TU-01 | Theo hiển thị trên tủ | -10 đến -30°C | Tủ lưu mẫu | BM.03/QL.HTAT.01 |
| 2 | Tủ lạnh TOWASHI | TU 02 | NKĐT-01 | 2 đến 8°C | HC kho lẻ | BM.02/QL.HTAT.01 |
| 3 | Tủ lạnh MITSUBISHI (ngăn mát) | TU 03 | NKĐT-12 | 2 đến 8°C | Cal, QC | BM.02/QL.HTAT.01 |
| 4 | Tủ lạnh MITSUBISHI (ngăn đá) | TU 03 | NKĐT-12 | -10 đến -30°C | Cal, QC | BM.03/QL.HTAT.01 |
| 5 | Tủ lạnh SANAKY | TU 04 | NKĐT-09 | 2 đến 8°C | HC kho chính | BM.02/QL.HTAT.01 |
| 6 | Tủ lạnh SANAKY | TU 05 | NKĐT-05 | 2 đến 8°C | Tủ lưu mẫu | BM.02/QL.HTAT.01 |
| 7 | Tủ lạnh LG (ngăn mát) | TU 06 | NKĐT-08 | 2 đến 8°C | QC, Cal | BM.02/QL.HTAT.01 |
| 8 | Tủ lạnh LG (ngăn đông) | TU 06 | NKĐT-10 | -10 đến -30°C | QC, Cal | BM.03/QL.HTAT.01 |
| 9 | Tủ lạnh MITSUBISHI (ngăn mát) | TU 07 | NKĐT-14 | 2 đến 8°C | HC kho chính | BM.02/QL.HTAT.01 |
| 10 | Tủ lạnh MITSUBISHI (ngăn đông) | TU 07 | NKĐT-06 | -10 đến -30°C | HC kho chính | BM.03/QL.HTAT.01 |
| 11 | Tủ lạnh Acuma | TU-08 | NKTG-01 | 2 đến 8°C | Tủ lưu mẫu | BM.02/QL.HTAT.01 |
| 12 | Tủ lạnh Alaska | TU 09 | NKTG-02 | 2 đến 8°C | HC kho chính | BM.02/QL.HTAT.01 |
| 13 | Tủ lạnh Sanaky | TU-10 | NKTG-03 | 2 đến 8°C | HC kho chính | BM.02/QL.HTAT.01 |

---

## 2. Thiết bị theo dõi môi trường phòng xét nghiệm (BM.01)

| STT | Khu vực | Thiết bị theo dõi | Tiêu chuẩn nhiệt độ & độ ẩm |
|:---:|:---|:---:|:---|
| 1 | Khu vực làm xét nghiệm sinh hóa | NAKĐT - 01 | 21–26°C · Độ ẩm 20–80% (≤70%) |
| 2 | Khu vực làm xét nghiệm miễn dịch | NAKĐT - 02 | 21–26°C · Độ ẩm 20–80% (≤70%) |
| 3 | Kho hóa chất & lưu mẫu | NAKĐT - 03 | 21–26°C · Độ ẩm 20–80% (≤70%) |

---

## 3. Danh mục 25 Thiết bị Xét nghiệm vận hành 4 ca (BM.06/QL.TRTB.01)

| STT | Mã TB | Tên thiết bị xét nghiệm | Dòng máy / Model | Khu vực đặt máy |
|:---:|:---:|:---|:---:|:---|
| 1 | TB-01 | Máy XN Khí Máu GEM Premier 3000 | GEM Premier 3000 | Khu Sinh hóa |
| 2 | TB-02 | Máy Primier Hb 9210 -M1 | Primier Hb 9210 | Khu Sinh hóa |
| 3 | TB-03 | Máy XN nước tiểu LabUMat 2- M1 | LabUMat 2 | Khu Nước tiểu |
| 4 | TB-04 | Máy Miễn dịch Cobas E602 | Cobas E602 | Khu Miễn dịch |
| 5 | TB-05 | Máy Primier Hb 9210- M2 | Primier Hb 9210 | Khu Sinh hóa |
| 6 | TB-06 | Máy Primier Hb 9210- M1 | Primier Hb 9210 | Khu Sinh hóa |
| 7 | TB-07 | Máy XN SH - MD tự động ARCHITECT-2 | ARCHITECT-2 | Hệ Automation |
| 8 | TB-08 | Máy nước tiểu ureader Plus 2 - M1 | ureader Plus 2 | Khu Nước tiểu |
| 9 | TB-09 | Máy xét nghiệm khí máu Geem 3500 (M1) | Geem 3500 | Khu Sinh hóa |
| 10 | TB-10 | Máy nước tiểu ureader Plus 2 - M2 | ureader Plus 2 | Khu Nước tiểu |
| 11 | TB-11 | Hệ thống Automation Máy XN sinh hóa AU5800-M4-5 | AU5800 | Hệ Automation |
| 12 | TB-12 | Hệ thống Automation Máy XN sinh hóa AU5800-M6 | AU5800 | Hệ Automation |
| 13 | TB-13 | Hệ thống Automation Máy XN MD DXI-M3 | DXI | Hệ Automation |
| 14 | TB-14 | Hệ thống Automation Máy XN MD DXI-M4 | DXI | Hệ Automation |
| 15 | TB-15 | Máy xét nghiệm Miễn dịch Maglumi X3 | Maglumi X3 | Khu Miễn dịch |
| 16 | TB-16 | Máy xét nghiệm nước tiểu LabUmat 2-M2 | LabUmat 2 | Khu Nước tiểu |
| 17 | TB-17 | Máy xét nghiệm HbA1C-HLC-723G11 (Tosoh Nhật Bản) | HLC-723G11 | Khu Sinh hóa |
| 18 | TB-18 | Máy XN SH-MD Anility | Anility | Hệ Automation |
| 19 | TB-19 | Máy xét nghiệm khí máu Geem 3500 (M2) | Geem 3500 | Khu Sinh hóa |
| 20 | TB-20 | Máy lắc VORTEX | VORTEX | Khu Ly tâm |
| 21 | TB-21 | Máy li tâm 24 lỗ lạnh UNIVERSAL 320R | UNIVERSAL 320R | Khu Ly tâm |
| 22 | TB-22 | Máy li tâm 68 lỗ ROTOFIX 32A | ROTOFIX 32A | Khu Ly tâm |
| 23 | TB-23 | Máy lắc ngang | Lắc ngang | Khu Ly tâm |
| 24 | TB-24 | Máy li tâm Ependox-M1 | Ependox | Khu Ly tâm |
| 25 | TB-25 | Máy li tâm Ependox-M2 | Ependox | Khu Ly tâm |

---

## 4. Danh sách 25 Cán bộ Nhân viên & Tài khoản Hệ thống

> Quy tắc tài khoản:  
> - **Username:** họ viết tắt + tên viết thường không dấu (Ví dụ: Huỳnh Quang Thuận -> `hqthuan`).  
> - **Mật khẩu khởi tạo:** do quản trị viên cấp qua kênh bảo mật và bắt buộc đổi khi bàn giao.
> - **Phân quyền:** STT 1–10 là Bác sĩ (gồm Chỉ huy BMK, Quản lý hồ sơ, Bác sĩ phụ trách; các Admin có quyền ngang nhau). STT 11–25 là Kỹ thuật viên.

| STT | Họ và tên | Chức danh / Vai trò | Username | Email hệ thống | Phân quyền Admin | Trạng thái thông tin xác thực |
|:---:|:---|:---|:---:|:---|:---:|:---:|
| 1 | **Huỳnh Quang Thuận** | Chỉ huy BMK / Bác sĩ | `hqthuan` | `hqthuan@sh103.hospital` | **Admin** | Cấp riêng |
| 2 | Lê Thanh Hà | Bác sĩ | `ltha` | `ltha@sh103.hospital` | Thành viên | Cấp riêng |
| 3 | **Vũ Quang Hợp** | Chỉ huy BMK / Bác sĩ | `vqhop` | `vqhop@sh103.hospital` | **Admin** | Cấp riêng |
| 4 | Hoàng Thị Minh | Bác sĩ | `htminh` | `htminh@sh103.hospital` | Thành viên | Cấp riêng |
| 5 | Hồ Thị Hằng | Bác sĩ | `hthang` | `hthang@sh103.hospital` | Thành viên | Cấp riêng |
| 6 | Nguyễn Thị Mai Ly | Bác sĩ | `ntmly` | `ntmly@sh103.hospital` | Thành viên | Cấp riêng |
| 7 | **Đậu Văn Hoàng** | Bác sĩ / Quản trị | `dvhoang` | `dvhoang@sh103.hospital` | **Admin** | Cấp riêng |
| 8 | **Ngô Trung Hiếu** | Bác sĩ / Quản trị | `nthieu` | `nthieu@sh103.hospital` | **Admin** | Cấp riêng |
| 9 | Nguyễn Thành Long | Bác sĩ | `ntlong` | `ntlong@sh103.hospital` | Thành viên | Cấp riêng |
| 10 | Đàm Thị Phương Lan | Bác sĩ / Quản lý hồ sơ | `dtplan` | `dtplan@sh103.hospital` | Thành viên | Cấp riêng |
| 11 | Nguyễn Văn Cường | Kỹ thuật viên | `nvcuong` | `nvcuong@sh103.hospital` | Thành viên | Cấp riêng |
| 12 | Nguyễn Thị Bích Hạnh | Kỹ thuật viên | `ntbhanh` | `ntbhanh@sh103.hospital` | Thành viên | Cấp riêng |
| 13 | Nguyễn Thanh Thuỷ | Kỹ thuật viên | `ntthuy` | `ntthuy@sh103.hospital` | Thành viên | Cấp riêng |
| 14 | Phạm Thị Phương Thảo | Kỹ thuật viên | `ptpthao` | `ptpthao@sh103.hospital` | Thành viên | Cấp riêng |
| 15 | Tăng Thanh Thuỷ | Kỹ thuật viên | `ttthuy` | `ttthuy@sh103.hospital` | Thành viên | Cấp riêng |
| 16 | Nguyễn Xuân Hùng | Kỹ thuật viên | `nxhung` | `nxhung@sh103.hospital` | Thành viên | Cấp riêng |
| 17 | Nguyễn Thị Sinh | Kỹ thuật viên | `ntsinh` | `ntsinh@sh103.hospital` | Thành viên | Cấp riêng |
| 18 | Nguyễn Thị Minh Ngọc | Kỹ thuật viên | `ntmngoc` | `ntmngoc@sh103.hospital` | Thành viên | Cấp riêng |
| 19 | Lê Thị Thảo | Kỹ thuật viên | `ltthao` | `ltthao@sh103.hospital` | Thành viên | Cấp riêng |
| 20 | **Vũ Viết Nam** | Kỹ thuật viên / Quản trị | `vvnam` | `vvnam@sh103.hospital` | **Admin** | Cấp riêng |
| 21 | Nguyễn Văn Nhân | Kỹ thuật viên | `nvnhan` | `nvnhan@sh103.hospital` | Thành viên | Cấp riêng |
| 22 | Mai Thị Phương Thảo | Kỹ thuật viên | `mtpthao` | `mtpthao@sh103.hospital` | Thành viên | Cấp riêng |
| 23 | Nguyễn Minh Thư | Kỹ thuật viên | `nmthu` | `nmthu@sh103.hospital` | Thành viên | Cấp riêng |
| 24 | Cấn Thu Anh | Kỹ thuật viên | `ctanh` | `ctanh@sh103.hospital` | Thành viên | Cấp riêng |
| 25 | Lê Thị Hằng | Kỹ thuật viên | `lthang` | `lthang@sh103.hospital` | Thành viên | Cấp riêng |

> Không lưu mật khẩu hoặc tài khoản quản trị dùng chung trong tài liệu nguồn. Mọi thông tin xác thực cũ từng được công bố phải được thu hồi và cấp lại.
"""

with open("docs/PHU_LUC_DANH_MUC_TTB_NHAN_SU.md", "w", encoding="utf-8") as f:
    f.write(markdown_content)

print("Generated docs/PHU_LUC_DANH_MUC_TTB_NHAN_SU.md successfully!")
