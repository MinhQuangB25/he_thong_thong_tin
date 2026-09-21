# Báo cáo đồ án — Hệ thống HRM Trung tâm Ngoại ngữ Bình An

Tài liệu này là outline nội dung báo cáo in; có thể xuất PDF/DOCX sau khi bổ sung tên thành viên, logo trường và ảnh chụp demo.

## Chương 1. Giới thiệu doanh nghiệp

Trung tâm Ngoại ngữ Bình An cung cấp các khóa tiếng Anh giao tiếp, thiếu nhi và luyện thi. Mô hình nhân sự gồm Ban giám đốc, bộ phận Đào tạo, Vận hành/nhân sự, giáo viên, trưởng nhóm và nhân viên hỗ trợ. Hoạt động cần quản lý gồm hồ sơ, hợp đồng, ca/lịch, đơn nghỉ, chấm công, tính lương và báo cáo.

## Chương 2. Khảo sát hệ thống thông tin

Sử dụng [bảng khảo sát](survey.md) gồm 18 câu hỏi. Kết luận: dữ liệu phân tán; phê duyệt và chấm công còn thủ công; cần CSDL tập trung, phân quyền theo vai trò, truy vết thay đổi, kiểm tra trùng và backup.

## Chương 3. Phân tích hệ thống

- Tác nhân: Admin, HR Manager, Team Leader, Employee.
- Chức năng: xem [BFD](diagrams/bfd.svg), [sơ đồ ngữ cảnh](diagrams/context.svg), [DFD mức đỉnh](diagrams/dfd-level-0.svg).
- Luồng chính: xác thực → hồ sơ → đơn từ/chấm công → kỳ lương → payslip/báo cáo.
- Business rules: nhân viên không sửa vai trò/lương; đơn nghỉ không trùng; một chấm công/ngày; kỳ lương khóa không sửa; thay đổi nhạy cảm ghi audit.

## Chương 4. Thiết kế hệ thống

Kiến trúc REST `controller → service → repository`, DTO và Bean Validation. CSDL MySQL có các bảng nghiệp vụ/chính sách; xem [ERD](diagrams/erd.svg) và source [schema.sql](../database/schema.sql). API có tiền tố `/api/v1`, Bearer JWT, BCrypt và RBAC.

## Chương 5. Thiết kế giao diện

Giao diện React gồm Login, Dashboard, Nhân sự, Đơn từ, Chấm công và Bảng lương. Các danh sách có tìm kiếm, lọc, sắp xếp, phân trang; form có label và lỗi; hỗ trợ 320/768/1024/1440px. Ảnh chụp màn hình đặt trong `docs/screenshots/` sau buổi demo.

## Chương 6. Cài đặt, vận hành và bảo trì

Thực hiện theo [hướng dẫn sử dụng](user-guide.md). Docker Compose khởi động MySQL, backend và frontend. Backup dùng `mysqldump`; restore dùng pipe vào mysql. Khi nâng cấp, chạy test backend/frontend trước và giữ lại migration/script tương ứng.

## Chương 7. Kiểm thử

Đã có unit test công thức lương, test context/API đăng nhập và component smoke test Login. Kịch bản nghiệm thu: tài khoản sai quyền nhận 403; nhân viên chỉ thấy payslip của mình; đơn nghỉ trùng bị 409; chấm công trùng ngày bị 409; kỳ lương khóa không tính lại.

## Chương 8. Tổng kết và hướng phát triển

Đã xây dựng được lõi HRM có thể demo end-to-end. Ưu điểm là luồng nghiệp vụ rõ, phân quyền và snapshot lương; hạn chế là báo cáo nâng cao, thuế/bảo hiểm và thông báo email chưa nằm trong bản đầu. Hướng phát triển: tích hợp máy chấm công, phê duyệt nhiều cấp, xuất Excel/PDF, SSO, audit dashboard và chính sách thuế/bảo hiểm theo quy định.

## Kế hoạch 15 tuần và phân công

| Tuần | Kết quả | Phụ trách đề xuất |
|---:|---|---|
| 1 | Chốt đề tài, phạm vi, doanh nghiệp | Cả nhóm |
| 2 | Bảng khảo sát 18 câu | Thành viên 1 |
| 3 | Tổng hợp khảo sát, yêu cầu | Thành viên 1, 2 |
| 4 | Mô tả nghiệp vụ HRM | Thành viên 2 |
| 5 | BFD, ngữ cảnh, use case | Thành viên 2, 3 |
| 6 | DFD, ERD, đặc tả dữ liệu | Thành viên 3 |
| 7 | Dựng Spring Boot, React, MySQL, Docker | Thành viên 3, 4 |
| 8 | JWT, BCrypt, RBAC, audit | Thành viên 4 |
| 9 | Nhân viên, phòng ban, chức vụ, hợp đồng | Thành viên 4 |
| 10 | Đội nhóm, ca và lịch làm | Thành viên 3, 5 |
| 11 | Đơn từ, phê duyệt, chấm công | Thành viên 5 |
| 12 | Tính lương, kỳ lương, khóa kỳ | Thành viên 4, 5 |
| 13 | Dashboard, báo cáo, UX responsive | Thành viên 1, 5 |
| 14 | Seed, test, backup/restore, screenshots | Cả nhóm |
| 15 | Hoàn thiện báo cáo và thuyết trình | Cả nhóm |

Tên thật và tự đánh giá điểm từng thành viên cần nhóm điền tại thời điểm in báo cáo; bản source không tự suy đoán thông tin cá nhân.
