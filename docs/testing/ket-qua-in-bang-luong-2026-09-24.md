# Kiểm tra bản in bảng lương trên Chrome — 24/09/2026

## Phạm vi và cách kiểm tra

- Chạy frontend tại `http://localhost:5173` và backend tại `http://localhost:8080`.
- Dùng Chrome thật ở chế độ headless, viewport 1440 × 900, đăng nhập tài khoản demo `employee01`.
- Mở màn hình Bảng lương, bấm lần lượt **In bảng lương tháng** và **In bảng lương năm**.
- Sau mỗi lần bấm, xác nhận sự kiện `beforeprint`, chế độ in trên phần tử `.payroll-page` và xuất PDF bằng chính Chrome trên giấy A4. Đọc nội dung PDF và render trang đầu để kiểm tra bố cục. Kiểm tra cả bản không lề và bản có lề 10 mm.

## Kết quả ban đầu

| Trường hợp | Kết quả |
|---|---|
| Đăng nhập và tải lương | Thành công; API login, bảng lương, công thức tính và tổng hợp năm trả HTTP 200. Console và page error không có lỗi. |
| Nút in tháng | Có `beforeprint`, `data-print-mode="month"`; PDF 1 trang A4, gồm bảng lương tháng 9/2026 của Nguyễn Minh Anh. Phần tổng hợp năm không xuất hiện. |
| Bản in tháng không lề | Đủ 7 cột nhưng cột **Thực lĩnh** chỉ cách mép phải khoảng 1,7 pt, dễ bị cắt trên máy in thực tế. |
| Bản in tháng lề 10 mm | **Không đạt**: cột **Thực lĩnh** biến mất hoàn toàn khỏi PDF. PDF chỉ còn đến cột Khấu trừ. |
| Nút in năm | Có `beforeprint`, `data-print-mode="year"`; PDF 1 trang A4, không lẫn bảng tháng. |
| Bản in năm lề 10 mm | Đủ 5 khoản: lương cơ bản 28.000.000 ₫, phụ cấp 1.000.000 ₫, tăng ca 302.885 ₫, khấu trừ 0 ₫, thực lĩnh 4.533.654 ₫. Bố cục không bị cắt. |

## Vấn đề ở bản cũ

1. CSS in tại `frontend/src/styles.css` đặt `.payroll-page table { min-width: 0; }` nhưng giữ padding của các ô bảng; khi vùng in thu hẹp, bảng rộng hơn trang và cột cuối bị cắt. Cần bố trí bảng vừa A4 có lề và kiểm tra lại trực quan.
2. Bản in năm chưa hiển thị tên hoặc mã nhân viên. Khi in riêng ra giấy, người nhận bảng lương không được xác định rõ.

Lần kiểm tra này chỉ đọc dữ liệu demo và in PDF tạm để phân tích; không tạo hay chỉnh sửa kỳ lương.

## Kết quả sau sửa

- Sửa CSS in tháng để bảng dùng đúng chiều rộng trang, chia tỷ lệ 7 cột và cho nội dung ô xuống dòng khi cần.
- Khi in năm từ tài khoản nhân viên hoặc trưởng nhóm, tải hồ sơ cá nhân và in **tên + mã nhân viên** từ hồ sơ đó. Tên trên tài khoản trưởng nhóm có thể là tên vai trò, nên không dùng tên hiển thị của tài khoản để nhận diện người nhận lương.
- Đã bấm lại hai nút in bằng Chrome 153, xuất PDF A4 có lề 10 mm và render trang PDF để xem trực quan:

| Trường hợp sau sửa | Kết quả |
|---|---|
| Nhân viên in tháng 9/2026 | Đạt: PDF 1 trang, đủ 7 cột gồm **Thực lĩnh** 4.033.654 ₫; không lẫn tổng hợp năm. |
| Nhân viên in năm 2026 | Đạt: PDF 1 trang, có **Nguyễn Minh Anh · BA-EMP-001**, đủ 5 khoản và thực lĩnh 4.533.654 ₫; không lẫn bảng tháng. |
| Chọn tháng 1 không có bảng lương rồi in năm 2026 | Đạt: bản in năm vẫn có tên/mã nhân viên và tổng hợp năm. |
| HR in tháng 9/2026 | Đạt: PDF 1 trang, đủ 4 nhân viên và cột Thực lĩnh của từng người. |
| Trưởng nhóm mở bảng lương cá nhân | Đạt: hồ sơ trả HTTP 200, hiển thị **Trần Quốc Bảo · BA-TL-001**. Ở viewport 320 px không tràn ngang. |

Frontend `npm run test` đạt **36/36 test** trên 15 file; `npm run check` đạt typecheck và build. Trong các luồng Chrome trên, API trả HTTP 200, không có lỗi console hoặc page error. Docker frontend đã được build lại để bản chạy tại `http://localhost:5173` dùng source mới.
