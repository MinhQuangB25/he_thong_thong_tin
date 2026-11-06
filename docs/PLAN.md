# PLAN — Kế hoạch thực hiện HRM Bình An

## Mục tiêu

Hoàn thiện hệ thống HRM mô phỏng cho Trung tâm Ngoại ngữ Bình An bằng Java Spring Boot, React TypeScript, MySQL và Docker Compose; đáp ứng yêu cầu đồ án về phân tích, thiết kế, cài đặt, demo và báo cáo.

## Mốc 15 tuần

| Tuần | Kết quả cần có | Trạng thái |
|---|---|---|
| 1 | Chốt đề tài, doanh nghiệp, phạm vi và phân công | Hoàn thành một phần |
| 2 | Bảng khảo sát HTTT tối thiểu 15 câu | Có tài liệu, tiếp tục hoàn thiện |
| 3 | Tổng hợp khảo sát, vấn đề và yêu cầu | Có báo cáo tuần 3 |
| 4 | Mô tả nghiệp vụ, tác nhân và quy trình HRM | Hoàn thành trong outline |
| 5 | BFD, sơ đồ ngữ cảnh và use case | Có sơ đồ trong `docs/diagrams/` |
| 6 | DFD mức đỉnh, ERD và đặc tả dữ liệu | Có sơ đồ và schema SQL |
| 7 | Dựng Spring Boot, React, MySQL, Docker | Hoàn thành |
| 8 | Login, JWT, role và RBAC | Hoàn thành và có test |
| 9 | Nhân viên, phòng ban, chức vụ, hợp đồng | Hoàn thành ở mức demo |
| 10 | Đội nhóm, ca làm và lịch làm | Hoàn thành ở mức demo |
| 11 | Đơn từ, phê duyệt và chấm công | Hoàn thành và đã regression test |
| 12 | Tính lương, bảng lương và khóa kỳ | Hoàn thành và đã regression test |
| 13 | Dashboard, báo cáo, tìm kiếm, lọc, sắp xếp, phân trang | Hoàn thành ở các luồng chính |
| 14 | Seed data, test, backup/restore, ảnh giao diện | Test/seed đã có; backup/restore bản sao đã nghiệm thu 14/10/2026 |
| 15 | Báo cáo, README, hướng dẫn và luyện thuyết trình | Đang hoàn thiện |

## Thứ tự ưu tiên tiếp theo

1. Kiểm tra bản in thật của bảng lương tháng/năm.
2. Backup/restore trên bản sao đã đạt; giữ bản tốt trước mọi thay đổi dữ liệu tiếp theo.
3. Coverage đã đo; bổ sung test để vượt baseline 75,16% service/calculator và đạt 80% nghiệp vụ; giữ quality bar, xử lý dependency audit trước phát hành.
4. Rà soát dữ liệu demo, tài khoản demo và kịch bản trình diễn.
5. Hoàn thiện báo cáo in, nội dung đóng góp thành viên và hướng dẫn nộp bài.

## Definition of Done

- Test backend/frontend và build đạt.
- Luồng sai quyền trả `401`/`403` đúng.
- Không có secret thật trong source hoặc tài liệu nộp.
- Dữ liệu demo đủ cho 4 role và các giao dịch HRM.
- Tài liệu cài đặt, sử dụng, backup/restore và báo cáo khớp với source thực tế.
- Mọi giới hạn chưa kiểm tra được phải ghi rõ trong `docs/PROJECT_STATUS.md`.

## Mốc bổ sung — AI nhớ hội thoại trong phiên (14/10/2026)

- Hoàn thành ngữ cảnh tối đa 4 lượt, giữ khi chuyển trang, xóa khi đăng xuất/reload/hội thoại mới.
- Không mở rộng quyền AI hoặc thêm lưu trữ server; giữ xác nhận qua API nghiệp vụ.
- Nghiệm thu: 47 test backend, 46 test frontend, typecheck/build và Chrome + Ollama thật; xem `docs/testing/assistant-memory-2026-10-14.md`.
