# HousingLoanChecker — Hệ thống hỗ trợ tiền thẩm định hồ sơ vay mua nhà

> File này là đặc tả để coding agent xây dựng **prototype** hoàn chỉnh. Hãy đọc hết trước khi code, làm theo thứ tự ở mục 12, và chỉ hỏi lại người dùng khi một quyết định thật sự chặn tiến độ. Nếu có chỗ chưa rõ, chọn phương án đơn giản nhất và ghi vào `DECISIONS.md`.

---

## 1. Bối cảnh

Bài tập môn Công nghệ dịch vụ tài chính (nhóm 12). Mô hình kinh doanh B2B: bán giải pháp phần mềm cho ngân hàng thương mại.

HousingLoanChecker **không** phải tổ chức cho vay và **không** tự quyết định cấp tín dụng. Đây là công cụ hỗ trợ khâu tiếp nhận, kiểm tra tính đầy đủ và tổng hợp hồ sơ vay mua nhà trước khi thẩm định chính thức.

Đây là **prototype** dùng dữ liệu mô phỏng, phục vụ trình diễn và thử nghiệm kịch bản. Các thứ sau **ngoài phạm vi**: kết nối Core Banking, CIC, VNeID, định giá tài sản tự động, phê duyệt khoản vay, ký hợp đồng, giải ngân, mở tài khoản hay định danh trực tuyến.

## 2. Mục tiêu thử nghiệm

1. Kiểm tra khả năng thực hiện quy trình tiền thẩm định trên prototype.
2. Đánh giá tính chính xác của các phép tính và quy tắc đã cấu hình.
3. Đánh giá khả năng quản lý trạng thái, kiểm tra checklist và tổng hợp báo cáo.
4. So sánh quy trình mô phỏng với quy trình thủ công giả định.
5. Thu thập dữ liệu để đánh giá sơ bộ giá trị kinh doanh và đề xuất cải tiến.

## 3. Công nghệ (ưu tiên ít công sức nhất)

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend/DB/Auth/Storage | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Form & validation | react-hook-form + zod |
| Báo cáo | Trang HTML có style in (`@media print`) + nút "In / Lưu PDF" |
| OCR | Mô phỏng (xem mục 7.2), có thể thay bằng Tesseract.js sau |
| Triển khai | Vercel + Supabase |

Nguyên tắc: không tự viết lại thứ mà Supabase/shadcn đã có sẵn. Không dùng microservice, không dùng ORM nặng; dùng `supabase-js` trực tiếp. Giao diện toàn bộ bằng **tiếng Việt**.

## 4. Vai trò và phân quyền (đặc quyền tối thiểu)

Có 4 vai trò, lưu ở bảng `profiles.role`: `customer`, `cs_staff`, `appraiser`, `admin`.

| Vai trò | Được làm | Không được làm |
|---|---|---|
| **Khách hàng** (`customer`) | Tạo, sửa nháp, nộp, bổ sung và theo dõi hồ sơ của mình; dùng loan simulator; gửi yêu cầu hỗ trợ; nhận thông báo | Xem hồ sơ người khác; tự xác nhận tính hợp lệ chứng từ |
| **Nhân viên quan hệ khách hàng** (`cs_staff`) | Tiếp nhận yêu cầu hỗ trợ, hướng dẫn thủ tục, chuyển câu hỏi chuyên môn cho thẩm định | Xem bản nháp và chứng từ tài chính; sửa kết luận; thao tác nghiệp vụ thay khách |
| **Nhân viên thẩm định** (`appraiser`) | Kiểm tra checklist, phát hành yêu cầu bổ sung chính thức, xác nhận dữ liệu, đánh giá pháp lý tài sản bảo đảm, chạy đánh giá, hoàn tất báo cáo | Truy cập hồ sơ không được phân công |
| **Quản trị viên** (`admin`) | Quản lý tài khoản nhân viên, phân quyền, cấu hình loại hồ sơ / checklist / tiêu chí & ngưỡng | Mặc nhiên đọc tài liệu tài chính của khách hoặc sửa đánh giá |

