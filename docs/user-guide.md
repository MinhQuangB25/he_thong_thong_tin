# Hướng dẫn cài đặt và sử dụng

## 1. Cách chạy Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Mở `http://localhost:5173`. Kiểm tra backend bằng `http://localhost:8080/actuator/health`.

## 2. Chạy development

```powershell
cd backend
mvn spring-boot:run

cd ..\frontend
npm install
npm run dev
```

Nếu chạy backend với MySQL ngoài Docker, chạy lần lượt `database/schema.sql` và `database/seed.sql`, sau đó cấu hình `SPRING_DATASOURCE_URL`, username, password và `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`.

## 3. Tài khoản demo

| Tài khoản | Mật khẩu | Vai trò |
|---|---|---|
| admin | password | ADMIN |
| hr.manager | password | HR_MANAGER |
| leader01 | password | TEAM_LEADER |
| employee01 | password | EMPLOYEE |

## 4. Kịch bản demo

1. Đăng nhập `admin`, xem danh sách users/audit log và cập nhật vai trò.
2. Đăng nhập `hr.manager`, thêm nhân viên, chọn phòng ban/chức vụ, tạo hợp đồng.
3. Đăng nhập `employee01`, tạo đơn nghỉ; HR duyệt/từ chối.
4. HR tạo lịch, nhập chấm công và tăng ca.
5. HR tạo kỳ lương, generate, kiểm tra công thức và khóa kỳ.
6. Nhân viên xem/in bảng lương của mình; tài khoản khác không xem được dữ liệu riêng.
7. Thử token thiếu hoặc role không đủ để kiểm tra `401/403`.

## 5. Backup và restore

```powershell
docker compose exec db mysqldump -u root -p binhan_hrm > database/backup-$(Get-Date -Format yyyyMMdd).sql
Get-Content database/backup-20260921.sql | docker compose exec -T db mysql -u root -p binhan_hrm
```

Không commit file `.env`, token hoặc mật khẩu production. JWT của frontend chỉ nằm trong memory; refresh trang sẽ yêu cầu đăng nhập lại.
