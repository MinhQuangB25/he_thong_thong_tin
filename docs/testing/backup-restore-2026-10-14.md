# Nghiệm thu backup/restore HRM — 14/10/2026

Kết quả: **ĐẠT trên bản sao độc lập**, không phục hồi đè CSDL chính.

## Môi trường và ranh giới

- Workspace: `D:\he_thong_thong_tin`.
- Nguồn đọc: `binhan-hrm-db`, MySQL **8.4.11**, database `binhan_hrm`.
- MySQL tạm: `binhan-hrm-restore-check-20261014-2143`, ID `6609dae7c3a5171300501eda8fefb11b199e67fc13183dc704fb36140020721f`, `--network none`, không có cổng publish, dữ liệu `/var/lib/mysql` trên tmpfs 768 MiB, không gắn volume/bind mount nguồn.
- Backend tạm: `binhan-hrm-restore-api-20261014-2143`, ID `53565c4b8087ee867ea8d33ac07fe67823224705f3593b707a493ede5705bfb6`, dùng runtime image local và `--network container:<MySQL tạm>`. JDBC `127.0.0.1:3306/binhan_hrm`, `ddl-auto=validate`; không mở cổng host, không tái sử dụng JWT secret thật.
- Label cả hai container: `vn.binhan.hrm.task=restore-check-20261014-2143`.

Backend/frontend/Ollama/CSDL chính vẫn chạy trong toàn bộ đợt kiểm tra. Không có lệnh DROP/DELETE/ALTER hay restore vào database nguồn; không xóa volume, không đổi cấu hình datasource chính.

## Backup và đối chiếu byte

Tạo dump native file trong container với các tùy chọn:

```text
--default-character-set=utf8mb4 --single-transaction
--routines --events --triggers --set-gtid-purged=OFF --no-tablespaces
--skip-comments --skip-add-locks --skip-disable-keys --skip-extended-insert
--order-by-primary --hex-blob --databases binhan_hrm --result-file=<file>
```

Mật khẩu của nguồn được lấy bên trong container, không in ra và không đưa vào command line. Chép file bằng `docker cp`, phục hồi bằng `mysql < /tmp/source.sql` **trong MySQL tạm**. Dump lại bản phục hồi với cùng bộ tùy chọn, trước smoke test API. Cuối đợt dump lại nguồn để xác nhận dữ liệu gốc không đổi.

| File local (gitignored) | Kích thước | SHA-256 |
|---|---:|---|
| `.local-backups/restore-check-20261014-2143/source.sql` | 34,424 byte | `13C3CB2586CC8AF3860CD765D82F8B5B81C6CB6218F0D505173A468F80B08F0A` |
| `.local-backups/restore-check-20261014-2143/restored.sql` | 34,424 byte | Cùng hash nguồn |
| `.local-backups/restore-check-20261014-2143/source-after.sql` | 34,424 byte | Cùng hash nguồn |

**Cả ba hash giống nhau**: full dump schema, khóa/ràng buộc, giá trị từng dòng và snapshot lương của bản phục hồi khớp với bản backup; nguồn trước/sau không thay đổi trong đợt kiểm tra. Không đưa nội dung dump hoặc token vào biên bản.

## Dữ liệu trên bản phục hồi trước smoke test

| Bảng | Số dòng COUNT(*) |
|---|---:|
| attendance_records | 32 |
| audit_logs | 32 |
| departments | 3 |
| employees | 8 |
| employment_contracts | 6 |
| leave_requests | 9 |
| leave_types | 4 |
| payroll_items | 0 |
| payroll_periods | 4 |
| payrolls | 15 |
| permissions | 4 |
| positions | 5 |
| role_permissions | 10 |
| roles | 4 |
| salary_settings | 1 |
| team_members | 2 |
| teams | 1 |
| user_roles | 4 |
| users | 4 |
| work_schedules | 31 |
| work_shifts | 1 |
| **Tổng** | **180** |