Phân quyền phải được **thực thi ở tầng DB bằng RLS**, không chỉ ẩn nút trên giao diện. Đăng nhập là "ngân hàng giả lập": dùng Supabase Auth email/password với tài khoản seed (mục 10), kèm banner "Đăng nhập mô phỏng tài khoản ngân hàng".

## 5. Trạng thái (phải tách riêng, đây là điểm cốt lõi của mô hình)

### 5.1 Trạng thái hồ sơ (`applications.status`)
`draft` (Nháp) → `submitted` (Đã gửi) → `in_review` (Đang tiền thẩm định) ⇄ `needs_more_info` (Cần bổ sung) → `completed` (Hoàn tất tiền thẩm định)

- Mỗi lần chuyển trạng thái phải ghi: người thực hiện, thời điểm, điều kiện kích hoạt (vào `status_history`).
- Chỉ `appraiser` được phát hành yêu cầu bổ sung chính thức (chuyển sang `needs_more_info`).
- Khách hàng nhận thông báo mỗi khi trạng thái đổi.

### 5.2 Kết luận sơ bộ (`applications.preliminary_result`) — lưu **riêng** với trạng thái
`none` (chưa có kết luận) | `meets` (đáp ứng tiêu chí sơ bộ) | `not_meets` (chưa đáp ứng tiêu chí sơ bộ) | `needs_review` (cần rà soát thêm)

> "Cần bổ sung" là trạng thái xử lý, **không** đồng nghĩa "không đủ điều kiện vay". Giao diện tuyệt đối không được gộp hai khái niệm này.

### 5.3 Trạng thái yêu cầu hỗ trợ (`support_tickets.status`) — độc lập với hồ sơ
`new` | `in_progress` | `waiting_customer` | `waiting_expert` | `replied` | `closed`. Đóng ticket **không** làm đổi trạng thái hồ sơ.

## 6. Mô hình dữ liệu (gợi ý schema Postgres)

Agent tạo file `supabase/migrations/001_init.sql` gồm:

- `profiles` (id → auth.users, full_name, role, created_at)
- `application_types` (id, name, description, active) — loại hồ sơ
- `checklist_templates` (id, application_type_id, group, doc_name, required, condition jsonb) — `group` ∈ `legal_customer` | `loan_purpose` | `collateral` | `financial_proof`; `condition` mô tả điều kiện phát sinh (vd: loại tài sản = nhà có sổ đỏ, nghề nghiệp = hưởng lương)
- `rule_configs` (id, version, ltv_max, dsr_max, dti_max, min_remaining, active, approved_by, created_at) — **ngưỡng là tham số cấu hình, có phiên bản**
- `applications` (id, customer_id, assigned_to, type_id, status, preliminary_result, current_version, rule_version, created_at, updated_at)
- `application_versions` (id, application_id, version_no, data jsonb, submitted_at) — **mỗi lần nộp/bổ sung là một phiên bản mới, không ghi đè**
- `documents` (id, application_id, version_no, group, doc_name, file_path, mime, size, status, ocr_data jsonb, confirmed_by, confirmed_at)
- `check_results` (id, application_id, version_no, kind, severity, message, resolved) — kết quả kiểm tra checklist / nhất quán
- `financial_assessments` (id, application_id, version_no, I, C, D, A, P, V, ltv, dsr, dti, remaining, details jsonb, rule_version, confirmed_by, created_at)
- `legal_assessments` (id, application_id, collateral_status, notes, assessed_by, created_at)
- `reports` (id, application_id, version_no, content jsonb, rule_version, created_by, created_at)
- `support_tickets`, `ticket_messages` (có cờ `internal boolean`; tin nội bộ không hiển thị cho khách)
- `notifications` (id, user_id, title, body, read, created_at)
- `audit_logs` (id, actor_id, action, entity, entity_id, meta jsonb, created_at)

Bật RLS cho **mọi** bảng và viết policy theo bảng phân quyền ở mục 4. Bucket Storage `documents` là private; truy cập qua signed URL.

## 7. Chức năng chi tiết theo kịch bản

### 7.1 (a) Khách hàng khai báo thông tin & mô phỏng LTV/DTI/DSR (loan simulator)

