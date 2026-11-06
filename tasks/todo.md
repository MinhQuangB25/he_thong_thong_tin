# Việc đã hoàn thành

- [x] Dựng backend, frontend, Docker và script database.
- [x] Đăng nhập JWT và RBAC.
- [x] Quản lý tổ chức, nhân sự, đội nhóm và hợp đồng.
- [x] Đơn nghỉ, phê duyệt và chấm công.
- [x] Tính lương, bảng lương, báo cáo và giao diện in.
- [x] Giao diện theo role và Admin tách riêng.
- [x] Seed data, test, audit API và tài liệu cài đặt cơ bản.
- [x] Sửa các lỗi chính được ghi trong `docs/testing/ket-qua-sua-loi-2026-09-23.md`.

# Việc còn lại trước nghiệm thu cuối

- [x] Kiểm tra trực quan bản in Chrome của bảng lương tháng và năm; kết quả ghi trong `docs/testing/ket-qua-in-bang-luong-2026-09-24.md`.
- [x] Sửa CSS in bảng lương tháng để cột Thực lĩnh không bị cắt trên A4 có lề 10 mm; đã kiểm tra lại cả bản in tháng và năm bằng Chrome.
- [x] Thêm tên và mã nhân viên vào bản in lương năm, kể cả khi tháng đang chọn không có bảng lương.
- [x] Chạy backup/restore trên bản sao an toàn và ghi bằng chứng trong `docs/testing/backup-restore-2026-10-14.md`: full dump hash giống nhau, backend tạm và bốn role đạt; không thay đổi CSDL gốc.
- [x] Đo coverage thực tế bằng JaCoCo/Vitest V8, xem `docs/testing/coverage-2026-10-14.md`; giữ nguyên ngưỡng trong `CONSTRAINTS.md`.
- [x] Nhóm service/calculator đạt 89,90% dòng, 73,15% nhánh (06/11/2026; baseline 75,16% / 43,73%) bằng test quy tắc nghiệp vụ chấm công, phân quyền nhóm, duyệt/hủy đơn, kỳ lương, an toàn tài khoản Admin; xem `docs/testing/coverage-2026-11-06.md`.
- [x] `npm audit` 0 lỗi (06/11/2026): vá `source-map-js` 1.2.2 và các cảnh báo mới của `vite` (8.3.6), `undici`, `vitest`/`@vitest/coverage-v8` (5.1.0) bằng `npm audit fix --ignore-scripts` + nâng provider; test/build/coverage và Docker frontend đạt. Còn khuyến nghị nâng Node local 24.13 → ≥24.15 (engine jsdom).
- [ ] Rà soát dữ liệu demo và các fixture kiểm thử trước khi chốt bản nộp.
- [ ] Hoàn thiện báo cáo, bảng phân công 15 tuần, đóng góp thành viên và luyện demo.

Runtime note: Docker Compose cần Docker Desktop đang chạy trước khi dùng `docker compose up -d --build`.

# Trợ lý AI theo role

- [x] API hỏi đáp/bản nháp theo quyền, không ghi CSDL khi hỏi.
- [x] Trang Trợ lý AI có bản nháp sửa được và xác nhận qua API nghiệp vụ.
- [x] Kiểm tra bản nháp hồ sơ cũ bằng `expectedEmail`/`expectedPhone`.
- [x] Kiểm tra model Ollama thực tế và API hỏi đáp thành công; Ollama nằm trong Compose profile `ai` để image lớn không chặn hệ thống chính. Còn chạy lại đủ ba thao tác bản nháp trên Chrome.

# Cải thiện giao diện — 13/10/2026

- [x] Tạo Figma có token/component và mẫu HR/Admin/mobile chỉnh sửa được.
- [x] Áp dụng thiết kế vào frontend, giữ menu riêng theo role và CSS in A4.
- [x] Kiểm tra 40 test frontend, typecheck/build và Chrome responsive trên các màn hình trọng tâm.
- [x] Đưa bản build mới vào container frontend local; ghi chú lỗi registry và cách đóng gói runtime trong tài liệu thiết kế.

# AI nhớ hội thoại trong phiên — 14/10/2026

- [x] Tái hiện lỗi câu hỏi nối tiếp trên Chrome và xác định thiếu lịch sử trong request/model.
- [x] Giữ 4 lượt trong React memory; xóa khi đăng nhập phiên mới/đăng xuất/reload/hội thoại mới.
- [x] Gửi lịch sử có giới hạn đến Ollama, không lưu MySQL/server/browser storage.
- [x] Test RBAC với lịch sử giả mạo, đọc dữ liệu mới theo principal, validation, chuyển trang và hủy phản hồi đến muộn.
- [x] 47 test backend, 46 test frontend, typecheck/build đạt; đóng gói/chạy bản mới trong Docker local.
- [x] Chrome + model thật: câu hỏi nối tiếp lương, email hai lượt không tự lưu, logout/đổi tài khoản, responsive 320/768/1024/1440px, console/network.

