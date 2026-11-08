# BÁO CÁO ĐỒ ÁN — TUẦN 3
## HỌC PHẦN: HỆ THỐNG THÔNG TIN DOANH NGHIỆP (MÃ HP: 841065)
### ĐỀ TÀI: LẬP BẢNG CÂU HỎI KHẢO SÁT PHÂN TÍCH HỆ THỐNG QUẢN LÝ NHÂN SỰ (HRM) TRUNG TÂM NGOẠI NGỮ BÌNH AN

**Nhóm thực hiện**: Nhóm 07  
**Thành viên nhóm**:
1. Bùi Minh Quang (Trưởng nhóm) — MSSV: 3123411240 (Đánh giá: 100%)
2. Nguyễn Thái Quân — MSSV: 3123411246 (Đánh giá: 100%)
3. Đỗ Vĩ Ngạn — MSSV: 3123411195 (Đánh giá: 100%)
4. Lưu Chấn Hào — MSSV: 3123411083 (Đánh giá: 100%)
5. Nguyễn Trường Thành — MSSV: 3123411270 (Đánh giá: 100%)

**Ngày nộp bài**: 22/09/2026  
**Thư mục nộp bài**: `Folder 2. ĐỒ ÁN/ 2026.09.22 – BC DA`  
**File Word đính kèm**:
- `docs/bao-cao-tuan-3-hrm-binh-an.docx`
- `2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom07_BaoCao_Tuan3_BangCauHoi_PhanTichHeThong.docx`
- `2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom7.docx`

---

## 1. MỤC TIÊU VÀ ĐỐI TƯỢNG KHẢO SÁT

### 1.1. Mục tiêu khảo sát
- Nhận diện các khó khăn, hạn chế trong quy trình quản lý nhân sự hiện tại tại Trung tâm Ngoại ngữ Bình An.
- Thu thập yêu cầu nghiệp vụ từ các bên liên quan để làm cơ sở xây dựng kiến trúc phân hệ, thiết kế cơ sở dữ liệu MySQL và xây dựng API backend Spring Boot + giao diện React.
- Cụ thể hóa các ràng buộc toàn vẹn dữ liệu (UNIQUE, khóa ngoại, không xóa cứng) và quy tắc bảo mật dữ liệu (RBAC, bảo vệ phiếu lương cá nhân).

### 1.2. Danh sách các nhóm đối tượng được khảo sát
1. **Ban Giám đốc (BOD)**: Theo dõi báo cáo KPI, tổng quỹ lương, biến động nhân sự và định hướng chính sách.
2. **Quản lý / Chuyên viên Nhân sự (HR Manager / HR Staff)**: Quản lý hồ sơ, hợp đồng, duyệt đơn nghỉ, chấm công, chốt kỳ lương.
3. **Trưởng bộ phận / Trưởng nhóm (Leader - Đào tạo, Tuyển sinh, Vận hành)**: Phân ca, xếp lịch làm việc/dạy học, duyệt nghỉ phép của nhóm, xác nhận giờ tăng ca.
4. **Giảng viên & Nhân viên (Teachers & Staff)**: Xem lịch làm, check-in/out, làm đơn xin nghỉ, tra cứu và in phiếu lương cá nhân.
5. **Kế toán viên (Accountant)**: Đối soát các khoản phụ cấp, giảm trừ, tạm ứng, tiền làm thêm giờ và thanh toán lương thực lĩnh.
6. **Quản trị hệ thống (System Administrator / IT)**: Cấp tài khoản, phân quyền RBAC, theo dõi audit log, sao lưu và khôi phục CSDL.

### 1.3. Các phân hệ (Modules) khảo sát
- **Module 1**: Quản trị tài khoản, Người dùng & Phân quyền RBAC (`users`, `roles`, `permissions`, `user_roles`)
- **Module 2**: Quản lý Cơ cấu tổ chức, Hồ sơ nhân sự & Hợp đồng lao động (`departments`, `positions`, `employees`, `employment_contracts`)
- **Module 3**: Phân ca làm việc & Quản lý Lịch làm việc (`work_shifts`, `work_schedules`)
- **Module 4**: Quản lý Chấm công & Tăng ca (`attendance_records`)
- **Module 5**: Quản lý Đơn từ & Quy trình Phê duyệt nghỉ phép (`leave_types`, `leave_requests`)
- **Module 6**: Quản lý Tiền lương, Kỳ lương & Phiếu lương (`payroll_periods`, `payrolls`, `payroll_items`, `salary_settings`)
- **Module 7**: Báo cáo Thống kê & Dashboard phân tích nhân sự
- **Module 8**: An toàn thông tin, Audit Log & Sao lưu/Phục hồi CSDL (`audit_logs`, scripts backup/restore)