**Biểu mẫu nhiều bước, có lưu nháp, quay lại chỉnh sửa được trước khi gửi:**
1. Thông tin cá nhân & tình trạng hôn nhân
2. Nghề nghiệp & thu nhập (hưởng lương / chủ doanh nghiệp, hộ kinh doanh)
3. Nghĩa vụ tài chính hiện tại
4. Khoản vay đề nghị (số tiền, kỳ hạn, lãi suất giả định)
5. Tài sản dự kiến mua (nhà có sổ đỏ / mua từ chủ đầu tư, giá trị)

**Validation lớp 1** (zod): trường bắt buộc, định dạng, độ dài, ngày hết hạn giấy tờ (vd CCCD hết hạn), nhất quán giữa các trường đã khai.

**Loan simulator** (khách dùng được kể cả trước khi nộp): nhập I, C, D, P, V, kỳ hạn, lãi suất → hiển thị A (trả nợ hàng tháng, công thức annuity), LTV, DSR, DTI, số tiền còn lại, kèm công thức, giá trị đầu vào và ngưỡng áp dụng. Kết quả của simulator chỉ mang tính tham khảo, ghi rõ trên giao diện và **không** lưu thành kết luận hồ sơ.

### 7.2 (b) Tải hồ sơ, đối chiếu checklist, OCR & kiểm tra nhất quán

- Tải tài liệu theo 4 nhóm: pháp lý khách hàng, chứng minh mục đích vay, tài sản bảo đảm, chứng minh tài chính. Kiểm soát định dạng (pdf/jpg/png), dung lượng (≤ 10 MB), loại tệp.
- **Checklist sinh tự động** theo loại hồ sơ + đặc điểm người vay, ví dụ:
  - Nhà đã có sổ đỏ → sổ đỏ + hợp đồng mua bán/chuyển nhượng có công chứng.
  - Nhà mua từ chủ đầu tư → hợp đồng mua bán với CĐT + thông báo/xác nhận đóng tiền + phiếu thu.
  - Hưởng lương → hợp đồng lao động + sao kê + xác nhận lương.
  - Chủ doanh nghiệp / hộ kinh doanh → báo cáo tài chính + hồ sơ thuế.
- Giao diện checklist cho khách: mỗi mục có trạng thái `Chưa nộp / Đã nộp / Cần bổ sung`, hiển thị rõ tài liệu còn thiếu.
- **Quy tắc kiểm tra tự động** (chỉ **cảnh báo**, tạo bản ghi `check_results`, không tự chấp nhận hay từ chối): CCCD hết hạn; thông tin định danh không khớp giữa các trường; thiếu giấy tờ tình trạng hôn nhân; sao kê thiếu tháng; thiếu phiếu thu hoặc chứng từ vốn tự có.
- **OCR ở mức gợi ý (lớp 2):** viết module `lib/ocr.ts` có interface `extract(file): Promise<Record<string,string>>`. Bản prototype **mô phỏng**: trả về dữ liệu giả theo tên file/loại tài liệu (có thể cố tình sinh vài sai lệch để demo cảnh báo). Hiển thị dữ liệu OCR **cạnh** dữ liệu khách khai để nhân viên đối chiếu; **không bao giờ tự ghi đè**. Thiết kế để sau này thay bằng Tesseract.js hoặc API thật mà không đổi giao diện.
- Mỗi lần nộp hoặc bổ sung tạo `application_versions` mới và giữ lịch sử.

### 7.3 (c) Nhân viên thẩm định kiểm tra, đánh giá pháp lý, ghi nhận kết quả

- Danh sách hồ sơ được phân công, lọc theo trạng thái.
- Màn hình chi tiết hồ sơ: dữ liệu khai báo, tài liệu, checklist, cảnh báo, OCR đối chiếu, lịch sử phiên bản.
- Hành động: xác nhận từng tài liệu / từng trường dữ liệu; phát hành **yêu cầu bổ sung chính thức** (kèm danh sách mục thiếu và lời nhắn) → trạng thái `needs_more_info`, gửi thông báo cho khách.
- **Đánh giá pháp lý tài sản bảo đảm:** biểu mẫu ghi nhận (tình trạng sổ đỏ, tranh chấp/thế chấp, công chứng, ghi chú) + chọn kết quả: `Đạt sơ bộ` / `Cần làm rõ` / `Chưa đạt sơ bộ`.
- **Chỉ dữ liệu đã được thẩm định xác nhận mới được đưa vào tính toán** (lớp 3, lớp quyết định). Nút "Chạy đánh giá tài chính" bị khóa tới khi các dữ liệu I, C, D, A, P, V đã xác nhận.
- Ghi nhận kết luận sơ bộ (mục 5.2).

