# Báo cáo kiểm thử HRM Bình An — 22/09/2026

## Kết luận

**Chưa đủ điều kiện nghiệm thu.** Các luồng cơ bản chạy được nhưng còn lỗi phân quyền phiên đăng nhập, tính lương, báo cáo lịch sử, chấm công và điều hướng mobile. Đây là báo cáo kiểm thử, không phải xác nhận đã sửa lỗi.

Đã dùng trình duyệt Chrome riêng qua Chrome DevTools MCP, các tài khoản demo `admin`, `hr.manager`, `leader01`, `employee01`, frontend `http://localhost:5173`, API `http://localhost:8080/api/v1`. Backend/MySQL đang chạy là đối tượng của bài test API thực tế. Không sửa mã nguồn nghiệp vụ, không reset database, không đọc token/cookie từ trình duyệt.

| Lớp kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Bộ test backend: `mvn -q verify` (lượt trước, cùng đợt kiểm thử) | 22 test, 9 suite, 0 lỗi | Các integration test có dùng H2; không tương đương toàn bộ kiểm thử MySQL |
| Bộ test frontend: `npm run test` | 7/7 test, 6 file đạt; chạy lại lúc 13:35 | Test hiện có còn ít, không bao phủ mọi luồng |
| TypeScript + production build: `npm run check` | Đạt | Không chứng minh nghiệp vụ đúng |
| API thực tế: `node scripts/audit-hrm.mjs --mutate` | 121 kiểm tra: 114 đạt, 7 không đạt | Đã chạy ở lượt trước; không chạy lại chế độ tạo dữ liệu ở lượt tiếp tục |
| Browser: 4 role và các nhóm chức năng chính | Có cả đạt và không đạt, xem dưới | Không khẳng định mọi tổ hợp dữ liệu đều đã được thử |
| Coverage 80% nghiệp vụ / 60% toàn dự án | Chưa xác minh | Chưa thấy quality gate JaCoCo trong pom; không suy ra coverage từ số test đạt |

## Bằng chứng

- [Kết quả 121 kiểm tra API](api-audit-muc9kg2p.json).
- [Network và kích thước phần tử theo viewport](browser-evidence-2026-09-22.json). Chỉ có danh sách URL/method/status, không lưu Authorization.
- [Nhân viên: Tổng quan báo thiếu quyền](hrm-employee-dashboard.png).
- [Nhân viên: có lương nhưng trạng thái CHƯA TẠO](hrm-employee-payroll.png).
- [HR: các chỉ số dashboard sai phạm vi](hrm-dashboard-wrong-totals.png).
- [Bộ lọc nhân sự bị cắt ở 1024px](hrm-filter-1024.png).

## Các luồng đã chạy được

| Nhóm | Kiểm tra | Kết quả quan sát |
|---|---|---|
| Đăng nhập | 4 tài khoản demo; sai mật khẩu; API không có JWT | Đăng nhập đúng 200; sai mật khẩu 401 và thông báo rõ; API chưa đăng nhập 401 |
| Admin | Khu vực riêng, không dùng menu HR | Có sidebar quản trị riêng |
| Admin | Thêm tài khoản TEST, đổi EMPLOYEE → TEAM_LEADER, khóa/mở, xóa | Thành công qua giao diện; audit log có thay đổi; lưu ý lỗi phiên cũ F01 |
| Admin | Tìm username, lọc vai trò/trạng thái, đổi chiều sắp xếp | Kết quả thay đổi đúng với dữ liệu hiện có; lọc không khớp trả trạng thái rỗng |
| Phân quyền | HR không gọi được API quản lý account; employee/leader không ghi HR | Các tình huống API đã kiểm tra trả 403 |
| HR | Thêm nhân sự TEST qua form | Tạo thành công, tìm lại được theo mã |
| HR | Cho nhân sự TEST nghỉ việc | DELETE trả 200; hồ sơ còn trong báo cáo với trạng thái Đã nghỉ việc |
| HR | Lọc đồng thời trạng thái/phòng ban/chức vụ; đổi chiều theo mã NV; đặt lại | Đúng với tập dữ liệu dưới 20 hồ sơ; chưa có phân trang thật, xem F15 |
| Nhân viên | Hồ sơ cá nhân | Đọc được hồ sơ; form chỉ cho sửa email/số điện thoại; lưu lại giá trị hiện có thành công |
| Nhân viên | Chống sửa lương/role/trạng thái bằng payload bổ sung | Các tình huống API kiểm tra không thay đổi trường bị cấm |
| Nhân viên | Gửi đơn nghỉ ốm và hủy khi chờ duyệt | Đơn TEST chuyển PENDING → CANCELLED qua UI |
| Đơn từ | Bốn loại nghỉ, chống trùng, chống hủy đơn người khác/chuyển trạng thái lại | API kiểm tra đạt; nghỉ ốm/nghỉ phép được thao tác thêm trên UI |
| HR | Duyệt và từ chối đơn TEST | Hai đơn do employee01 gửi chuyển APPROVED/REJECTED; không động vào đơn demo gốc |
| Trưởng nhóm | Xem chấm công nhóm, không có form nhập | 9 bản ghi, chỉ Trần Quốc Bảo và Nguyễn Minh Anh; API truy cập ngoài nhóm trả 403 |
| Nhân viên | Chấm công cá nhân | 6 bản ghi của Nguyễn Minh Anh, không có nút nhập |
| HR | Nhập chấm công hợp lệ | Tạo lịch và bản ghi TEST ngày 22/09/2026 thành công |
| Lương | Lọc tháng, năm, tổng hợp năm; giới hạn dữ liệu cá nhân | Employee tháng 8: 500.000đ; tháng 9: 4.033.653,85đ; năm 2026: 4.533.653,85đ (UI làm tròn đồng); tháng 1 hiển thị rỗng |
| Lương | Tạo kỳ, chống trùng, tính, khóa, chống tính lại kỳ đã khóa | Đạt ở API, ngoài lỗi số tiền F02. UI thử tính lại kỳ TEST 12/2099 đã khóa: báo lỗi và API 409 đúng |
| Báo cáo | HR/Admin truy cập; nhân viên/trưởng nhóm bị chặn | Đúng phạm vi API; màn hình có trạng thái, trình độ, thâm niên, mức lương; lỗi dữ liệu lịch sử F04 |

