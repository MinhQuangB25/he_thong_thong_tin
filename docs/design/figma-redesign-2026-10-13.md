# Giao diện Bình An HRM — 13/10/2026

Thiết kế Figma: https://www.figma.com/design/DPtEko4r5TSXWc3uNk7qoL

## Hướng thiết kế

- Nền sáng `#F3F6F8`, panel trắng, sidebar xanh đậm `#102E34`.
- Màu nhấn HR `#087F75`; khu vực Admin dùng sidebar `#173F67` và nhãn riêng.
- Font DM Sans, chữ nội dung 13–14px, tiêu đề 26–34px; bảng và thao tác rõ ràng hơn.
- Icon SVG thống nhất; menu có trạng thái `aria-current`, đường dẫn bỏ qua menu dành cho bàn phím.
- Bộ màu và component được lưu trong Figma; các màn hình có text và instance chỉnh sửa được.
- Chỉ dùng số liệu thực tế từ API ở ứng dụng; số liệu trong Figma là ví dụ bố cục.

## Các màn hình Figma

| Màn hình | Node |
|---|---|
| HR — Tổng quan desktop | `2:42` |
| Admin — Tài khoản desktop | `2:43` |
| Tổng quan mobile | `2:44` |

Component chung: Navigation `2:34`, Button `2:36`, Metric `2:38`.
Collection: `VariableCollectionId:2:7`. Các màu có semantic alias và code syntax CSS.

## Tích hợp source

- `frontend/src/redesign.css`: token, stylesheet màn hình và responsive.
- `frontend/src/components/Icon.tsx`: SVG dùng chung.
- `AppShell.tsx`: sidebar, header, menu theo role, nhãn Admin riêng.
- `LoginPage.tsx`: giao diện đăng nhập tiếng Việt.
- `DashboardPage.tsx`: thống kê, bảng lương và lối vào trợ lý AI.
- `AdminPage.tsx`: bổ sung mô tả thẻ thống kê.
- `ProfilePage.tsx`: ô nhập liên hệ đồng bộ và hỗ trợ autocomplete email/tel.
- `main.tsx`: tải stylesheet mới sau stylesheet cũ.

Các thay đổi màn hình được giới hạn trong `@media screen` để giữ bản in lương A4 hiện có.

## Kiểm tra

- Frontend `npm run test`: 40/40 test đạt, 16 file.
- Frontend `npm run check`: typecheck và build đạt.
- Figma: font DM Sans, không có ảnh chụp UI bên trong màn hình; HR có 42 text/12 instance, Admin có 50 text/11 instance, mobile có 21 text/3 instance.
- Chrome thực tế: HR tổng quan ở 1440px; bộ lọc nhân sự ở 1024/768/320px; Admin và trình sửa role ở 1440px; nhân viên tổng quan, menu, hồ sơ và bảng lương ở 320px; trưởng nhóm ở 1024px. Không thấy tràn ngang toàn trang; bảng rộng cuộn trong vùng bảng.
- Menu mobile mở/đóng và tự đóng sau khi chọn màn hình; role nhân viên không có menu nhân sự/báo cáo, trưởng nhóm không có menu Admin/báo cáo.
- Các request đăng nhập và đọc dữ liệu quan sát được trả 200; không có lỗi JavaScript trong những luồng đã kiểm tra.
- Sau chỉnh sửa cuối, form hồ sơ tại 320px có ô nhập rộng khoảng 246px, cao 46px, autocomplete `tel`/`email`; console sạch. Container phục vụ bundle `index-D7MLE3sJ.js` và `index-Bz4S8dog.css`.
- Docker build đa tầng gặp lỗi mạng `tls: bad record MAC` khi tải Node. Đã đóng gói `dist` từ `npm run check` bằng Nginx của image frontend local và chạy container mới. Dockerfile đa tầng chính vẫn giữ nguyên; lần build tiêu chuẩn sau cần mạng registry ổn định.
- Thêm `frontend/.dockerignore` để không copy node_modules và file env vào build context.
- Chưa chạy lại hộp thoại in Chrome trong lượt này; test chọn bản in tháng/năm đã đạt và stylesheet màn hình giới hạn trong `@media screen`.