### 7.4 Tính toán chỉ tiêu tài chính (module thuần, có unit test)

Đầu vào đã xác nhận: **I** thu nhập ròng hàng tháng được chấp nhận, **C** chi phí sinh hoạt, **D** nghĩa vụ nợ hiện tại (hàng tháng), **A** khoản trả nợ dự kiến của khoản vay mới (hàng tháng), **P** số tiền đề nghị vay, **V** giá trị tài sản bảo đảm được chấp nhận.

| Chỉ tiêu | Công thức | Ghi chú |
|---|---|---|
| LTV | `P / V` | theo tài liệu |
| DSR | `(D + A) / I` | theo tài liệu |
| Số tiền còn lại / tháng | `I − C − D − A` | theo tài liệu |
| DTI | `D / I` | **Giả định của prototype** (tài liệu chỉ nêu tên DTI ở kịch bản thử nghiệm, chưa định nghĩa công thức); đặt công thức trong 1 hằng số/hàm dễ sửa và ghi rõ trên UI |

Quy tắc bắt buộc:
- Ngưỡng lấy từ `rule_configs` đang `active`, **không hard-code**. Dữ liệu seed (tham số mẫu): `ltv_max = 0.70`, `dsr_max = 0.50`, `dti_max = 0.40`, `min_remaining = 0`. Ghi chú trên UI: "Tham số mô phỏng, cần bộ phận nghiệp vụ xác nhận".
- **Phân biệt trường chưa có dữ liệu (`null`) với giá trị 0.** Không chia khi mẫu số ≤ 0 hoặc thiếu; trả `insufficient_data` ("chưa đủ dữ liệu") thay vì nhãn đạt/không đạt.
- Mỗi chỉ tiêu trả về: giá trị, công thức, các giá trị đầu vào, ngưỡng áp dụng, kết quả (`pass` / `fail` / `insufficient_data`) và lý do dạng văn bản.
- Lưu cùng `rule_version` và `version_no` hồ sơ để truy vết.
- Kết luận sơ bộ gợi ý: tất cả `pass` → `meets`; có `fail` → `not_meets`; có `insufficient_data` → `needs_review`. Nhân viên thẩm định có thể xác nhận hoặc đổi sang `needs_review`.

### 7.5 (d) Tổng hợp & sinh báo cáo tiền thẩm định, thông báo trạng thái

Báo cáo (trang `/applications/[id]/report`, in được thành PDF) gồm:
1. Thông tin hồ sơ & phiên bản
2. Danh mục tài liệu đã nộp / còn thiếu
3. Kết quả kiểm tra (cảnh báo, mục đã xử lý)
4. Đánh giá pháp lý tài sản bảo đảm
5. Các chỉ tiêu tài chính **kèm căn cứ tính** (công thức, đầu vào, ngưỡng)
6. Kết luận sơ bộ và các điểm cần rà soát thêm
7. Phiên bản quy tắc, thời điểm lập, người xác nhận
8. Dòng ghi chú cố định: *"Đây là tài liệu hỗ trợ xem xét nội bộ, không thay thế báo cáo thẩm định tín dụng chính thức."*

Hoàn tất báo cáo → trạng thái `completed` + thông báo cho khách hàng (chỉ phần kết quả được phép công bố, không lộ ghi chú nội bộ).

**Thông báo:** bảng `notifications` + biểu tượng chuông có badge trong header; tạo thông báo khi nộp hồ sơ, có yêu cầu bổ sung, đổi trạng thái, có trả lời hỗ trợ.

### 7.6 (e) Quản trị viên cấu hình