---

## 2. BẢNG CÂU HỎI KHẢO SÁT PHÂN TÍCH HỆ THỐNG CHI TIẾT (28 CÂU HỎI)

| STT | Mã | Đối tượng được hỏi | Phục vụ Module | Thang đo áp dụng | Nội dung câu hỏi khảo sát | Các phương án trả lời theo thang đo | Mục đích phân tích & Yêu cầu CSDL tương ứng |
|:---:|:---:|:---|:---|:---|:---|:---|:---|
| 1 | Q01 | Quản trị IT, Quản lý HR | Quản trị hệ thống & RBAC | Định danh (Nominal) | Hiện tại trung tâm đang quản lý tài khoản và phân quyền cho nhân viên bằng cách nào? | [A] Dùng chung tài khoản theo bộ phận<br>[B] Cấp tài khoản riêng theo vai trò<br>[C] Đăng nhập Google Workspace / SSO<br>[D] Chưa có hệ thống (lưu file thủ công) | Thiết kế bảng `users`, xác thực Spring Security JWT, phân quyền theo vai trò `user_roles`. |
| 2 | Q02 | Ban Giám đốc, Quản trị IT, HR | Quản trị hệ thống & RBAC | Likert 5 mức độ | Đánh giá mức độ cấp thiết của việc phân tách 4 vai trò chính: Admin, HR Manager, Team Leader, Employee? | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Rất cấp thiết | Chuẩn hóa 4 vai trò trong bảng `roles` và thiết lập ma trận `role_permissions` bảo vệ API. |
| 3 | Q03 | Quản trị IT | Quản trị hệ thống & RBAC | Định danh (Nominal) | Khi một nhân viên chấm dứt hợp đồng, tài khoản đăng nhập được xử lý ra sao? | [A] Tự động khóa khi nhân viên sang INACTIVE<br>[B] Admin khóa thủ công sau khi HR báo<br>[C] Xóa vĩnh viễn tài khoản khỏi hệ thống<br>[D] Chưa có quy trình chuẩn | Thiết kế cập nhật `users.status = 'INACTIVE'`, loại bỏ Hard Delete để bảo toàn dữ liệu lịch sử. |
| 4 | Q04 | Ban Giám đốc, Quản trị IT, HR | Quản trị hệ thống & RBAC | Nhị phân & Thứ bậc | Hệ thống có cần tự động ghi nhật ký (Audit Log) lại mọi thao tác nhạy cảm (sửa lương, đổi quyền) không? | [ ] Có / [ ] Không<br>Mức độ ưu tiên: [1] Cực kỳ cấp bách; [2] Quan trọng; [3] Bình thường | Thiết kế bảng `audit_logs` lưu `actor_username`, `action`, `entity_name`, `entity_id`, `created_at`, `detail`. |
| 5 | Q05 | Quản lý Nhân sự (HR) | Hồ sơ nhân viên & Hợp đồng | Định danh (Nominal) | Bộ phận HR hiện đang quản lý hồ sơ nhân sự và hợp đồng bằng công cụ chính nào? | [A] Excel / Google Sheets<br>[B] Hồ sơ giấy tại văn phòng<br>[C] Phần mềm HRM đóng gói<br>[D] Kết hợp cả Excel và hồ sơ giấy | Thiết kế bảng `employees` và `employment_contracts` tập trung trên MySQL. |
| 6 | Q06 | Quản lý Nhân sự (HR) | Hồ sơ nhân viên & Hợp đồng | Định danh (Nominal) | Trung tâm hiện đang ký kết và quản lý những loại hợp đồng lao động nào? | [A] Thử việc<br>[B] Xác định thời hạn (6T - 1N)<br>[C] Không xác định thời hạn<br>[D] Khoán việc / Giảng viên theo giờ<br>[E] Thực tập | Đặc tả trường `contract_type` trong bảng `employment_contracts`, theo dõi `start_date`, `end_date`. |
| 7 | Q07 | Quản lý Nhân sự (HR) | Hồ sơ nhân viên & Hợp đồng | Likert 5 mức độ | Mức độ đồng ý: "Hệ thống cần chặn trùng tuyệt đối trên Mã NV, CCCD và Email để loại bỏ lỗi nhập trùng?" | 1: Rất không đồng ý<br>2: Không đồng ý<br>3: Phân vân<br>4: Đồng ý<br>5: Hoàn toàn đồng ý | Thiết lập ràng buộc `UNIQUE(employee_code)`, `UNIQUE(national_id)`, `UNIQUE(email)` trên `employees`. |
| 8 | Q08 | Quản lý Nhân sự (HR) | Cơ cấu tổ chức & Phòng ban | Thứ bậc (Ordinal) | Khi điều chuyển nhân viên sang phòng ban hoặc chức vụ mới, phương án lưu trữ nào được ưu tiên nhất? | Xếp hạng 1, 2, 3:<br>[ ] Ghi đè lên phòng ban/chức vụ mới<br>[ ] Lưu lịch sử các đợt điều chuyển<br>[ ] Ghi vết điều chuyển vào Audit Log | Xác định quan hệ giữa `departments`, `positions` với `employees` và ghi vết biến động. |
| 9 | Q09 | Trưởng Đào tạo, Quản lý HR | Phân ca & Lịch làm việc | Định danh (Nominal) | Trung tâm hiện tổ chức các ca làm việc cho giáo viên và nhân viên theo những khung giờ nào? | [A] Ca hành chính (8h00 - 17h00)<br>[B] Ca sáng (7h30 - 11h30)<br>[C] Ca chiều (13h30 - 17h30)<br>[D] Ca tối dạy học (17h45 - 21h15)<br>[E] Ca linh hoạt theo lớp học | Thiết kế bảng danh mục ca làm `work_shifts` chứa `name`, `start_time`, `end_time`, `overtime_rate`. |
| 10 | Q10 | Trưởng nhóm, Giảng viên/NV | Phân ca & Lịch làm việc | Tần suất (Frequency) | Lịch làm việc và lịch dạy thường được lập và công bố với chu kỳ như thế nào? | [A] Hàng tuần (thứ 6 tuần trước)<br>[B] Hai tuần một lần<br>[C] Hàng tháng (trước ngày 25)<br>[D] Theo từng khóa học (2-3 tháng)<br>[E] Linh hoạt theo ngày | Thiết kế giao diện lập lịch và bảng lưu trữ `work_schedules` hỗ trợ lọc theo tuần và tháng. |
| 11 | Q11 | Trưởng nhóm, Quản lý HR | Phân ca & Lịch làm việc | Likert 5 mức độ | Đánh giá mức độ cần thiết của tính năng tự động chặn trùng lịch (1 nhân viên không bị xếp 2 ca/ngày)? | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Cực kỳ cấp thiết | Thiết lập ràng buộc toàn vẹn `UNIQUE KEY uk_schedule_date (employee_id, work_date)` trên `work_schedules`. |
| 12 | Q12 | Giảng viên, NV, Trưởng nhóm | Chấm công & Tăng ca | Định danh (Nominal) | Phương thức ghi nhận chấm công vào/ra (check-in/out) hiện tại của trung tâm là gì? | [A] Ký sổ giấy tại lễ tân<br>[B] Máy vân tay/khuôn mặt độc lập<br>[C] Trưởng nhóm điểm danh thủ công<br>[D] Tự khai báo giờ làm trên biểu mẫu online | Thiết kế bảng `attendance_records` gồm `check_in`, `check_out`, `worked_hours`, `overtime_hours`. |
| 13 | Q13 | Quản lý HR, Trưởng nhóm | Chấm công & Tăng ca | Thứ bậc (Ordinal) | Khó khăn lớn nhất trong việc quản lý và tổng hợp chấm công hiện nay là gì? | Xếp hạng 1, 2, 3:<br>[ ] Nhân viên quên chấm công hoặc gian lận<br>[ ] Tốn nhiều ngày đối soát thủ công<br>[ ] Dữ liệu bị ghi trùng hoặc sai giờ OT | Tự động hóa tính toán ngày công và giờ làm thêm từ `check_in` và `check_out` so với ca chuẩn. |
| 14 | Q14 | Giảng viên, Nhân viên | Chấm công & Tăng ca | Nhị phân (Dichotomous) | Hệ thống có cần chức năng cho phép nhân viên gửi yêu cầu "Giải trình / Bổ sung công" khi quên quẹt thẻ? | [ ] Có / [ ] Không | Cho phép cập nhật bản ghi chấm công có kèm lý do và ghi nhận Audit log thao tác của HR. |
| 15 | Q15 | Quản lý HR, Kế toán | Chấm công & Tăng ca | Likert 5 mức độ | Mức độ đồng ý: "Hệ thống phải tuyệt đối ngăn chặn việc tạo 2 bản ghi chấm công cho cùng 1 nhân viên trong ngày?" | 1: Rất không đồng ý<br>2: Không đồng ý<br>3: Phân vân<br>4: Đồng ý<br>5: Hoàn toàn đồng ý | Thiết lập ràng buộc `UNIQUE KEY uk_attendance_date (employee_id, attendance_date)` (lỗi HTTP 409 Conflict). |
| 16 | Q16 | Giảng viên, NV, HR | Đơn từ & Nghỉ phép | Định danh (Nominal) | Nhân viên và giáo viên hiện nộp đơn xin nghỉ phép qua kênh nào? | [A] Đơn giấy viết tay<br>[B] Gửi qua email công ty<br>[C] Nhắn tin nhóm Zalo nội bộ<br>[D] Gọi điện thoại trực tiếp | Số hóa toàn bộ đơn từ qua bảng `leave_requests` trên giao diện web/mobile. |
| 17 | Q17 | Quản lý Nhân sự (HR) | Đơn từ & Nghỉ phép | Định danh (Nominal) | Trung tâm cần phân loại và theo dõi các chế độ nghỉ phép nào trong hệ thống? | [A] Nghỉ phép năm (hưởng lương)<br>[B] Nghỉ ốm đau / thai sản<br>[C] Nghỉ việc riêng không lương<br>[D] Đơn xin thôi việc / chấm dứt HĐ | Chuẩn hóa danh mục `leave_types` (`code`, `name`, `annual_days`) và ràng buộc số ngày phép năm. |
| 18 | Q18 | Quản lý HR, Trưởng nhóm | Đơn từ & Nghỉ phép | Likert 5 mức độ | Đánh giá mức độ cần thiết của tính năng tự động chặn trùng ngày xin nghỉ (từ ngày... đến ngày... đã có đơn)? | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Rất cấp thiết | Xây dựng thuật toán kiểm tra overlap thời gian trong `LeaveService` trước khi lưu đơn. |
| 19 | Q19 | Giảng viên, Nhân viên | Đơn từ & Nghỉ phép | Likert 5 mức độ (Hài lòng) | Mức độ hài lòng của nhân viên với tốc độ phản hồi và tính minh bạch của quy trình duyệt đơn xin nghỉ hiện tại? | 1: Rất không hài lòng<br>2: Không hài lòng<br>3: Bình thường<br>4: Hài lòng<br>5: Rất hài lòng | Cập nhật trạng thái đơn tức thời (PENDING, APPROVED, REJECTED) kèm trường `rejection_reason`. |
| 20 | Q20 | Kế toán, HR, Ban Giám đốc | Tính lương & Kỳ lương | Định danh (Nominal) | Công thức tính thu nhập thực lĩnh của nhân viên trung tâm gồm những thành phần cấu thành nào? | [A] Lương cơ bản / ngày công chuẩn<br>[B] Phụ cấp chức vụ / đứng lớp<br>[C] Tiền làm thêm giờ (OT)<br>[D] Các khoản giảm trừ (Bảo hiểm, phạt)<br>[E] Thưởng hiệu quả / tuyển sinh | Đặc tả công thức tính lương, bảng `payrolls`, `payroll_items` và tham số `salary_settings`. |
| 21 | Q21 | Kế toán, Quản lý Nhân sự | Tính lương & Kỳ lương | Likert 5 mức độ | Mức độ đồng ý: "Khi kỳ lương đã chuyển sang LOCKED, hệ thống phải cấm tuyệt đối việc sửa đổi hoặc tính lại?" | 1: Rất không đồng ý<br>2: Không đồng ý<br>3: Phân vân<br>4: Đồng ý<br>5: Hoàn toàn đồng ý | Xây dựng cơ chế Snapshot kỳ lương, chặn API tính lại lương khi `payroll_periods.status = 'LOCKED'`. |
| 22 | Q22 | Giảng viên, NV, Admin | Tính lương & Kỳ lương | Likert 5 mức độ | Mức độ cấp thiết về tính riêng tư: "Nhân viên chỉ được xem và in phiếu lương của chính mình, không thấy người khác?" | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Cực kỳ cấp thiết | Cài đặt phân quyền nghiêm ngặt trên API `/api/v1/payrolls/my-payslips`, chặn quyền IDOR (HTTP 403). |
| 23 | Q23 | Giảng viên, NV, Kế toán | Tính lương & Kỳ lương | Định danh (Nominal) | Nhân viên có nhu cầu nhận hoặc xem phiếu lương (payslip) dưới định dạng nào? | [A] Xem trực tuyến trên web cá nhân<br>[B] Bản in giấy A4 sạch đẹp<br>[C] Tải file PDF về máy<br>[D] Nhận file Excel qua email | Xây dựng màn hình xem chi tiết phiếu lương và chức năng Print View chuẩn CSS `@media print`. |
| 24 | Q24 | Ban Giám đốc, Quản lý HR | Báo cáo & Dashboard | Thứ bậc (Ordinal) | Chỉ số nhân sự nào là quan trọng nhất cần hiển thị ngay tại trang Dashboard quản lý? | Xếp hạng 1 đến 5:<br>[ ] Số nhân sự làm/nghỉ/thôi việc<br>[ ] Phân bổ theo phòng ban/chức vụ<br>[ ] Trình độ học vấn & thâm niên<br>[ ] Tổng quỹ lương thực chi trong tháng<br>[ ] Tỷ lệ chuyên cần & giờ tăng ca | Thiết kế các Card thống kê và biểu đồ phân bố trực quan trên màn hình Dashboard. |
| 25 | Q25 | Ban Giám đốc, Quản lý HR | Báo cáo & Dashboard | Tần suất (Frequency) | Ban Giám đốc cần theo dõi và xuất báo cáo tổng hợp tình hình nhân sự với tần suất nào? | [A] Real-time trên Dashboard<br>[B] Báo cáo tổng kết hàng tuần<br>[C] Báo cáo định kỳ hàng tháng<br>[D] Báo cáo tổng kết theo quý/năm | Hỗ trợ bộ lọc thống kê theo tháng (`payroll_month`) và theo năm (`payroll_year`). |
| 26 | Q26 | Quản lý HR, Kế toán | Báo cáo & Dashboard | Likert 5 mức độ | Đánh giá mức độ cần thiết của tính năng tìm kiếm nhanh, lọc nâng cao theo nhiều tiêu chí (phòng ban, chức vụ)? | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Rất cấp thiết | Xây dựng Dynamic Filter trên backend Spring Data JPA và thanh tìm kiếm đa năng trên React. |
| 27 | Q27 | Quản trị IT, Ban Giám đốc | Bảo mật & Sao lưu CSDL | Tần suất (Frequency) | Tần suất sao lưu (Backup) cơ sở dữ liệu MySQL định kỳ được đề xuất như thế nào? | [A] Hàng ngày vào ban đêm (Daily)<br>[B] Hàng tuần<br>[C] Bắt buộc trước khi khóa kỳ lương<br>[D] Khi nâng cấp hệ thống | Viết script tự động hóa `mysqldump` và tài liệu hướng dẫn khôi phục dữ liệu `restore`. |
| 28 | Q28 | Giảng viên, NV, Trưởng nhóm | Trải nghiệm người dùng | Likert 5 mức độ | Đánh giá mức độ cần thiết của việc giao diện ứng dụng hoạt động tốt trên điện thoại thông minh (Responsive)? | 1: Hoàn toàn không cần<br>2: Ít cần<br>3: Bình thường<br>4: Cần thiết<br>5: Rất cấp thiết | Tối ưu giao diện đáp ứng chuẩn Responsive Mobile/Tablet/Desktop (320px đến 1440px). |

