# Phương án backup/restore

## Phạm vi và an toàn

Backup hàng tuần, trước khi khóa kỳ lương và trước khi triển khai. Bản logical backup gồm schema, dữ liệu tài khoản **ứng dụng**, dữ liệu HRM và audit log; không sao lưu account/grant MySQL, `.env`, JWT secret hay model Ollama.

Đợt nghiệm thu 14/10/2026 đã phục hồi bản sao vào MySQL độc lập, đối chiếu toàn bộ dump bằng SHA-256 và chạy backend tạm đọc dữ liệu theo bốn role. Xem [biên bản](testing/backup-restore-2026-10-14.md).

Các lệnh dưới đây dành cho Docker demo local, chạy từ thư mục gốc dự án. Không phục hồi vào `binhan-hrm-db` để thử nghiệm. Không dùng `docker compose down -v`, không xóa volume đang dùng, không ghi đè `database/backup-demo.sql`.

## 1. Tạo backup không chuyển mã qua PowerShell

```powershell
$backupRun = (Get-Date -Format yyyyMMdd-HHmmss) + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$backupDirectory = Join-Path (Get-Location) ".local-backups/$backupRun"
New-Item -ItemType Directory -Path $backupDirectory -ErrorAction Stop | Out-Null
$backupFile = Join-Path $backupDirectory 'source.sql'
$containerDump = "/tmp/hrm-$backupRun.sql"

docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --events --triggers --set-gtid-purged=OFF --no-tablespaces --skip-comments --skip-add-locks --skip-disable-keys --skip-extended-insert --order-by-primary --hex-blob --databases "$MYSQL_DATABASE" --result-file="$1"' sh $containerDump
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; do not restore' }

docker cp "binhan-hrm-db:${containerDump}" $backupFile
if ($LASTEXITCODE -ne 0) { throw 'Backup copy failed' }
if ((Get-Item -LiteralPath $backupFile).Length -eq 0) { throw 'Empty backup' }
Get-FileHash -LiteralPath $backupFile -Algorithm SHA256
```

`--result-file` tạo file trực tiếp trong container; `docker cp` giữ nguyên byte. Không dùng `Get-Content ... | mysql` hoặc redirection SQL bằng PowerShell cũ. MySQL có cảnh báo riêng về redirection PowerShell tạo UTF-16 trong [tài liệu mysqldump](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html).

`--single-transaction` phù hợp với các bảng InnoDB hiện tại; không chạy DDL như ALTER/DROP/RENAME/TRUNCATE trong lúc dump. `--set-gtid-purged=OFF` dùng cho bản sao demo độc lập, không phải thiết lập backup replication/PITR. Bản backup dùng tên CSDL hiện tại từ `MYSQL_DATABASE` và có câu lệnh CREATE DATABASE/USE.

Mật khẩu lấy từ môi trường đã có **bên trong** container, không đưa vào command line hoặc tài liệu. Cách dùng `MYSQL_PWD` chỉ áp dụng demo local; production nên dùng cấu hình client/secret store có quyền truy cập hạn chế và chính sách backup riêng.

## 2. Phục hồi thử trên MySQL tạm

Giữ các biến `$backupRun`, `$backupFile` từ bước trước. Nếu sử dụng bản backup có sẵn, xác định đường dẫn tuyệt đối, kiểm tra SHA-256 và chọn mã chạy mới trước khi tiếp tục.

```powershell
$restoreContainer = "binhan-hrm-restore-demo-$backupRun"
$restoreId = docker run -d --pull=never --name $restoreContainer --label "vn.binhan.hrm.restore=$backupRun" --network none --memory 768m --tmpfs /var/lib/mysql:rw,size=768m -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql:8.4 --innodb-buffer-pool-size=64M --performance-schema=OFF
if ($LASTEXITCODE -ne 0) { throw 'Temporary MySQL creation failed; do not reuse an existing container' }

$restoreReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    docker exec $restoreContainer mysqladmin -u root --silent ping 2>$null
    if ($LASTEXITCODE -eq 0) { $restoreReady = $true; break }
    Start-Sleep -Seconds 1
}
if (-not $restoreReady) { throw 'Temporary MySQL not ready; inspect logs before continuing' }

$restoreTarget = docker inspect $restoreContainer | ConvertFrom-Json
if ($restoreTarget.Id -ne $restoreId.Trim() -or $restoreTarget.HostConfig.NetworkMode -ne 'none' -or $restoreTarget.Config.Labels.'vn.binhan.hrm.restore' -ne $backupRun) { throw 'Wrong restore target' }

docker cp $backupFile "${restoreContainer}:/tmp/restore.sql"
if ($LASTEXITCODE -ne 0) { throw 'Restore copy failed' }
docker exec $restoreContainer sh -c 'mysql -u root --default-character-set=utf8mb4 < /tmp/restore.sql'
if ($LASTEXITCODE -ne 0) { throw 'Restore failed' }
```

