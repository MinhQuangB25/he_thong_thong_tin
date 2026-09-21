# API quick reference

Base URL: `/api/v1`. Header bảo vệ: `Authorization: Bearer <JWT>`.

| Nhóm | Endpoint chính | Quyền |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` | Public / authenticated |
| Admin | `GET /users`, `PUT /users/{id}/roles`, `PATCH /users/{id}/status`, `GET /audit-logs` | ADMIN |
| Organization | `GET/POST /departments`, `GET/POST /positions`, `POST /contracts` | HR/ADMIN ghi |
| People | `GET /employees`, `GET/PATCH /employees/me`, `POST /employees`, `DELETE /employees/{id}` | Theo vai trò |
| Leave | `GET /leave-types`, `GET/POST /leave-requests`, `PATCH /leave-requests/{id}/review` | Theo vai trò |
| Attendance | `GET /work-schedules`, `POST /work-schedules`, `GET/POST /attendance` | Theo vai trò |
| Payroll | `POST /payroll-periods`, `POST /payroll-periods/{id}/generate`, `PATCH /payroll-periods/{id}/lock`, `GET /payrolls` | Theo vai trò |

Lỗi dùng cấu trúc `status`, `code`, `message`, `details`. Các lỗi nghiệp vụ trùng dữ liệu trả `409`; thiếu xác thực `401`; thiếu quyền `403`; tài nguyên không tồn tại `404`.