## Lỗi cần ưu tiên sửa

P1: ảnh hưởng bảo mật, tiền lương hoặc chặn luồng chính. P2: sai nghiệp vụ/khả năng sử dụng. P3: cảnh báo và hoàn thiện giao diện.

### F01 — P1 — Khóa tài khoản không vô hiệu hóa phiên đang đăng nhập

- Tái hiện bằng account TEST: đăng nhập lấy JWT; Admin khóa account; tiếp tục gọi `GET /employees/me` bằng JWT cũ.
- Thực tế: **200**. Đăng nhập mới bị 401, nhưng phiên cũ vẫn truy cập được.
- Mong đợi: tài khoản bị khóa bị từ chối ở mọi request tiếp theo, không chỉ ở form login.
- Vị trí: `backend/src/main/java/vn/binhannhrm/security/JwtAuthenticationFilter.java:43`. Filter tạo authentication mà không kiểm tra cờ account enabled/locked.
- Bằng chứng API: `locked existing JWT blocked`.

### F02 — P1 — Ngày Vắng vẫn có tăng ca và được cộng vào lương

- Tạo attendance `ABSENT`, giờ 08:00–17:00: nhận `workedHours=8`, `overtimeHours=1`.
- Payroll cộng cả giờ tăng ca từ bản ghi ABSENT.
- Fixture lương cơ bản 26.000.000đ, 26 ngày chuẩn, phụ cấp 500.000đ, 1 ngày có mặt và 2 giờ tăng ca hợp lệ: kỳ vọng **1.875.000đ**, thực tế **2.437.500đ** (tổng tăng ca bị tính thành 5 giờ).
- Vị trí: `attendance/AttendanceService.java:73`, `payroll/PayrollService.java` (tổng hợp overtime).
- Cần thống nhất cách xử lý Vắng/Nghỉ phép và giờ nghỉ giữa ca; không cộng tăng ca cho ngày vắng. Fixture được lưu trong kỳ TEST 12/2099.

### F03 — P1 — Nhân viên vào Tổng quan bị báo không có quyền

- Đăng nhập `employee01` thành công 200.
- Dashboard gọi `GET /employees?size=5` và nhận **403**. `Promise.all` thất bại khiến toàn bộ Tổng quan chỉ còn thông báo lỗi.
- Vị trí: `frontend/src/pages/DashboardPage.tsx:9`.
- Cần dashboard theo role hoặc endpoint thống kê trong phạm vi cá nhân; không nới quyền đọc toàn bộ nhân sự cho EMPLOYEE để che lỗi UI.

### F04 — P1 — Báo cáo quá khứ tính cả nhân viên chưa vào làm

