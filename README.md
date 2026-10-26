# HousingLoanChecker

Hệ thống hỗ trợ tiếp nhận, kiểm tra tính đầy đủ và tổng hợp hồ sơ vay mua nhà trước khi thẩm định tín dụng chính thức.

## Giới thiệu

HousingLoanChecker được thiết kế cho quy trình tiền thẩm định hồ sơ vay mua nhà trong môi trường ngân hàng. Hệ thống giúp:

- Khách hàng khai báo thông tin vay và theo dõi tiến độ hồ sơ.
- Quản lý checklist tài liệu cần nộp.
- Tính toán các chỉ tiêu tài chính LTV, DSR, DTI và số tiền còn lại mỗi tháng.
- Gửi yêu cầu hỗ trợ và theo dõi trạng thái xử lý.
- Nhân viên thẩm định xác nhận tài liệu, đánh giá pháp lý và ghi nhận kết luận sơ bộ.
- Quản trị viên quản lý các ngưỡng đánh giá và theo dõi lịch sử thao tác.

Hệ thống hỗ trợ tiền thẩm định, không thay thế quyết định cấp tín dụng của ngân hàng.

## Chức năng chính

### Dành cho khách hàng

- Dashboard tổng quan hồ sơ.
- Tạo và chỉnh sửa hồ sơ vay theo biểu mẫu nhiều bước.
- Lưu hồ sơ ở trạng thái nháp trước khi nộp.
- Theo dõi trạng thái:
  - Nháp
  - Đã gửi
  - Đang tiền thẩm định
  - Cần bổ sung
  - Hoàn tất tiền thẩm định
- Theo dõi checklist hồ sơ:
  - Pháp lý khách hàng
  - Mục đích vay
  - Tài sản bảo đảm
  - Chứng minh tài chính
- Tải lên và bổ sung tài liệu.
- Tính khoản vay và các chỉ tiêu tài chính.
- Gửi yêu cầu hỗ trợ.
- Nhận thông báo về trạng thái hồ sơ.

### Dành cho nhân viên thẩm định

- Xem các hồ sơ được phân công.
- Kiểm tra và xác nhận từng tài liệu.
- Đánh giá pháp lý tài sản bảo đảm.
- Phát hành yêu cầu bổ sung chính thức.
- Ghi nhận kết luận sơ bộ:
  - Đáp ứng tiêu chí sơ bộ
  - Cần rà soát thêm
  - Chưa đáp ứng tiêu chí sơ bộ
- Hoàn tất tiền thẩm định hồ sơ.

### Dành cho quản trị viên

- Cấu hình ngưỡng LTV, DSR, DTI.
- Cấu hình mức tiền còn lại tối thiểu.
- Quản lý loại hồ sơ và checklist.
- Quản lý tài khoản và phân quyền.
- Theo dõi audit log.

## Công nghệ sử dụng

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

Lớp dữ liệu hiện tại được tổ chức theo hướng tách biệt để có thể kết nối Supabase ở bước tiếp theo:

- `lib/finance.ts`: các phép tính tài chính thuần.
- `lib/mock-data.ts`: dữ liệu khởi tạo và kiểu dữ liệu nghiệp vụ.
- `localStorage`: lưu trạng thái làm việc trên trình duyệt trong phiên bản hiện tại.

## Yêu cầu môi trường

- Node.js 20.9 trở lên
- npm

## Cài đặt

Clone repository:

```bash
git clone https://github.com/NguyenManhDung27/housing-loan-checker.git
cd housing-loan-checker
```

Cài đặt dependencies:

```bash
npm install
```

## Chạy trên máy local

Khởi động server phát triển:

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

Nếu cổng `3000` đang được sử dụng, Next.js sẽ tự chọn một cổng khác và hiển thị địa chỉ trong terminal.

## Các lệnh thường dùng

```bash
# Chạy môi trường phát triển
npm run dev

# Kiểm tra lint
npm run lint

# Tạo bản build production
npm run build

# Chạy bản build production
npm run start
```

## Cấu trúc thư mục

```text
app/
  globals.css       # Thiết kế giao diện và responsive
  layout.tsx        # Layout và metadata chung
  page.tsx          # Các màn hình và luồng nghiệp vụ chính

lib/
  finance.ts        # Tính LTV, DSR, DTI, khoản trả hàng tháng
  mock-data.ts      # Kiểu dữ liệu và dữ liệu khởi tạo

overview.md         # Đặc tả nghiệp vụ chi tiết
```

## Công thức tài chính

Các chỉ tiêu đang được tính theo cấu hình nghiệp vụ:

| Chỉ tiêu | Công thức |
|---|---|
| LTV | `P / V` |
| DSR | `(D + A) / I` |
| DTI | `D / I` |
| Số tiền còn lại | `I − C − D − A` |

Trong đó:

- `I`: Thu nhập ròng hàng tháng.
- `C`: Chi phí sinh hoạt.
- `D`: Nghĩa vụ nợ hiện tại hàng tháng.
- `A`: Khoản trả nợ dự kiến hàng tháng.
- `P`: Số tiền đề nghị vay.
- `V`: Giá trị tài sản bảo đảm được chấp nhận.

Các ngưỡng mặc định:

- LTV tối đa: `70%`
- DSR tối đa: `50%`
- DTI tối đa: `40%`
- Số tiền còn lại tối thiểu: `0 đồng`

## Chuyển đổi vai trò trên giao diện

Từ biểu tượng tài khoản ở góc trên bên phải, có thể chuyển giữa các vai trò để kiểm tra các màn hình nghiệp vụ:

- Khách hàng
- Nhân viên quan hệ khách hàng
- Nhân viên thẩm định
- Quản trị viên

Đây là cơ chế chuyển vai trò ở lớp giao diện để kiểm tra luồng. Khi triển khai chính thức, cần thay bằng Supabase Auth và phân quyền ở tầng cơ sở dữ liệu bằng RLS.

## Trạng thái triển khai

Đã hoàn thiện:

- Giao diện tiếng Việt responsive.
- Dashboard khách hàng.
- Quy trình hồ sơ nhiều bước.
- Checklist tài liệu.
- Tính toán chỉ tiêu tài chính.
- Gửi yêu cầu hỗ trợ.
- Màn hình thẩm định.
- Màn hình quản trị ngưỡng.
- Lưu trạng thái trên trình duyệt.

Các hạng mục cần kết nối khi triển khai chính thức:

- Supabase Auth.
- PostgreSQL và Row Level Security.
- Supabase Storage cho tài liệu riêng tư.
- Signed URL cho việc xem và tải tài liệu.
- OCR tài liệu.
- Audit log lưu phía máy chủ.
- Thông báo và email thực tế.

## Lưu ý nghiệp vụ

HousingLoanChecker không tự động phê duyệt hoặc từ chối khoản vay. Kết quả tính toán và kết luận sơ bộ chỉ là thông tin hỗ trợ quy trình thẩm định; quyết định tín dụng cuối cùng thuộc về ngân hàng và bộ phận có thẩm quyền.

## Repository

[https://github.com/NguyenManhDung27/housing-loan-checker](https://github.com/NguyenManhDung27/housing-loan-checker)
