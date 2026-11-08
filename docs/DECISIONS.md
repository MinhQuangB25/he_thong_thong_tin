# DECISIONS — Các quyết định đã chốt

## D001 — Công nghệ và triển khai

- **Quyết định:** Java 17 + Spring Boot 3.5.16 + Maven; React + TypeScript + Vite; MySQL 8; Docker Compose.
- **Lý do:** phù hợp yêu cầu đồ án, dễ chạy demo và tách frontend/backend.
- **Hệ quả:** không tự đổi framework hoặc database giữa chừng nếu chưa cập nhật kế hoạch và tài liệu.

## D002 — Admin là khu vực riêng

- **Quyết định:** `ADMIN` dùng layout/menu riêng (`ADMIN SERVER`/`adminNav`), còn HR và các role nghiệp vụ dùng khu vực People Operations.
- **Lý do:** đáp ứng yêu cầu giao diện Admin tách biệt nhưng Admin vẫn có thể đi vào nghiệp vụ HR khi cần.
- **Hệ quả:** không gộp toàn bộ menu thành một giao diện chung; vẫn phải kiểm tra quyền ở backend.

## D003 — Bốn role chính

- **Quyết định:** chỉ dùng `ADMIN`, `HR_MANAGER`, `TEAM_LEADER`, `EMPLOYEE`.
- **Lý do:** khớp mô hình đề bài và dữ liệu demo.
- **Hệ quả:** thay đổi quyền phải cập nhật đồng bộ backend enum, seed, frontend type/menu và test RBAC.

## D004 — JWT chỉ giữ trong memory

- **Quyết định:** không lưu JWT vào `localStorage`.
- **Lý do:** giảm rủi ro token tồn tại lâu trong trình duyệt; đây là quyết định chất lượng đã ghi trong `CONSTRAINTS.md`.
- **Hệ quả:** reload trang có thể yêu cầu đăng nhập lại; không xem đây là lỗi nếu chưa có cơ chế session khác được chốt.

## D005 — Xóa nhân sự là xóa mềm

- **Quyết định:** không xóa cứng nhân viên đã có lịch sử; dùng `TERMINATED` và `end_date`.
- **Lý do:** giữ lịch sử hợp đồng, đơn từ, chấm công, lương và audit.
- **Hệ quả:** báo cáo phải lọc theo thời điểm cuối kỳ, không chỉ dựa vào trạng thái hiện tại.

## D006 — Bảng lương có snapshot và trạng thái khóa

- **Quyết định:** bảng lương lưu số liệu tại thời điểm tính; kỳ `LOCKED` không được sửa trực tiếp.
- **Lý do:** thay đổi hợp đồng sau này không làm thay đổi lịch sử lương đã chốt.
- **Hệ quả:** mọi thao tác tính lại/khóa phải được kiểm tra cả ở UI và backend.

## D007 — CSDL Docker dùng init SQL

- **Quyết định:** Docker MySQL khởi tạo bằng `database/init/01-schema.sql` và `database/init/02-seed.sql`; bản tham chiếu tương ứng là `database/schema.sql` và `database/seed.sql`.
- **Lý do:** có thể dựng demo mới nhanh và vẫn có script SQL độc lập để nộp.
- **Hệ quả:** sửa schema/seed phải cập nhật hai bản đồng bộ; volume cũ không tự chạy lại init script.

## D008 — Test và bằng chứng là một phần hồ sơ

- **Quyết định:** giữ test cạnh source, báo cáo kiểm thử và ảnh/API audit trong `docs/testing/`.
- **Lý do:** chứng minh các chức năng đồ án và lỗi đã sửa.
- **Hệ quả:** không đưa `docs/testing/` vào `.gitignore`; chỉ ignore build output, cache và file máy cá nhân.

## D009 — Worktree regression không phải bản chính

- **Quyết định:** `D:\he_thong_thong_tin` là canonical; `D:\he_thong_thong_tin-regression-tests` là worktree phụ.
- **Lý do:** tránh nhầm timestamp/build artifact với source mới nhất.
- **Hệ quả:** trước khi xóa worktree phải kiểm tra thay đổi chưa commit và xác nhận không còn dữ liệu cần giữ.

## D010 — Trợ lý AI giới hạn quyền, chỉ ghi sau xác nhận

- **Quyết định:** Ollama local chỉ phân loại ý định thành danh sách cho phép. Backend lấy dữ liệu bằng truy vấn cố định và kiểm tra quyền; không đưa SQL/ID nhân viên từ model vào truy vấn. Chỉ đề xuất sửa hồ sơ cá nhân, tạo/hủy đơn cá nhân; tạo đề xuất không ghi DB.
- **Lý do:** AI không được có siêu quyền và không được tự thực hiện thao tác.
- **Hệ quả:** frontend phải hiện bản nháp và gọi API nghiệp vụ hiện có sau khi người dùng xác nhận; API kiểm tra lại quyền, tính hợp lệ và bản nháp hồ sơ cũ. Không lưu hội thoại/bản nháp ở server.

## D011 — Giao diện Figma và stylesheet màn hình riêng

- **Quyết định:** thiết kế lại giao diện bằng Figma, dùng DM Sans, sidebar HR xanh đậm và Admin xanh navy riêng, icon SVG, các token ở `frontend/src/redesign.css`.
- **Lý do:** tăng độ rõ của thông tin và thao tác, đồng bộ màn hình theo role.
- **Hệ quả:** stylesheet mới dùng `@media screen` để giữ bản in A4 trong `styles.css`; tham chiếu Figma và kết quả kiểm tra ở `docs/design/figma-redesign-2026-10-13.md`.