Container tạm không có cổng publish, không gắn volume/bind mount dữ liệu gốc và không kết nối mạng ứng dụng. Mật khẩu root trống **chỉ được dùng ở môi trường tạm cách ly này**, không dùng cho CSDL chính. `tmpfs` có thể không đủ cho dữ liệu lớn; đánh giá dung lượng trước khi áp dụng ngoài demo.

## 3. Đối chiếu sau phục hồi

Trong đợt nghiệm thu, CSDL có tên `binhan_hrm`. Nếu cấu hình khác, dùng đúng tên CREATE DATABASE/USE trong bản backup.

```powershell
docker exec $restoreContainer mysqldump -u root --default-character-set=utf8mb4 --single-transaction --routines --events --triggers --set-gtid-purged=OFF --no-tablespaces --skip-comments --skip-add-locks --skip-disable-keys --skip-extended-insert --order-by-primary --hex-blob --databases binhan_hrm --result-file=/tmp/restored.sql
if ($LASTEXITCODE -ne 0) { throw 'Verification dump failed' }
$restoredFile = Join-Path $backupDirectory 'restored.sql'
docker cp "${restoreContainer}:/tmp/restored.sql" $restoredFile
if ($LASTEXITCODE -ne 0) { throw 'Verification copy failed' }
$sourceHash = (Get-FileHash -LiteralPath $backupFile -Algorithm SHA256).Hash
$restoredHash = (Get-FileHash -LiteralPath $restoredFile -Algorithm SHA256).Hash
if ($sourceHash -ne $restoredHash) { throw 'Dump mismatch; investigate before accepting recovery' }
```

Dùng cùng phiên bản mysqldump, bộ tùy chọn và thứ tự khóa chính để đối chiếu dump. Không dùng `information_schema.tables.TABLE_ROWS` làm số dòng chính xác của InnoDB; kiểm tra bằng COUNT(*). Đếm bảng/khóa ngoại, kiểm tra tiếng Việt và snapshot lương. So sánh hash phải làm **trước** các thao tác kiểm thử có thể ghi audit vào bản sao.

Để kiểm tra ứng dụng, chạy backend **tạm** với `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` và JDBC chỉ đến MySQL tạm. Có thể dùng `--network container:<container MySQL tạm>` để truy cập loopback mà vẫn không mở cổng host. Không đổi datasource hay restart backend chính. Kiểm tra health, bốn tài khoản demo, danh sách nhân viên/đơn/công/lương và `401/403`.

## 4. Dọn tài nguyên và giữ bản backup

Chỉ dọn container đã tạo trong đợt kiểm thử: đối chiếu ID, label và không có bind mount/volume của hệ thống chính trước khi stop/rm. Dọn backend tạm trước, rồi MySQL tạm. Dữ liệu tmpfs mất khi dừng; bản SQL trên host vẫn giữ để phục hồi lại.

`.local-backups/` đã được gitignore. Backup có thể chứa thông tin cá nhân, lương và BCrypt hash; không đưa lên GitHub/email công khai. Giữ bản tốt gần nhất trước khi dọn bản cũ, hạn chế quyền truy cập và lưu bản ngoài máy có mã hóa nếu cần vận hành thật. `.gitignore` không phải cơ chế mã hóa hay kiểm soát truy cập.

Khôi phục CSDL chính khi có sự cố là thao tác riêng cần xác nhận rõ: sao lưu trạng thái hiện tại, nghiệm thu bản backup trên bản sao, dừng writer/backend, kiểm tra đúng đích, phục hồi bằng file trực tiếp, khởi động lại và kiểm tra health/đăng nhập/nghiệp vụ. Quy trình nghiệm thu ở trên **không** thực hiện bước ghi đè CSDL chính.

`database/schema.sql`, `database/seed.sql` và `database/init/` dành cho cài đặt mới; `database/backup-demo.sql` là ghi chú mẫu, không phải bản backup dữ liệu hiện tại. Tham khảo [MySQL SQL-format restore](https://dev.mysql.com/doc/refman/8.4/en/reloading-sql-format-dumps.html).