- CRUD **loại hồ sơ**.
- CRUD **checklist template** theo loại hồ sơ (nhóm, tên tài liệu, bắt buộc, điều kiện phát sinh).
- Quản lý **tiêu chí đánh giá & ngưỡng** (`rule_configs`): mỗi lần sửa tạo **phiên bản mới**, ghi người phê duyệt; hồ sơ cũ vẫn gắn phiên bản đã dùng.
- Quản lý tài khoản nhân viên và vai trò; phân công hồ sơ cho thẩm định.
- Xem **audit log** (đăng nhập, xem/tải tài liệu, đổi trạng thái, xác nhận dữ liệu, chạy đánh giá, đổi cấu hình).
- Admin **không** xem được tài liệu tài chính của khách và không sửa đánh giá (RLS chặn).

### 7.7 Hỗ trợ khách hàng

- Khách gửi yêu cầu hỗ trợ bằng văn bản (chọn chủ đề + nội dung).
- `cs_staff` xử lý theo hàng đợi, trả lời khách; khi là câu hỏi chuyên môn thì chuyển cho `appraiser` (trạng thái `waiting_expert`). Phần trả lời nội bộ (`internal = true`) **không** tự động hiển thị cho khách.
- Hỗ trợ **không** thay yêu cầu bổ sung chính thức và không đổi kết luận hồ sơ.

### 7.8 Màn hình so sánh hiệu quả (phục vụ mục tiêu thử nghiệm số 4–5)

Trang `/admin/metrics` (admin xem được số liệu tổng hợp, không xem nội dung hồ sơ):
- Tỷ lệ hồ sơ thiếu thông tin, số lần bổ sung trung bình, thời gian hoàn thiện hồ sơ (từ `submitted` đến `completed`), số lỗi phân quyền ghi nhận, số cảnh báo theo loại.
- Bảng so sánh với **quy trình thủ công giả định**: nhập tay các tham số giả định (số bước, thời gian mỗi bước, tỷ lệ thiếu hồ sơ), hiển thị cạnh số liệu mô phỏng.
- Ghi rõ trên trang: *"Số liệu từ dữ liệu mô phỏng, chỉ dùng để đối chiếu giả thuyết, không phải thành tích đã đạt."*

## 8. Cấu trúc thư mục gợi ý

```
src/
  app/
    (auth)/login/
    customer/            # dashboard, applications/new, applications/[id], simulator, support
    staff/cs/            # hàng đợi hỗ trợ
    staff/appraiser/     # danh sách hồ sơ, applications/[id], applications/[id]/report
    admin/               # users, application-types, checklists, rules, audit, metrics
  components/            # shadcn/ui + component dùng chung (StatusBadge, ChecklistPanel, RatioCard...)
  lib/
    supabase/            # client, server, middleware
    finance.ts           # tính LTV, DSR, DTI, remaining (thuần, có test)
    checklist.ts         # sinh checklist theo loại hồ sơ + điều kiện
    validators.ts        # zod schemas + quy tắc nhất quán
    ocr.ts               # OCR mô phỏng
    audit.ts             # ghi audit log
supabase/
  migrations/001_init.sql
  seed.sql
```

## 9. Yêu cầu phi chức năng