# Sửa nhanh UI/UX — 05/11/2026

- [x] Việt hóa trạng thái (đơn nghỉ, nhân sự, kỳ lương, chấm công) qua `frontend/src/utils/labels.ts`; ngày hiển thị DD/MM/YYYY.
- [x] Đổi nhãn đầu mục tiếng Anh sang tiếng Việt (giữ `ADMIN SERVER` theo AGENTS.md); sửa tiêu đề tab "Bình An HRM".
- [x] Đơn nghỉ: nút "✓ Duyệt"/"× Từ chối" có chữ, hỏi lý do từ chối (gửi `rejectionReason`), xác nhận khi hủy, thông báo thành công, hiện số ngày và lý do từ chối; form chặn "Đến ngày" trước "Từ ngày".
- [x] Nút "Thêm nhân sự" ở Tổng quan mở thẳng form; nút xóa tài khoản Admin có chữ "Xóa".
- [x] Bảng Đơn từ và Nhân sự chuyển dạng thẻ ở ≤900px; kiểm tra Chrome 1440/1024/768/320px, console sạch.
- [x] Frontend 53/53 test (18 file), typecheck/build đạt.
- [ ] Còn lại: URL theo trang (F5 hiện đăng xuất), bảng Chấm công/Bảng lương vẫn cuộn ngang trên mobile, Admin hiện "Nhân sự #id" thay vì tên.

# Sửa hồ sơ nhân viên — 05/11/2026

- [x] Backend `PUT /employees/{id}` (ADMIN/HR): sửa thông tin cá nhân, phòng ban, chức vụ; khóa mã NV, trạng thái, lương; chặn sửa nhân viên đã nghỉ việc; kiểm tra trùng email/CCCD.
- [x] Audit `EMPLOYEE_UPDATED` ghi trường thay đổi và phòng ban/chức vụ cũ → mới; không ghi khi không có thay đổi. Admin hiển thị nhãn tiếng Việt cho các hành động nhân sự.
- [x] Test backend: 4 unit test service + 5 test tích hợp (401, 403 EMPLOYEE/TEAM_LEADER, 400, 409, 404, 200 + audit). `mvn verify`: 56 test đạt.
- [x] Frontend: nút "Sửa" cho nhân sự đang làm, form dùng chung với Thêm, mã NV chỉ đọc, thông báo thành công; 55/55 test, typecheck/build đạt.
- [x] Chrome: sửa thật phòng ban/trình độ bằng `hr.manager`, audit hiện trên trang Admin; 1440/1024/320px không cuộn ngang trang, console sạch.
- [ ] Còn lại: chọn quản lý trực tiếp chưa có trong form (thay đổi lương đã làm qua màn hình Hợp đồng).

# Màn hình hợp đồng — 05/11/2026

