# SH103 Lab — Web App Quản Lý Biểu Mẫu Khoa Sinh Hóa

Hệ thống quản lý biểu mẫu nội bộ và kiểm soát chất lượng Khoa/Bộ môn Sinh hóa (SH103).

## 1. Nguồn sự thật tài liệu (Source of Truth)
Thư mục `docs/` gồm 5 tài liệu FINAL bắt buộc tuân thủ:
- `docs/00_PRODUCT_SCOPE_FINAL.md`: Phạm vi, vai trò, quyết định P0.
- `docs/01_ARCHITECTURE_FINAL.md`: Kiến trúc tổng thể, PWA, CSDL, bảo mật.
- `docs/02_FORMS_DATA_RULES_FINAL.md`: Nghiệp vụ biểu mẫu và quy tắc dữ liệu.
- `docs/03_SCREEN_MENU_UIUX_FINAL.md`: Màn hình, menu, điều hướng và UI/UX.
- `docs/04_IMPLEMENTATION_PLAN_FINAL.md`: Kế hoạch và thứ tự triển khai các Phase.

---

## 2. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu môi trường
- Node.js >= 20
- pnpm >= 9 (khuyến nghị pnpm 12)

### Các bước bắt đầu
1. **Clone repo & cài dependencies**:
   ```bash
   pnpm install
   ```

2. **Cấu hình môi trường**:
   Sao chép `.env.example` thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   > ⚠️ **Lưu ý bảo mật:** Tuyệt đối không commit file `.env.local` hoặc để lộ khóa `SERVICE_ROLE_KEY`.

3. **Khởi chạy ứng dụng ở chế độ DEV**:
   ```bash
   pnpm dev
   ```
   Truy cập tại: `http://localhost:3000`

4. **Chạy kiểm thử (Tests)**:
   ```bash
   pnpm test
   ```

5. **Kiểm tra kiểu (Typecheck) & Lint**:
   ```bash
   pnpm typecheck
   pnpm lint
   ```

6. **Build sản phẩm**:
   ```bash
   pnpm build
   ```

---

## 3. Cấu trúc 5 Khu vực làm việc (Area-first)
Hệ thống quản lý 5 khu vực với số lượng máy phân định:
- 🧪 **Khu Sinh hóa**: 9 máy phân tích
- 🔬 **Khu Miễn dịch**: 8 máy xét nghiệm
- 🧪 **Khu Nước tiểu**: 4 máy phân tích & cặn
- 🔄 **Khu Ly tâm**: 4 máy ly tâm
- 📋 **Khu Nhận bệnh phẩm**: Biểu mẫu vệ sinh & khử nhiễm BM.01_KNBM
