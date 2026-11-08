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

Thực hiện theo [hướng dẫn backup/restore](backup-restore.md). Tạo dump bằng `--result-file` bên trong container và sao chép file bằng `docker cp` để tránh chuyển mã qua PowerShell. Backup chứa dữ liệu cá nhân/lương, lưu ở `.local-backups/`, không đẩy GitHub.

Phục hồi thử chỉ trên MySQL tạm độc lập; không xóa volume hoặc ghi đè CSDL chính. Sau phục hồi, so sánh hash, kiểm tra schema/dữ liệu, health và đăng nhập bằng backend tạm. [Đợt nghiệm thu 14/10/2026](testing/backup-restore-2026-10-14.md) đã đạt.

Không commit file `.env`, token hoặc mật khẩu production. JWT của frontend chỉ nằm trong memory; refresh trang sẽ yêu cầu đăng nhập lại.

## 6. Trợ lý AI theo quyền

1. Chạy `docker compose up -d --build`; muốn bật AI thì chạy thêm `docker compose --profile ai up -d ollama` và `docker compose --profile ai exec ollama ollama pull qwen3.5:4b` lần đầu.
2. Đăng nhập, mở mục **Trợ lý AI**, nhập câu hỏi hoặc chọn gợi ý. Chỉ dữ liệu trong phạm vi role hiện tại được trả về.
3. Để đổi email/số điện thoại hoặc tạo/hủy đơn của mình, nhập yêu cầu rõ ràng. Trợ lý chỉ tạo bản nháp; hãy xem và sửa các trường trước khi bấm **Xác nhận thực hiện**.
4. Nếu không muốn thực hiện, bấm **Bỏ bản nháp**. Nếu dữ liệu đổi giữa lúc tạo nháp và xác nhận, API có thể trả `409`; hãy hỏi lại để lấy bản nháp mới.
5. Có thể hỏi nối tiếp: “Lương tháng 9/2026 của tôi?” rồi “Còn tháng 8 thì sao?”. Trợ lý nhớ tối đa 4 lượt gần nhất trong phiên, kể cả khi chuyển sang trang khác rồi quay lại. Phần **Lịch sử trong phiên** hiển thị tóm tắt hội thoại; bấm **Hội thoại mới** để xóa ngữ cảnh và bỏ bản nháp đang mở.
6. Đăng xuất hoặc tải lại trang sẽ xóa hội thoại. Không có bộ nhớ dài hạn giữa các phiên đăng nhập. Chuyển trang chỉ giữ lịch sử tóm tắt, không giữ form bản nháp để xác nhận lại; hãy hỏi lại nếu cần bản nháp mới. Lượt đang xử lý sẽ bị hủy ở frontend khi rời trang.

AI không duyệt đơn, sửa chấm công, cấp role hoặc tính lương. Admin demo không có hồ sơ nhân viên nên không tạo đề xuất cá nhân. Không lưu lịch sử chat/bản nháp vào MySQL. Nếu hiện `AI_UNAVAILABLE`, kiểm tra container Ollama và model đã tải.