- [x] API `GET /contracts`, `POST /contracts` (tự kết thúc hợp đồng đang mở, kiểm tra ngày/nhân viên nghỉ việc, audit lương cũ → mới), `PATCH /contracts/{id}/terminate`; chuyển khỏi `OrganizationController`.
- [x] Sửa lỗi tính lương: chỉ dùng hợp đồng đang hiệu lực trong kỳ (trước đây hợp đồng ký cho tháng sau bị áp dụng ngay, hợp đồng đã hết hạn vẫn được dùng).
- [x] Trang "Hợp đồng" (ADMIN/HR): thống kê, lọc theo nhân sự/trạng thái, ký mới, điều chỉnh lương có so sánh %, chấm dứt có xác nhận; client hiển thị chi tiết lỗi validation.
- [x] Backend `mvn verify` 69 test; frontend 65/65 test, typecheck/build đạt.
- [x] Docker (MySQL 8.4, volume cũ giữ nguyên, schema `validate` đạt): API hợp đồng 401/403/200; sửa nhân viên 200/403/409 + audit; UI ký mới và điều chỉnh lương trên fixture `TEST-UI-1105` (hợp đồng cũ tự kết thúc 30/11/2026, audit lương cũ → mới); 1440/320px không tràn, console sạch.
- [ ] Còn lại: hủy hợp đồng "chờ hiệu lực" nhập nhầm (hiện bị chặn chấm dứt); nhân viên tự xem hợp đồng của mình.
- [x] "Cho nghỉ việc" tự chấm dứt/hủy hợp đồng còn mở (audit `CONTRACT_TERMINATED`), chặn cho nghỉ việc lặp lại (`409`); seed H2/SQL cho nhân viên đã nghỉ có hợp đồng đã đóng. Backend 72 test, frontend 66/66.
- [x] Sửa dữ liệu Docker một lần (người dùng đồng ý 05/11/2026): 3 hợp đồng `ACTIVE` của nhân viên đã nghỉ việc (HD-BA-001, HD-BA-005, TEST-muc9kg2p) chuyển `TERMINATED`, `end_date` = ngày nghỉ việc của nhân viên; trong một transaction, kèm 3 audit `CONTRACT_TERMINATED` với actor `system-data-fix`. Sao lưu trước khi sửa: `.local-backups/contracts-before-fix-20261105.sql` (bảng `employment_contracts`, `audit_logs`; gitignored).
- [x] Khôi phục BA-HR-001 (`hr.manager`) về `ACTIVE`, bỏ ngày nghỉ việc (người dùng đồng ý 05/11/2026), audit `EMPLOYEE_RESTORED` actor `system-data-fix`; ký hợp đồng mới `HD-BA-HR-001-20261101` qua API (admin, 18.000.000 ₫ + 1.000.000 ₫, từ 01/11/2026); HD-BA-001 giữ `TERMINATED` làm lịch sử. Sao lưu trước: `.local-backups/employees-before-restore-20261105.sql`. Trang Admin có nhãn cho `EMPLOYEE_RESTORED`, `CONTRACT_CREATED`, `CONTRACT_TERMINATED`.
- [x] 4 audit chèn bằng SQL ban đầu dùng `NOW()` (UTC) trong khi ứng dụng lưu giờ Việt Nam; đã cộng 7 giờ cho đúng quy ước.
- [x] Docker: thêm `TZ=${TZ:-Asia/Ho_Chi_Minh}` cho backend và MySQL trong `docker-compose.yml` (người dùng đồng ý 05/11/2026), thêm `TZ` vào `.env.example`. Trước đó backend chạy UTC: trang Admin hiện giờ sớm 7 tiếng và `LocalDate.now()` lệch ngày trong 00:00–07:00 giờ Việt Nam.
- [x] Đã áp dụng (`docker compose up -d db backend`, giữ volume): container backend và MySQL đều `+07` (`NOW()` khớp giờ máy), backend health UP, trang Admin hiện giờ audit đúng (bản ghi 13:53 hiện 13:53 thay vì 06:53). Chưa có thao tác ghi mới sau đổi múi giờ để đối chiếu giờ lưu. Fixture mới: nhân viên `TEST-UI-1105` (id 9) và 2 hợp đồng `HD-TEST-UI-1105-*`.

# Trợ lý AI dạng chatbox — 05/11/2026

- [x] Nút chat nổi góc phải dưới trên mọi màn hình (ẩn ở trang Trợ lý AI), khung chat 400px; mobile ≤480px toàn màn hình; Esc/× đóng và trả focus về nút.
- [x] Hội thoại dạng bong bóng, hiệu ứng "đang soạn", Enter gửi / Shift+Enter xuống dòng, chip gợi ý gửi ngay; trang Trợ lý AI dùng chung component `AssistantChat`.
- [x] Bản nháp (đổi email, tạo/hủy đơn nghỉ) là thẻ trong chat, vẫn bắt buộc "Xác nhận thực hiện"; hỏi câu khác thì bản nháp tự bỏ, không ghi dữ liệu, và lịch sử gửi AI ghi đúng "đã bỏ bản nháp".
- [x] Tin nhắn hiển thị giữ khi chuyển trang trong phiên đăng nhập (React memory, tối đa 60 tin); backend vẫn chỉ nhận 4 lượt; xóa khi đăng xuất/đổi tài khoản/tải lại; không lưu browser storage.
- [x] Số liệu trong câu trả lời định dạng kiểu Việt Nam và dịch mã trạng thái (`formatFactValue`).
- [x] nginx: `index.html` gửi `Cache-Control: no-cache`, `/assets/` cache dài hạn `immutable` (trước đây trình duyệt giữ bản cũ sau khi build lại).
- [x] Frontend 72/72 test (23 file), typecheck/build; Docker + Ollama `qwen3.5:4b`: hỏi lương, hỏi nối tiếp "Còn tháng 10?", chuyển trang giữ hội thoại, mở toàn trang, bản nháp đổi email bị bỏ không ghi (email giữ nguyên); 1440/1024/768/320px, console sạch.