- UI tiếng Việt, responsive, dùng được trên laptop và điện thoại.
- Mọi thao tác quan trọng ghi `audit_logs`.
- Không log hay hiển thị dữ liệu nhân thân thừa; file tải lên chỉ truy cập qua signed URL.
- Số tiền định dạng VND (`Intl.NumberFormat('vi-VN')`), tỷ lệ hiển thị dạng %.
- Có banner cố định: *"Prototype — dữ liệu mô phỏng. Kết quả chỉ hỗ trợ sàng lọc, không phải quyết định cho vay."*
- Biến môi trường trong `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) và file `.env.example`. Không commit khóa thật.

## 10. Dữ liệu seed (mô phỏng)

Tài khoản (mật khẩu chung `Demo@12345`):

| Email | Vai trò |
|---|---|
| `khach1@demo.vn`, `khach2@demo.vn` | customer |
| `cskh1@demo.vn` | cs_staff |
| `thamdinh1@demo.vn` | appraiser |
| `admin@demo.vn` | admin |

Seed thêm: 1 loại hồ sơ "Vay mua nhà cá nhân", đầy đủ checklist template (4 nhóm như mục 7.2), 1 `rule_config` active, và 3 hồ sơ mẫu: (1) nháp, (2) đã gửi nhưng thiếu giấy tờ và có CCCD hết hạn, (3) đã đủ dữ liệu để chạy đánh giá (có cả trường hợp LTV vượt ngưỡng).

## 11. Kịch bản kiểm thử nghiệm thu

**Kịch bản 1 — Tiếp nhận & kiểm tra hồ sơ.** Khách đăng nhập → khai báo → tải thiếu tài liệu → nộp. Thẩm định thấy cảnh báo thiếu giấy tờ / CCCD hết hạn → phát hành yêu cầu bổ sung → hồ sơ sang `needs_more_info`, khách nhận thông báo → khách nộp bản bổ sung (tạo version 2, version 1 vẫn còn).

**Kịch bản 2 — Đánh giá sơ bộ năng lực tài chính.** Nhập dữ liệu giả lập I, C, D, A, P, V. Phải đạt:
- Ví dụ: I=30.000.000; C=8.000.000; D=3.000.000; A=9.000.000; P=1.400.000.000; V=2.000.000.000 → LTV=70%, DSR=40%, DTI=10%, còn lại=10.000.000.
- Thiếu I hoặc I=0 → trả "chưa đủ dữ liệu", không ném lỗi chia cho 0.
- Đổi ngưỡng ở admin → kết quả đổi theo, và hồ sơ cũ vẫn ghi đúng phiên bản quy tắc đã dùng.
- Chưa xác nhận dữ liệu → không chạy được đánh giá.

**Kịch bản 3 — Tổng hợp báo cáo.** Thẩm định ghi nhận kết quả → hệ thống sinh báo cáo đủ 8 mục ở 7.5, nhất quán với dữ liệu đã xác nhận, in được ra PDF, hồ sơ sang `completed`, khách nhận thông báo.

**Kiểm thử phân quyền.** `cs_staff` không đọc được chứng từ tài chính; `admin` không đọc được tài liệu khách; khách A không thấy hồ sơ khách B; thẩm định chỉ thấy hồ sơ được giao (kiểm bằng truy vấn trực tiếp, không chỉ bằng UI).

## 12. Thứ tự thực hiện (làm từng bước, chạy được sau mỗi bước)

1. Khởi tạo Next.js + Tailwind + shadcn/ui + Supabase client; `.env.example`.
2. Migration schema + RLS + seed; trang đăng nhập; điều hướng theo vai trò.
3. `lib/finance.ts` + unit test (các ví dụ ở mục 11) — làm trước UI.
4. Biểu mẫu nhiều bước + lưu nháp + loan simulator (7.1).
5. Upload tài liệu + sinh checklist + quy tắc kiểm tra + OCR mô phỏng + phiên bản hồ sơ (7.2).
6. Màn hình thẩm định: xác nhận dữ liệu, yêu cầu bổ sung, đánh giá pháp lý, chạy đánh giá tài chính (7.3, 7.4).
7. Báo cáo + thông báo + chuyển trạng thái (7.5).
8. Trang admin: loại hồ sơ, checklist, ngưỡng có phiên bản, tài khoản, audit log (7.6).
9. Hỗ trợ khách hàng (7.7).
10. Trang metrics so sánh thủ công (7.8), rà soát RLS, chạy toàn bộ kịch bản nghiệm thu mục 11.

## 13. Điều agent không được làm

- Không hard-code ngưỡng tín dụng; không coi ngưỡng mẫu là chính sách của ngân hàng nào.
- Không gộp trạng thái hồ sơ với kết luận sơ bộ.
- Không để OCR hoặc quy tắc tự động tự ghi đè dữ liệu khách hoặc tự chấp nhận/từ chối hồ sơ.
- Không tính toán trên dữ liệu chưa được thẩm định xác nhận.
- Không ghi đè phiên bản hồ sơ cũ.
- Không tuyên bố số liệu hiệu quả (tiết kiệm thời gian, nhân lực) như thành tích đã đạt.
- Không thêm tính năng ngoài phạm vi (kết nối ngân hàng thật, ký hợp đồng, giải ngân…).