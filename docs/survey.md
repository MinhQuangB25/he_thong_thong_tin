# Bảng khảo sát HTTT nhân sự Trung tâm Ngoại ngữ Bình An

## 1. Bảng câu hỏi

| STT | Câu hỏi khảo sát | Đối tượng | Kết quả mẫu |
|---:|---|---|---|
| 1 | Hiện trung tâm đang lưu hồ sơ nhân sự bằng công cụ nào? | HR | Excel và hồ sơ giấy |
| 2 | Hồ sơ nhân sự có được dùng chung một mã duy nhất không? | HR | Có nhưng chưa kiểm soát tự động |
| 3 | Ai được phép tạo, sửa và khóa tài khoản? | Quản lý | HR và Admin |
| 4 | Trung tâm đang sử dụng những vai trò nào? | Quản lý | Admin, HR, trưởng nhóm, nhân viên |
| 5 | Nhân viên gửi đơn nghỉ bằng hình thức nào? | Nhân viên | Email và biểu mẫu giấy |
| 6 | Quy trình phê duyệt đơn nghỉ gồm những bước nào? | HR | Nhân viên gửi, trưởng nhóm/HR duyệt |
| 7 | Có kiểm tra đơn nghỉ bị trùng ngày không? | HR | Kiểm tra thủ công |
| 8 | Lịch làm và ca làm được lập ở đâu? | Trưởng nhóm | Bảng tính riêng của từng nhóm |
| 9 | Chấm công có lưu giờ vào, giờ ra và tăng ca không? | Trưởng nhóm | Có, nhưng tổng hợp cuối tháng |
| 10 | Làm thế nào để tránh hai bản chấm công cùng ngày? | HR | Đối chiếu thủ công |
| 11 | Công thức tính lương hiện tại gồm những thành phần nào? | HR | Lương cơ bản, công, phụ cấp, tăng ca, khấu trừ |
| 12 | Bảng lương có lưu lại snapshot sau khi khóa kỳ không? | HR | Chưa có cơ chế rõ ràng |
| 13 | Nhân viên có được xem bảng lương của người khác không? | Quản lý | Không |
| 14 | Báo cáo nhân sự thường cần theo dõi chỉ tiêu nào? | Ban giám đốc | Đang làm, nghỉ phép, nghỉ việc, lương |
| 15 | Trung tâm cần tìm kiếm và lọc dữ liệu theo tiêu chí nào? | HR | Tên, mã, phòng ban, chức vụ, trạng thái |
| 16 | Đã từng xảy ra mất dữ liệu hoặc sai phiên bản chưa? | Quản lý | Có nguy cơ do lưu nhiều file |
| 17 | Trung tâm cần backup và restore CSDL với tần suất nào? | Admin | Hàng tuần và trước khi khóa lương |
| 18 | Người dùng có cần sử dụng trên điện thoại không? | Nhân viên | Có, tối thiểu xem đơn và bảng lương |

## 2. Tổng hợp và kết luận

Khảo sát cho thấy dữ liệu HRM đang phân tán giữa hồ sơ giấy, email và nhiều bảng tính. Các điểm rủi ro chính là trùng dữ liệu, khó truy vết người thay đổi, tổng hợp chấm công chậm và không có snapshot bảng lương. Vì vậy hệ thống mới cần một CSDL tập trung, RBAC, kiểm tra trùng ngày, audit log, khóa kỳ lương và backup/restore bằng script.

Phạm vi ưu tiên của bản mô phỏng gồm đăng nhập và phân quyền, hồ sơ nhân sự, đơn nghỉ, lịch/chấm công, tính lương và báo cáo/payslip. Thuế, bảo hiểm, tuyển dụng, thanh toán và upload file nằm ngoài phạm vi bản đầu tiên.