## D012 — AI nhớ ngữ cảnh tạm thời theo phiên đăng nhập

- **Quyết định:** React giữ tối đa 4 lượt hỏi/đáp (câu hỏi tối đa 500 ký tự, tóm tắt trả lời tối đa 600), gửi `history` tùy chọn qua API hỏi đáp. Giữ khi chuyển trang, xóa khi đăng nhập phiên mới/đăng xuất/reload hoặc chủ động mở hội thoại mới. Không lưu MySQL, server session hay browser storage; không thay đổi D010 về bước xác nhận.
- **Lý do:** sửa việc AI không hiểu câu hỏi nối tiếp mà không tạo kho lưu dữ liệu hồ sơ/lương dài hạn. Không dùng cache hội thoại chung hoặc cho AI truy vấn SQL.
- **Hệ quả:** lịch sử là dữ liệu client không đáng tin, chỉ dùng để hiểu yêu cầu mới nhất. Backend kiểm tra giới hạn đầu vào, lấy danh tính/quyền từ principal và truy vấn mới. Lịch sử không cấp quyền hay chứng minh đã ghi dữ liệu. Bản nháp cũ không thể xác nhận từ lịch sử; chỉ form hiện tại được gọi API nghiệp vụ. Hủy request phía trình duyệt không đảm bảo Ollama dừng suy luận tức thì.

## D013 — Nghiệm thu phục hồi trên bản sao, không ghi đè demo

- **Quyết định:** backup native file bằng mysqldump `--result-file`, chép byte bằng `docker cp`; thử phục hồi trên MySQL tmpfs không có cổng host/mạng ứng dụng. Backend tạm dùng schema validation và loopback của MySQL tạm, không đổi datasource của backend chính.
- **Lý do:** chứng minh backup đọc được và ứng dụng dùng được dữ liệu phục hồi mà không làm mất dữ liệu demo; tránh lỗi mã hóa PowerShell và nhầm container đích.
- **Hệ quả:** dump local chứa dữ liệu nhạy cảm phải nằm trong `.local-backups/` gitignored, không commit. So sánh dump trước mọi thao tác có thể ghi audit trên bản sao. Cleanup chỉ container tạm có ID/label đúng, giữ SQL trên host. Phục hồi đè CSDL chính hoặc lịch backup tự động là thao tác riêng cần phạm vi/xác nhận rõ.

## D014 — Coverage baseline trung thực, chưa coi là quality gate

- **Quyết định:** dùng JaCoCo 0.8.15 qua Maven profile `coverage`, Vitest V8 5.0.1 khớp runner 5.0.1. Đo toàn bộ production Java và TS/TSX, cả file chưa được test import. Báo cáo dòng và nhánh riêng; nhóm service/calculator backend dùng `**/*Service.class` và `**/PayrollCalculator.class`, công khai đầy đủ phạm vi.
- **Lý do:** có số liệu lặp lại được trước khi bổ sung test; không loại code ít coverage hoặc suy coverage từ số test/đợt demo Chrome.
- **Hệ quả:** profile/command hiện là report-only, không giảm hoặc thay thế ngưỡng 80% nghiệp vụ/60% tổng đã chốt. Không tuyên bố nghiệm thu coverage chỉ vì test/build exit 0. Service/calculator là phạm vi định lượng cụ thể của baseline, không bao gồm mọi adapter/controller có xử lý nghiệp vụ; chúng vẫn có trong báo cáo toàn backend và cần test. Dòng và nhánh không được đánh đồng. Không tính SQL/CSS/tài liệu vào tỷ lệ code thực thi hoặc cộng statement JavaScript với instruction Java.

## D015 — Điều chỉnh lương bằng hợp đồng mới, không sửa hợp đồng cũ

- **Quyết định:** lương cơ bản/phụ cấp chỉ nằm trong `employment_contracts`. Điều chỉnh lương là tạo hợp đồng mới; hợp đồng `ACTIVE` đang mở được đặt `endDate` = ngày trước ngày bắt đầu mới. Không có API sửa số tiền của hợp đồng đã ký. `PUT /employees/{id}` không nhận lương/trạng thái/mã NV. Kỳ lương chọn hợp đồng mới nhất đã bắt đầu trước cuối kỳ và chưa kết thúc trước đầu kỳ.
- **Lý do:** giữ lịch sử lương để báo cáo theo ngày và kỳ lương cũ khớp dữ liệu; audit thể hiện rõ lương cũ → mới; tránh lỗi trước đây khi hợp đồng ký cho tháng sau bị áp dụng ngay vào kỳ hiện tại.
- **Bổ sung 05/11/2026 (người dùng chốt):** "Cho nghỉ việc" tự chấm dứt hợp đồng còn mở với ngày kết thúc = ngày nghỉ việc; hợp đồng chưa hiệu lực bị hủy theo cùng cách (ngày kết thúc trước ngày bắt đầu nên không khoảng ngày nào chọn trúng). Cho nghỉ việc lặp lại trả `409`. Dữ liệu cũ đã nghỉ việc trước thay đổi này không tự sửa.
- **Hệ quả:** chỉ chấm dứt được hợp đồng đã bắt đầu; hợp đồng "chờ hiệu lực" nhập nhầm chưa có thao tác hủy (cần quyết định riêng). Nhân viên không có hợp đồng hiệu lực trong kỳ sẽ không được lập bảng lương — trang Hợp đồng hiển thị số nhân sự đang làm chưa có hợp đồng. Không tính lương theo tỷ lệ ngày khi đổi hợp đồng giữa tháng.
