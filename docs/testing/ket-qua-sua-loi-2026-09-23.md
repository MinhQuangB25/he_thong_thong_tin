# Kết quả sửa lỗi HRM — 23/09/2026

## Phạm vi và kết quả

Tiếp nối báo cáo kiểm thử ngày 22/09. Không reset MySQL demo, không sửa lại bảng lương đã khóa, không xóa hồ sơ/lịch sử kiểm thử cũ. Các tài liệu Word đang soạn được giữ nguyên.

| Nhóm lỗi | Bản sửa và bằng chứng |
|---|---|
| JWT tài khoản bị khóa | Kiểm tra trạng thái tài khoản trên mỗi request; integration test JWT đã cấp bị từ chối sau khi khóa |
| Công/tăng ca khi vắng hoặc nghỉ | Giờ công và tăng ca bằng 0; tính lương loại tăng ca của bản ghi ABSENT/LEAVE kể cả dữ liệu cũ |
| Dashboard nhân viên | Dùng `/employees/me`, không gọi danh sách nhân sự bị cấm; Chrome xác nhận các request trả 200 |
| Báo cáo lịch sử | Loại nhân viên chưa vào làm tại cuối tháng; nghỉ phép dựa trên đơn được duyệt bao phủ ngày báo cáo |
| Lệch ngày chấm công | Dùng ngày lịch địa phương, không đổi qua UTC; Chrome xác nhận tháng 9 từ 2026-09-01 đến 2026-09-30 |
| Nhập lại chấm công | Kiểm tra giờ trước khi tạo lịch, dùng lại lịch cùng nhân viên/ngày/ca; có test giờ đảo và thử lại |
| Menu mobile | Mở/đóng, chuyển trang tự đóng, Escape trả focus; Chrome kiểm tra 320px và 768px |
| Admin duyệt đơn | Cho phép Admin không liên kết employee duyệt; actor vẫn lưu bằng username trong audit |
| Tổng quan sai số liệu | Đếm tổng kết quả được lọc, lương theo tháng/năm hiện tại, người nhận phân biệt theo employeeId |
| Bộ lọc bị cắt | Cho phép xuống dòng; Chrome 1024px xác nhận mọi điều khiển nằm trong viewport |
| Tham số lỗi trả 500 | Sort không hợp lệ và thiếu ngày trả 400 theo cấu trúc lỗi chung |
| Ngày lịch/chấm công khác nhau | Backend từ chối bằng 409; có integration test |
| Trạng thái bảng lương | Nhân viên lấy trạng thái từ bảng lương cá nhân; Chrome thấy DRAFT, không còn CHƯA TẠO sai |
| Kỳ lương khóa | Chrome kiểm tra kỳ demo 12/2099 LOCKED: nút tính và khóa đều disabled, không ghi dữ liệu |
| Lọc/sắp xếp/phân trang | Lọc ở backend trước phân trang; test 25 nhân viên truy cập trang thứ hai; UI có trước/sau thật |
| Admin truy cập nghiệp vụ | Menu quản trị có nhân sự/đơn/công/lương/báo cáo, giữ admin-shell; Chrome xác nhận truy cập công và lương |
| Form thiếu định danh | Bổ sung name/id các form; sửa thêm trang đăng nhập sau khi Chrome phát hiện; test hồi quy thất bại trước sửa, đạt sau sửa |
| In tháng/năm | Đặt print mode trước window.print; CSS chỉ in phần tương ứng; test riêng từng nút và chuyển month → year → month |

## Kiểm tra đã chạy

- Backend `mvn verify`: 33 test, 0 lỗi, 0 thất bại ở lần chạy cuối trên H2.
- Bộ backend trước khi bổ sung test phân trang 25 nhân viên: 32/32 đạt trên MySQL 8.4 tạm riêng tại cổng 3308. Container tạm đã được dừng/xóa; không tác động database demo cổng 3307.
- Frontend `npm run test`: 35/35 test, 15 file test đạt.
- Frontend `npm run check`: TypeScript và production build đạt trên Windows sau sửa cuối.
- Docker frontend rebuild và khởi động lại thành công; backend và database demo vẫn chạy.
- API live: 58/58 đạt. Bằng chứng: [api-audit-mue4w1zp.json](api-audit-mue4w1zp.json). Lần này không tạo fixture nghiệp vụ mới.
- `git diff --check`: không có lỗi whitespace; Git chỉ cảnh báo chuyển LF/CRLF.

## Chrome thực tế

- Employee đăng nhập: dashboard, lương cá nhân đúng phạm vi; không gọi `/employees`.
- 320px: mở menu, chuyển sang lương và tự đóng; document không tràn ngang.
- 768px: menu mở được, sidebar hiển thị; document không tràn ngang.
- HR 1024px: lọc ACTIVE được 3/3; mã giảm dần BA-TL-001, BA-EMP-002, BA-EMP-001. Bộ lọc vừa màn hình; bảng rộng cuộn ngang bên trong.
- Admin 1440px: giữ khu vực ADMIN SERVER, truy cập được chấm công và bảng lương; kỳ LOCKED vô hiệu hóa thao tác ghi.
- Sau tải lại bản Docker mới: console không có error/warn/issue trong luồng đăng nhập Admin → chấm công → bảng lương → chọn kỳ khóa.
- Ảnh: [Bộ lọc 1024px](hrm-fixed-filter-1024.png), [Admin kỳ khóa 1440px](hrm-fixed-admin-1440.png).

## Hợp đồng API bổ sung

- `GET /api/v1/employees`: nhận `status`, `department` (tên), `position` (tên), `search`, `page`, `size`, `sort`. Bộ lọc kết hợp AND và luôn giữ giới hạn dữ liệu theo vai trò/nhóm.
- Sort nhân sự: `id`, `fullName`, `employeeCode`, `status`, `joinDate`, `departmentName`, `positionTitle`; mỗi trường nhận `asc`/`desc`. Trường lạ trả 400. Kích thước trang tối đa 200; thêm id làm khóa sắp xếp ổn định.
- `GET /api/v1/leave-requests`: thêm `status`; hỗ trợ phân trang và sort `id`, `submittedAt`, `fromDate`, `status`. Nhân viên vẫn chỉ thấy đơn của mình.
- Luồng nhập công vẫn dùng hai API lịch/công, không phải transaction chung. Nếu lưu công bị lỗi sau khi lịch đã tạo, lần thử lại dùng lịch có sẵn. Lịch khác ca được báo lỗi rõ ràng, không tự đổi lịch.

## Giới hạn nghiệm thu còn lại

- Chưa xác nhận trực quan hộp thoại print preview/in ra giấy của Chrome. Các test đã kiểm tra mode trước window.print và CSS tách nội dung, nhưng không thay thế việc xem bản in thực tế. Cần chọn tháng/năm có dữ liệu, thử từng nút in, kiểm tra trang tháng không chứa tổng hợp năm và ngược lại.
- Chưa đo coverage; không tuyên bố đạt 80% business/60% toàn dự án. Không thay đổi hoặc hạ ngưỡng chất lượng.
- Lỗi Windows EPERM khi Vite dọn dist/assets trước đó không tái diễn khi chạy lại. Không sửa ACL hay xóa cưỡng bức thư mục; chưa có bằng chứng xác định tiến trình đã giữ khóa. Nếu tái diễn, kiểm tra tiến trình giữ dist trước khi build, không tắt emptyOutDir để che lỗi.
- Các bản ghi demo đã khóa trước khi sửa công thức được giữ nguyên. Muốn sửa dữ liệu lịch sử cần quy trình điều chỉnh riêng, không tự tính lại kỳ khóa.