- Admin → Báo cáo hệ thống → tháng 1, năm 2020.
- Tại thời điểm có 7 hồ sơ: báo cáo trả **7 người đang làm**, gồm Nguyễn Minh Anh có ngày vào làm 22/03/2026.
- Sau khi tạo thêm TEST UI, tổng hồ sơ là 8; không dùng tổng này để thay thế bằng chứng 7 hồ sơ lúc tái hiện ban đầu.
- Vị trí: `backend/src/main/java/vn/binhannhrm/report/ReportService.java:43` và `:52`: lấy tất cả nhân viên, không loại `joinDate > asOf`.
- Cần lọc nhân viên tồn tại tại cuối tháng trước khi tính mọi thống kê.

### F05 — P1 — Khoảng tháng của chấm công bị lệch một ngày

- Ở múi giờ Asia/Saigon, mở Chấm công trong tháng 9/2026.
- Network: `GET /attendance?from=2026-08-31&to=2026-09-29`.
- Mong đợi: `2026-09-01` đến `2026-09-30`; hiện có nguy cơ lẫn ngày cuối tháng trước và bỏ sót ngày cuối tháng đang xem.
- Vị trí: `frontend/src/pages/AttendancePage.tsx:23`, chuyển ngày local sang UTC bằng `toISOString()`.

### F06 — P1 — Nhập sai giờ chấm công rồi sửa lại bị kẹt vì lịch trùng

- HR chọn nhân sự TEST UI, ngày 23/09/2026, giờ vào 18:00, giờ ra 17:00; bấm Lưu.
- Network: tạo lịch **200**, tạo attendance **409**, UI báo “Giờ ra phải sau giờ vào”.
- Sửa giờ vào thành 08:00 và bấm Lưu lại: tạo lịch **409**, UI báo “Nhân viên đã có lịch làm trong ngày này”. Không có cách hoàn tất bản ghi từ form hiện tại.
- Vị trí: `frontend/src/pages/AttendancePage.tsx:52`: luôn POST lịch mới trước POST attendance, không tái sử dụng lịch vừa tạo.
- Cần xử lý giao dịch chung hoặc tái sử dụng lịch hiện có và kiểm tra giờ trước khi tạo lịch.

### F07 — P1 — Menu mobile không hoạt động

- Đã tái hiện tại **320px và 768px**: sidebar bị ẩn, nhấn “Mở menu” không có gì xuất hiện.
- `display` của sidebar trước và sau thao tác đều là `none`; không có drawer thay thế, nút Đăng xuất cũng nằm trong sidebar bị ẩn.
- Vị trí: `frontend/src/components/AppShell.tsx:29`: nút `.mobile-menu` không có handler.
- Không thể coi giao diện mobile đạt chỉ vì trang không tràn ngang.

### F08 — P2 — Admin mặc định không duyệt đơn được

- Admin có role ADMIN nhưng không liên kết employee. PATCH review đơn TEST trả **404**, “Tài khoản chưa liên kết hồ sơ nhân viên”. HR duyệt cùng đơn thành công.
- Vị trí: `backend/src/main/java/vn/binhannhrm/leave/LeaveController.java:33`.
- Mong đợi theo yêu cầu đã chốt: ADMIN có quyền can thiệp nghiệp vụ HR. Cần chọn cơ chế lưu người duyệt phù hợp, không bắt admin kỹ thuật phải có hồ sơ nhân sự.

### F09 — P2 — Số liệu Tổng quan không đúng phạm vi

- HR: “Nhân sự đang làm” hiển thị **5**, thực chất là số dòng từ `/employees?size=5`, bao gồm người đã nghỉ việc. Trước khi thêm TEST UI, số ACTIVE thực tế chỉ 3.
- “Đơn chờ duyệt” chỉ đếm trong 5 dòng đầu; lúc có 3 đơn PENDING sau test UI vẫn hiện 1.
- “Quỹ lương kỳ này” cộng tất cả các kỳ: hiển thị 21.307.451,93đ gồm cả kỳ TEST 12/2099, thay vì tháng 9/2026 là 13.269.951,93đ.
- “Người nhận” là số bản ghi payroll (12), không phải số người trong kỳ; ngày cố định 21/09/2026 dù chạy ngày 22/09; trạng thái kỳ hard-code DRAFT.
- Trưởng nhóm còn thấy nút “Thêm nhân sự”; nhấn chỉ vào danh sách không có form thêm. Không phát hiện vượt quyền ghi từ nút này.
- Vị trí: `frontend/src/pages/DashboardPage.tsx:9` và `:12`.

### F10 — P2 — Bộ lọc bị cắt ở 1024px

