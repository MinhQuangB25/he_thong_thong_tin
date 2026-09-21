# Phương án backup/restore

## Backup

Backup định kỳ hàng tuần, trước khi khóa kỳ lương và trước khi triển khai. File chứa toàn bộ schema, dữ liệu tài khoản, dữ liệu nghiệp vụ và audit log.

```powershell
docker compose exec db mysqldump -u root -p --single-transaction --routines binhan_hrm > database/backup-$(Get-Date -Format yyyyMMdd-HHmm).sql
```

## Restore

1. Dừng backend để tránh ghi mới trong lúc phục hồi.
2. Phục hồi vào đúng database:

```powershell
Get-Content database/backup-YYYYMMDD-HHmm.sql | docker compose exec -T db mysql -u root -p binhan_hrm
```

3. Khởi động backend, gọi `/actuator/health`, đăng nhập và kiểm tra users, nhân viên, kỳ lương.
4. Ghi nhận thời điểm và người thực hiện vào biên bản vận hành.

`database/schema.sql`, `database/seed.sql` và `database/init/` dùng cho cài đặt mới; `database/backup-demo.sql` là ghi chú lệnh backup/restore mẫu.
