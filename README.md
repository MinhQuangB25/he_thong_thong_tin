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

## Backup và restore

```powershell
docker compose exec db mysqldump -u root -p binhan_hrm > database/backup-demo.sql
Get-Content database/backup-demo.sql | docker compose exec -T db mysql -u root -p binhan_hrm
```

Xem đầy đủ [hướng dẫn sử dụng](docs/user-guide.md), [API](docs/api.md), [outline báo cáo](docs/report-outline.md) và các sơ đồ Mermaid trong `docs/diagrams/`.
