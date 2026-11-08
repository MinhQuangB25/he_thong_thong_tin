# HRM Trung tâm Ngoại ngữ Bình An

Hệ thống quản lý nhân sự mô phỏng gồm tài khoản/RBAC, hồ sơ nhân viên, tổ chức, hợp đồng, đơn từ, ca/lịch, chấm công, tính lương, báo cáo và audit log.

## Chạy nhanh bằng Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/actuator/health
- API base: http://localhost:8080/api/v1

### Trợ lý AI local

Sau khi hệ thống chính đã chạy, bật profile AI và tải model một lần (cần vài GB dung lượng):

```powershell
docker compose --profile ai up -d ollama
docker compose --profile ai exec ollama ollama pull qwen3.5:4b
```

Đăng nhập và chọn **Trợ lý AI** trong menu role. Backend gọi Ollama qua mạng nội bộ Docker; Ollama không mở cổng công khai. Nếu profile/model chưa bật hoặc Ollama chưa sẵn sàng, API trả `503 AI_UNAVAILABLE`. Có thể đổi model qua `OLLAMA_MODEL` trong `.env` nhưng cần tải model tương ứng. Khi chạy backend ngoài Docker, chạy Ollama ở `http://localhost:11434` hoặc đặt `OLLAMA_BASE_URL`.

## Chạy development không dùng Docker

1. Khởi động MySQL 8 và chạy `database/schema.sql`, sau đó `database/seed.sql`.
2. Backend: `cd backend; mvn spring-boot:run`.
3. Frontend: `cd frontend; npm install; npm run dev`.

Tài khoản demo và kịch bản trình diễn nằm trong `readme.txt` và `docs/user-guide.md`.

## Kiểm tra

```powershell
cd backend
mvn verify

cd ..\frontend
npm install
npm run check
npm run test
```

## Đo test coverage

```powershell
cd backend
mvn -Pcoverage clean verify
cd ..\frontend
npm run test:coverage
```

Báo cáo HTML: `backend/target/site/jacoco/index.html`, `backend/target/site/jacoco-business/index.html`, `frontend/coverage/index.html`. Mốc đo 14/10/2026: backend 77,66% dòng, frontend 71,51%, nhóm service/calculator 75,16% (**chưa đạt 80% nghiệp vụ**). Xem [phạm vi đo, kết quả và phần thiếu test](docs/testing/coverage-2026-10-14.md). Các lệnh này xuất báo cáo, chưa là quality gate tự động; không dùng exit code 0 để kết luận đã đạt coverage.

## Backup và restore

Làm theo [quy trình backup/restore an toàn](docs/backup-restore.md): dump trực tiếp ra file trong container, sao chép nguyên byte bằng `docker cp`, rồi phục hồi thử trên MySQL độc lập. Không ghi đè `database/backup-demo.sql` hoặc restore thử vào CSDL đang dùng.

Bản backup local nằm trong `.local-backups/` (được gitignore). Đã nghiệm thu bản sao ngày 14/10/2026; xem [kết quả kiểm tra](docs/testing/backup-restore-2026-10-14.md).

Xem đầy đủ [hướng dẫn sử dụng](docs/user-guide.md), [API](docs/api.md), [outline báo cáo](docs/report-outline.md) và các sơ đồ Mermaid trong `docs/diagrams/`.
