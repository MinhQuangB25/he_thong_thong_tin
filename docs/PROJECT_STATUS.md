# PROJECT STATUS — HRM Bình An

**Cập nhật lần cuối:** 05/11/2026
**Thư mục chính:** `D:\he_thong_thong_tin`  
**Worktree phụ:** `D:\he_thong_thong_tin-regression-tests` — chỉ dùng cho regression test, không phải bản chính.

## 1. Trạng thái tổng quan

Hệ thống HRM đã có các module chính: đăng nhập JWT/RBAC, Admin, nhân sự, đơn từ, chấm công, bảng lương, báo cáo và giao diện theo role. Các lỗi chính phát hiện trong đợt kiểm thử 22/09 đã được sửa và kiểm tra lại trong đợt 23/09.

## 2. Baseline đã kiểm tra

- Backend `mvn verify`: **72 test, 0 lỗi, 0 thất bại**, 16 lớp test, trên H2 (05/11/2026; thêm sửa hồ sơ nhân viên và màn hình hợp đồng).
- Backend MySQL 8.4 tạm: **32/32 test đạt** trước khi bổ sung test phân trang.
- Frontend `npm run test`: **66/66 test, 21 file đạt** (05/11/2026).
- Frontend `npm run check`: typecheck và production build đạt.
- Docker frontend/backend/database đã build và khởi động thành công.
- API audit live: **58/58 kiểm tra đạt**, xem `docs/testing/api-audit-mue4w1zp.json`.
- Chrome đã kiểm tra các luồng Admin, HR, Employee; viewport 320px, 768px, 1024px và 1440px ở các màn hình trọng tâm.
- Chrome 153 đã xác nhận bản in lương tháng/năm A4 có lề 10 mm: bảng tháng đủ 7 cột và bản năm ghi tên/mã nhân viên; xem `docs/testing/ket-qua-in-bang-luong-2026-09-24.md`.
- Trợ lý AI theo role đã có API, bản nháp xác nhận và test; Docker chạy Ollama bằng profile `ai`. Model `qwen3.5:4b` đã tải xong và API thật đã trả `200 ANSWER`; xem `docs/testing/assistant-ai-2026-09-24.md`.
- AI đã nhớ tối đa 4 lượt trong phiên: hỏi lương tháng 9/2026 rồi “Còn tháng 8 thì sao?” trả đúng dữ liệu tháng 8. Chrome/API thật xác nhận giữ ngữ cảnh khi chuyển trang, xóa khi đăng xuất/đổi tài khoản, bản nháp email không tự lưu và lịch sử giả quyền Admin bị từ chối `403`. Chi tiết: `docs/testing/assistant-memory-2026-10-14.md`.
- Backup/restore đã nghiệm thu trên bản sao MySQL 8.4.11 độc lập: 21 bảng, 180 dòng, 20 FK; toàn bộ dump schema/data có SHA-256 giống nhau sau phục hồi. Backend tạm validate schema, health UP, bốn role đăng nhập/đọc dữ liệu thành công, sai quyền trả 401/403. Dump CSDL gốc trước/sau giống nhau; không dừng/ghi đè hệ thống chính. Xem `docs/testing/backup-restore-2026-10-14.md`.
- Coverage thực tế: backend 855/1101 dòng (77,66%), frontend 344/481 dòng (71,51%), service/calculator nghiệp vụ 363/483 dòng (75,16%, **chưa đạt 80%**). Nhánh backend 44,33%, frontend 55,05%. Maven profile `coverage` và npm `test:coverage` xuất báo cáo; chưa áp dụng gate tự động. Xem `docs/testing/coverage-2026-10-14.md`.

Bằng chứng chi tiết: `docs/testing/ket-qua-sua-loi-2026-09-23.md`.

## 3. Chức năng hiện có

- Admin có layout/menu riêng và quản lý account, role, trạng thái tài khoản, audit log.
- HR quản lý nhân sự (thêm, sửa hồ sơ có audit, nghỉ việc mềm), hợp đồng và điều chỉnh lương có audit, đơn từ, chấm công, bảng lương và báo cáo.
- Trưởng nhóm chỉ xem dữ liệu nhóm theo phạm vi được cấp.
- Nhân viên chỉ xem/sửa hồ sơ cho phép, gửi/hủy đơn chờ duyệt, xem chấm công và bảng lương cá nhân.
- Bảng lương hỗ trợ lọc tháng/năm, tổng hợp năm và khóa kỳ lương.
- Danh sách nhân sự có lọc, sắp xếp, phân trang backend và kiểm tra tham số lỗi.
- Giao diện đã thiết kế lại bằng Figma: sidebar/icon mới, Admin có màu riêng, chữ/bảng/form dễ đọc hơn, đăng nhập tiếng Việt. Frontend 40/40 test và typecheck/build đạt; đã kiểm tra Chrome ở 320/768/1024/1440px. Chi tiết tại `docs/design/figma-redesign-2026-10-13.md`.
- Trợ lý AI giữ lịch sử tóm tắt trong React memory theo phiên đăng nhập; có “Hội thoại mới”. Không lưu MySQL/localStorage/sessionStorage. Giới hạn đầu vào và RBAC vẫn được kiểm tra tại backend; không khôi phục quyền xác nhận từ bản nháp trong lịch sử.

## 4. Giới hạn còn lại trước nghiệm thu cuối

1. Đã đo coverage; nhóm service/calculator nghiệp vụ mới đạt 75,16% dòng, chưa đạt 80%. Cần bổ sung test nhân sự, tổ chức, chấm công, lương, dữ liệu AI và UI đơn từ; không hạ ngưỡng. Chưa cấu hình quality gate tự động; 60% dòng đã đạt ở hai tầng, nhưng không có nghĩa test đủ mọi nhánh.
2. Backup/restore đã kiểm tra trên bản sao; chưa thiết lập lịch backup tự động hoặc thử ghi đè CSDL chính. Các bước này không nằm trong đợt nghiệm thu an toàn vừa thực hiện.
3. Các kỳ lương đã khóa và fixture kiểm thử cũ không được tự ý tính lại hoặc xóa nếu chưa sao lưu.
4. Cần hoàn thiện báo cáo cuối, bảng đóng góp nhóm và luyện kịch bản thuyết trình.
5. Cần chạy lại đầy đủ ba thao tác bản nháp trên Chrome sau khi model đã sẵn sàng.
6. `npm audit --audit-level=high` chưa đạt: `source-map-js@1.2.1` có advisory high GHSA-68fv-2mgg-jv7q, bản vá 1.2.2. Cần cập nhật dependency và chạy lại test/build trước phát hành; chưa tự nâng package trong đợt đo coverage. Node local 24.13.0 thấp hơn engine yêu cầu của jsdom 30.1.0 đã có sẵn (24.15.0 hoặc nhánh tương thích).

## 5. Quy tắc tiếp tục công việc

- Đọc `AGENTS.md`, file này, `docs/PLAN.md`, `docs/DECISIONS.md` và `tasks/todo.md` trước khi bắt đầu task mới.
- Chạy `git status --short --untracked-files=all`; không reset hoặc xóa các thay đổi chưa commit.
- Khi sửa nghiệp vụ, cập nhật test liên quan rồi chạy test tập trung và toàn bộ test.
- Khi sửa UI, kiểm tra cả role, network/console và kích thước màn hình liên quan.