- 21/21 bảng InnoDB; 20 foreign key được phục hồi.
- 8 tên nhân viên có ký tự nhiều byte, bảo toàn qua dump/restore và hash toàn bộ dữ liệu.
- Views/routines/events: 0 tại thời điểm backup; bật các tùy chọn để không bỏ sót nếu sau này có thêm.
- `payroll_items` trống đã có sẵn ở nguồn, không phải dữ liệu bị mất khi phục hồi.

## Smoke test ứng dụng trên bản sao

Backend tạm khởi động thành công với `ddl-auto=validate`; `/actuator/health` trả `UP`.

| Tài khoản | Luồng kiểm tra | Kết quả |
|---|---|---|
| admin | Login, auth/me, users, báo cáo tháng 9/2026, kỳ lương | 200; 4 account, role ADMIN |
| hr.manager | Login, auth/me, nhân viên, báo cáo, đơn, chấm công, bảng lương tháng 9 | 200; 8 nhân viên, 9 đơn, 17 bản công tháng 9, 4 bảng lương tháng 9 |
| leader01 | Login, auth/me, nhân viên nhóm, chấm công, lương cá nhân | 200; 2 nhân viên nhóm, 9 bản công nhóm tháng 9, 1 bảng lương cá nhân |
| employee01 | Login, auth/me, hồ sơ, đơn cá nhân, công cá nhân, lương tháng/tổng hợp năm | 200; 5 đơn, 6 bản công tháng 9, 1 bảng lương tháng 9 |
| employee01 | GET /users | 403 |
| employee01 | GET attendance của employeeId=1 | 403 |
| leader01 | GET attendance của employeeId=8 (ngoài nhóm) | 403 |
| Không có token | GET /users | 401 |

Không thực hiện thay đổi nhân sự, phê duyệt đơn, ghi chấm công hoặc tính/khóa lương trong đợt này. Login có thể ghi audit **trên bản sao**; đối chiếu dump đã thực hiện trước smoke test.

Một request thử chấm công ban đầu dùng month/year thay vì from/to đã nhận 400; sửa tham số script kiểm tra thành `from=2026-09-01&to=2026-09-30` theo API hiện có và chạy lại thành công. Không sửa backend vì đây là lỗi tham số kiểm thử.

Binary `mysqlcheck` không có trong image hiện tại, nên không thực hiện thêm kiểm tra bằng công cụ đó. Bằng chứng nghiệm thu chính là full dump hash, đếm dữ liệu/metadata, schema validation và smoke test backend; không tuyên bố đã kiểm tra physical backup hay toàn bộ corruption scenario.

## Cleanup và trạng thái cuối

Đã đối chiếu ID, label và không có bind mount/volume nguồn trước cleanup. Dừng/xóa **chỉ hai container tạm** theo tên chính xác. Dữ liệu tmpfs của bản sao đã được dọn; các file SQL trên host vẫn giữ để phục hồi lại.

Cuối đợt: backend chính health `UP`; MySQL chính healthy; frontend/backend/Ollama vẫn chạy. Hash nguồn sau kiểm tra giống trước kiểm tra. `.local-backups/` được gitignore và đã xác nhận bằng `git check-ignore`.

## Tài liệu và giới hạn

Đã sửa các hướng dẫn cũ trong README, user-guide, backup-restore và ghi chú backup-demo: không ghi đè file mẫu hoặc pipe SQL qua PowerShell; quy trình dùng file native và bản sao độc lập. Không thay đổi code nghiệp vụ, schema, seed hoặc dependency, nên không chạy lại Maven/Vitest chỉ cho mốc tài liệu này; kết quả 47 test backend/46 frontend thuộc mốc trước.

Chưa thực hiện lịch backup tự động, encrypted/off-site backup, PITR/replication hoặc khôi phục ghi đè CSDL chính. Đây là nghiệm thu logical backup trong demo. Bản backup không bao gồm MySQL users/grants, `.env`, JWT secret hoặc model Ollama.

Tài liệu tham chiếu: [MySQL mysqldump](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html), [SQL-format restore](https://dev.mysql.com/doc/refman/8.4/en/reloading-sql-format-dumps.html). Hướng dẫn thao tác: [backup-restore](../backup-restore.md).
