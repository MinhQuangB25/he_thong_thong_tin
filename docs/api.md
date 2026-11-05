# API quick reference

Base URL: `/api/v1`. Header bảo vệ: `Authorization: Bearer <JWT>`.

| Nhóm | Endpoint chính | Quyền |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` | Public / authenticated |
| Admin | `GET /users`, `PUT /users/{id}/roles`, `PATCH /users/{id}/status`, `GET /audit-logs` | ADMIN |
| Organization | `GET/POST /departments`, `GET/POST /positions` | HR/ADMIN ghi |
| Contracts | `GET /contracts?employeeId=`, `POST /contracts`, `PATCH /contracts/{id}/terminate` | HR/ADMIN |
| People | `GET /employees`, `GET /employees/{id}`, `GET/PATCH /employees/me`, `POST /employees`, `PUT /employees/{id}`, `DELETE /employees/{id}` | Theo vai trò; `PUT` chỉ HR/ADMIN |
| Leave | `GET /leave-types`, `GET/POST /leave-requests`, `PATCH /leave-requests/{id}/review` | Theo vai trò |
| Attendance | `GET /work-schedules`, `POST /work-schedules`, `GET/POST /attendance` | Theo vai trò |
| Payroll | `POST /payroll-periods`, `POST /payroll-periods/{id}/generate`, `PATCH /payroll-periods/{id}/lock`, `GET /payrolls` | Theo vai trò |
| Assistant | `POST /assistant/answers` | Đã đăng nhập; dữ liệu trả về theo quyền từng role |

Lỗi dùng cấu trúc `status`, `code`, `message`, `details`. Các lỗi nghiệp vụ trùng dữ liệu trả `409`; thiếu xác thực `401`; thiếu quyền `403`; tài nguyên không tồn tại `404`.

## Sửa hồ sơ nhân viên

`PUT /employees/{id}` (ADMIN, HR_MANAGER) nhận `fullName`, `gender`, `nationalId`, `phone`, `email`, `address`, `educationLevel`, `joinDate`, `departmentId`, `positionId`. Mã nhân viên, trạng thái, ngày nghỉ việc và lương **không** sửa qua API này (lương theo hợp đồng, nghỉ việc qua `DELETE`). Nhân viên đã nghỉ việc trả `409`; email/CCCD trùng trả `409`; dữ liệu sai trả `400 VALIDATION_ERROR`; TEAM_LEADER/EMPLOYEE trả `403`. Mỗi lần có thay đổi ghi audit `EMPLOYEE_UPDATED` với tên trường đã đổi và phòng ban/chức vụ cũ → mới (không chép giá trị cá nhân vào nhật ký); gửi lại dữ liệu không đổi thì không ghi audit.

## Hợp đồng và điều chỉnh lương

Lương lấy từ hợp đồng. Điều chỉnh lương = tạo hợp đồng mới (`POST /contracts`): hợp đồng `ACTIVE` đang mở của nhân viên được đặt `endDate` = ngày trước ngày bắt đầu mới, giữ nguyên làm lịch sử. Quy tắc: số hợp đồng duy nhất (`409`); nhân viên đã nghỉ việc (`409`); ngày bắt đầu không trước ngày vào làm và phải sau ngày bắt đầu của hợp đồng đang mở (`409`); `endDate` trước `startDate` hoặc lương/phụ cấp âm (`400 VALIDATION_ERROR`). `PATCH /contracts/{id}/terminate` với `{ "endDate": "YYYY-MM-DD" }` chỉ cho hợp đồng đã bắt đầu và đang `ACTIVE`. Response có `status` (lưu trữ) và `effectiveStatus` (`UPCOMING`, `ACTIVE`, `EXPIRED`, `TERMINATED`) tính theo ngày hiện tại. Audit: `CONTRACT_CREATED` (ghi lương/phụ cấp cũ → mới) và `CONTRACT_TERMINATED`.

`DELETE /employees/{id}` (cho nghỉ việc) đặt `endDate` = hôm nay và tự chấm dứt mọi hợp đồng `ACTIVE` còn mở tới ngày đó (`status=TERMINATED`, `endDate` = ngày nghỉ việc; hợp đồng chưa hiệu lực coi như bị hủy), mỗi hợp đồng ghi audit `CONTRACT_TERMINATED`. Gọi lại với nhân viên đã nghỉ việc trả `409`, giữ nguyên ngày nghỉ việc gốc.

Tính lương kỳ dùng hợp đồng mới nhất **đã bắt đầu trước cuối kỳ** và **chưa kết thúc trước đầu kỳ**; hợp đồng ký cho tháng sau không ảnh hưởng kỳ hiện tại.

## Trợ lý AI

Gửi `{ "question": "Lương tháng này của tôi?" }`. Kết quả là `ANSWER` (`answer`, `facts`, `sources`) hoặc `PROPOSAL` (`proposal.action`, `proposal.summary`, `proposal.payload`). Chỉ các action `UPDATE_OWN_PROFILE`, `CREATE_OWN_LEAVE`, `CANCEL_OWN_LEAVE` được hỗ trợ. `POST /assistant/answers` không ghi dữ liệu. Sau khi người dùng kiểm tra/sửa bản nháp và bấm xác nhận, frontend gọi các API nghiệp vụ `PATCH /employees/me`, `POST /leave-requests` hoặc `PATCH /leave-requests/{id}/cancel` bằng token của chính người đó. `PATCH /employees/me` chấp nhận thêm `expectedEmail`/`expectedPhone` tùy chọn để từ chối bản nháp cũ bằng `409`. Thiếu model/Ollama trả `503 AI_UNAVAILABLE`.

### Ngữ cảnh hội thoại trong phiên

`history` là trường tùy chọn, bỏ qua hoặc `null` tương đương `[]`. Mỗi lượt gồm `question` (1–500 ký tự, không chỉ khoảng trắng) và `answer` (1–600 ký tự, không chỉ khoảng trắng). Tối đa 4 lượt, theo thứ tự cũ đến mới; phần tử null hoặc vượt giới hạn trả `400 VALIDATION_ERROR`.

```json
{
  "question": "Còn tháng 8 thì sao?",
  "history": [
    { "question": "Lương tháng 9/2026 của tôi?", "answer": "Bảng lương của bạn tháng 9/2026:" }
  ]
}
```

Lịch sử chỉ giúp phân loại câu hỏi mới nhất; không phải chứng cứ quyền truy cập, danh tính, số liệu hay xác nhận thao tác. Service luôn dùng principal hiện tại và đọc lại dữ liệu nghiệp vụ. Frontend chỉ giữ 4 lượt trong React memory, xóa khi đăng nhập phiên mới, đăng xuất, tải lại trang hoặc bấm **Hội thoại mới**. Không lưu ở server/MySQL/localStorage/sessionStorage, không gửi token vào prompt. Lượt lỗi không được thêm vào lịch sử. Bản nháp được đánh dấu chưa lưu; lịch sử không thể tự xác nhận hoặc khôi phục một bản nháp cũ.

Ollama nhận các message `system → user/assistant các lượt trước → user mới nhất` theo [API Chat chính thức](https://docs.ollama.com/api/chat).