- HR → Nhân sự → Lọc & sắp xếp, viewport 1024px.
- Mép phải panel khoảng x=993; select sắp xếp kéo đến x=1018; nút đổi chiều bắt đầu x=1030, nút Đặt lại x=1085. Hai nút nằm ngoài khung nhìn và bị cắt.
- 320/768px: bộ lọc xếp dọc, không bị cắt; 1440px: đủ chỗ.
- Vị trí: `frontend/src/styles.css:9`, `.advanced-filter-grid` flex không wrap, mỗi select tối thiểu 180px; panel overflow hidden.
- Đây là lỗi hiển thị có thể khiến người dùng tưởng lọc/sắp xếp không hoạt động.

### F11 — P2 — Tham số sắp xếp không hợp lệ trả 500

- `GET /employees?sort=notAField,asc` → 500 INTERNAL_ERROR.
- Nên trả 400 và thông báo trường sort không hợp lệ, không coi là lỗi server.
- Bằng chứng: `invalid sort rejected with 400` trong file API audit.

### F12 — P2 — Thiếu khoảng ngày chấm công trả 500

- `GET /attendance` không có from/to → 500 INTERNAL_ERROR.
- Mong đợi 400 với chi tiết tham số bắt buộc hoặc default có đặc tả rõ ràng.
- Cần bổ sung mapping exception tham số request trong `common/GlobalExceptionHandler.java`.

### F13 — P2 — Ngày chấm công không cần khớp lịch làm

- Schedule TEST ngày 01/12/2099 được dùng để tạo attendance ngày 03/12/2099; API chấp nhận 200.
- Vị trí: `attendance/AttendanceService.java:54` chỉ đối chiếu employeeId, chưa đối chiếu ngày.
- Cần từ chối schedule sai ngày để bảo đảm liên kết dữ liệu.

### F14 — P2 — Nhân viên có bảng lương nhưng trạng thái kỳ là CHƯA TẠO

- Employee01: tháng 9/2026 có lương 4.033.654đ trên UI nhưng trạng thái “CHƯA TẠO”; tháng 8 cũng tương tự.
- `PayrollPage.tsx:31` chỉ tải periods cho HR/Admin; `:55` dùng period null để hiển thị CHƯA TẠO cho các role còn lại.
- Nút Tạo/tính vẫn bật khi kỳ LOCKED; backend chặn 409 đúng, nhưng UI nên thể hiện rõ trạng thái chỉ đọc.

### F15 — P2 — Chưa có phân trang nhân sự thật (đối chiếu DOM + mã nguồn)

- Dưới bảng là StaticText `‹ 1 ›`, không phải nút điều khiển.
- `EmployeesPage.tsx:30` cố định page=0,size=20; `:44` lọc/sắp xếp chỉ trên content đã tải; `:83` phân trang là chuỗi chữ.
- Chưa tạo thêm hơn 20 nhân viên để tránh làm bẩn database. Tác động vượt 20 hồ sơ là kết luận từ code, không phải ca runtime với 21 hồ sơ.
- Đơn từ cũng tải cố định size=30, chưa có điều khiển phân trang/tìm kiếm/lọc trên giao diện đã kiểm tra.

### F16 — P2 — Admin chưa có đường vào nghiệp vụ HR

- Giao diện Admin tách biệt là đúng, nhưng chỉ có quản lý account và báo cáo. Không có đường thao tác nhân sự, đơn từ, chấm công, lương.
- `frontend/src/App.tsx:14` ép mọi ADMIN vào màn hình admin; `components/AppShell.tsx:16` chỉ có một nav item.
- Theo yêu cầu đã chốt, cần giữ layout Admin riêng nhưng vẫn cho Admin truy cập chức năng can thiệp HR. Không nên quay về dùng chung toàn bộ menu như phiên bản cũ.

### F17 — P3 — Form vẫn thiếu id/name

- Chrome còn báo `A form field element should have an id or name attribute` ở các form ngoài phần tìm kiếm/lọc đã sửa.
- Trên báo cáo, select Tháng và input Năm đều có label bọc nhưng cả id/name đều rỗng; hồ sơ cá nhân và form tạo/chấm công cũng có trường tương tự.
- Không phải nguyên nhân chính làm API thất bại, nhưng yêu cầu về form chưa hoàn thiện. Cần thêm id/name ổn định mà không bỏ label.

## Phần in và giới hạn chưa nghiệm thu