---

## 3. MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM)

| Mã YC (FR) | Tên chức năng | Nguồn gốc khảo sát | Mô tả xử lý kỹ thuật | Bảng CSDL liên quan |
|:---:|:---|:---:|:---|:---|
| **FR-01** | Xác thực & Phân quyền RBAC | Q01, Q02, Q03 | Đăng nhập JWT, mã hóa BCrypt, kiểm soát quyền truy cập theo 4 Role. | `users`, `roles`, `user_roles`, `role_permissions` |
| **FR-02** | Quản lý Hồ sơ & Hợp đồng | Q05, Q06, Q07 | Thêm, sửa, tìm kiếm nhân viên; quản lý hợp đồng; chặn trùng mã/CCCD/email. | `employees`, `employment_contracts`, `departments`, `positions` |
| **FR-03** | Quản lý Ca & Xếp lịch làm | Q09, Q10, Q11 | Định nghĩa ca làm việc; phân lịch cho nhân viên; chặn trùng 1 người 2 ca/ngày. | `work_shifts`, `work_schedules` |
| **FR-04** | Quản lý Chấm công & Tăng ca | Q12, Q13, Q14, Q15 | Ghi nhận check-in/out, tự tính giờ làm & tăng ca, chặn trùng bản ghi trong ngày. | `attendance_records` |
| **FR-05** | Quản lý Đơn từ & Nghỉ phép | Q16, Q17, Q18, Q19 | Nộp đơn, phê duyệt/từ chối; tự động kiểm tra chống trùng thời gian xin nghỉ. | `leave_types`, `leave_requests` |
| **FR-06** | Quản lý Tính lương & Kỳ lương | Q20, Q21, Q22, Q23 | Tổng hợp công, tính lương tự động, khóa kỳ lương (LOCKED), in payslip cá nhân. | `payroll_periods`, `payrolls`, `payroll_items`, `salary_settings` |
| **FR-07** | Báo cáo & Dashboard | Q24, Q25, Q26 | Thống kê chỉ số nhân sự tổng quan, biểu đồ cơ cấu, tìm kiếm và lọc đa tiêu chí. | Tích hợp đa bảng (View/Query aggregation) |
| **FR-08** | Audit Log & Sao lưu CSDL | Q04, Q27, Q28 | Ghi vết mọi thao tác nhạy cảm; script sao lưu mysqldump và khôi phục CSDL. | `audit_logs`, scripts backup/restore |