- Đã nhấn nút in tháng/năm; hộp thoại in khiến Chrome DevTools chờ/timeout. Đã mở lại **riêng Chrome thử nghiệm**, không đóng Chrome cá nhân của người dùng. Không quy lỗi timeout của công cụ thành lỗi nghiệp vụ ứng dụng.
- Chưa xác minh được bản in cuối cùng hoặc in ra máy in; phần này **chưa đạt nghiệm thu**.
- Đối chiếu `PayrollPage.tsx:51` và `:58`: hai nút cùng gọi `window.print()`, chưa có print mode tháng/năm. CSS print không tách `.annual-payroll` khỏi bảng tháng; có nguy cơ hai nút in cùng toàn bộ nội dung. Cần sửa/kiểm thử preview riêng sau đó.
- Chưa thử backup/restore vì việc phục hồi database đang chạy có thể ảnh hưởng dữ liệu hiện có; chưa chạy kiểm thử tải, concurrency, audit dependency hay accessibility toàn diện.
- API quản lý phòng ban/chức vụ/hợp đồng đã được thử ở đợt API; không thấy màn hình quản lý tương ứng trong menu hiện tại. Không ghi “UI đạt” cho chức năng chưa có.
- Bốn kích thước đã kiểm tra trên trang nhân sự; menu mobile thử 320/768. Chưa chụp và nghiệm thu mọi màn hình ở cả bốn kích thước.
- Phiên đăng nhập mất khi reload do token chỉ giữ trong memory là thiết kế đã chốt, không tính là lỗi trong báo cáo này.

## Dữ liệu TEST và dọn dẹp

Chỉ xóa account TEST do đợt kiểm thử tạo; nhân sự có lịch sử được xóa mềm đúng quy tắc hệ thống.

| Dữ liệu | Tình trạng cuối |
|---|---|
| Account `test.ui.0922` (id 6), `test.muc9kg2p` (id 7) | Đã xóa bằng API/UI; không thể phục hồi trực tiếp bằng chức năng undo hiện có |
| Employee id 6, 7: prefix `TEST-muc9kg2p` | TERMINATED, giữ lịch sử |
| Employee id 8: `TEST-UI-0922` / TEST UI Nhân sự 0922 | TERMINATED ngày 22/09/2026, giữ lịch sử |
| Department/position `TEST-muc9kg2p`, hợp đồng TEST | Còn để giữ FK và bằng chứng; không xóa cứng |
| Leave id 3–6, reason `TEST-muc9kg2p` | APPROVED / REJECTED / CANCELLED / CANCELLED |
| Leave id 7, reason `TEST-UI-0922 Hủy đơn`, 01/02/2098 | CANCELLED |
| Leave id 8, reason `TEST-UI-0922 Duyệt đơn`, 02/02/2098 | APPROVED |
| Leave id 9, reason `TEST-UI-0922 Từ chối đơn`, 03/02/2098 | REJECTED |
| Chấm công TEST UI 22/09/2026 | Có mặt, 08:00–17:00, 8 giờ công, 1 giờ OT theo công thức hiện tại |
| Lịch TEST UI 23/09/2026 | Còn lịch, chưa có attendance vì F06 |
| Kỳ TEST id 3, 12/2099 | LOCKED; có 4 payroll, gồm các employee đang hoạt động lúc chạy test và employee TEST id 6 |
| Audit logs | Giữ toàn bộ dấu vết thử nghiệm |

Không tính lại/khóa các kỳ lương thật năm 2026. Không sửa/xóa các đơn demo gốc. Việc giữ hồ sơ TEST làm tăng tổng số nhân sự lịch sử và tổng lương không lọc kỳ; đã ghi rõ khi phân tích dashboard. Nếu cần database demo sạch, nên dọn đúng các fixture kể trên sau khi sao lưu, không reset toàn bộ DB.

## Thứ tự xử lý đề xuất

1. F01: chặn phiên của account bị khóa; thêm test hồi quy JWT đang dùng.
2. F02, F05, F06, F13: tính công/lương và tính nhất quán lịch–chấm công.
3. F03, F04, F09, F14: dashboard theo role, thống kê đúng kỳ và trạng thái lương.
4. F07, F10, F15: menu mobile, bộ lọc responsive, phân trang server-side.
5. F08, F16: quyền can thiệp HR của Admin với giao diện riêng.
6. F11, F12, F17 và in tháng/năm riêng; chạy lại test API/UI và đo coverage.

Kết quả này không thay thế regression test sau khi sửa. Script API có chế độ `--mutate` tạo thêm fixture; không chạy lặp trên database demo nếu chưa xem phần dữ liệu còn lại.