---

## 4. QUY TẮC NGHIỆP VỤ BẤT BIẾN (BUSINESS RULES) ĐÚC KẾT TỪ KHẢO SÁT

1. **BR-01: Ràng buộc tính duy nhất của hồ sơ nhân viên (Q07)**  
   Mỗi nhân viên có `employee_code`, `national_id` (CCCD) và `email` là duy nhất trên toàn hệ thống. Ràng buộc `UNIQUE KEY` tại bảng `employees`.

2. **BR-02: Ràng buộc chống trùng lịch làm việc trong ngày (Q11)**  
   Một nhân viên không thể được phân công 2 ca làm việc trong cùng 1 ngày. Ràng buộc `UNIQUE KEY uk_schedule_date (employee_id, work_date)` trên bảng `work_schedules`.

3. **BR-03: Ràng buộc chống trùng bản ghi chấm công (Q15)**  
   Một nhân viên chỉ có duy nhất 1 bản ghi chấm công chính thức trong một ngày làm việc. Ràng buộc `UNIQUE KEY uk_attendance_date (employee_id, attendance_date)` trên bảng `attendance_records`.

4. **BR-04: Thuật toán kiểm tra không trùng lặp thời gian nghỉ phép (Q18)**  
   Khi nhân viên gửi đơn nghỉ từ ngày A đến ngày B, hệ thống kiểm tra xem khoảng [A, B] có giao thoa với bất kỳ đơn nghỉ nào có trạng thái `PENDING` hoặc `APPROVED` của nhân viên đó hay không. Nếu trùng, trả mã HTTP 409 Conflict.

5. **BR-05: Cơ chế Snapshot và bất biến khi khóa kỳ lương (Q21)**  
   Khi bảng lương tháng được chuyển sang trạng thái `LOCKED`, toàn bộ số liệu tiền lương, phụ cấp, ngày công được lưu thành snapshot cố định. Mọi hành vi sửa đổi trên kỳ đã khóa đều bị chặn ở tầng Service.

6. **BR-06: Nguyên tắc an toàn dữ liệu và quyền riêng tư tiền lương (Q22)**  
   Người dùng mang vai trò `EMPLOYEE` chỉ được phép tra cứu thông tin phiếu lương của chính mình thông qua API xác thực Token JWT. Bất kỳ nỗ lực truy cập vào phiếu lương của nhân viên khác đều bị chặn với mã lỗi HTTP 403 Forbidden.
