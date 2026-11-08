# AGENTS.md — Quy tắc làm việc cho HRM Bình An

## 1. Phạm vi và thư mục chính

Đây là dự án chính của hệ thống HRM Trung tâm Ngoại ngữ Bình An.

### Bộ nhớ bền vững của repository

Khi bắt đầu một phiên mới hoặc chuyển sang module lớn, đọc theo thứ tự:

1. `AGENTS.md` — luật làm việc và ranh giới an toàn.
2. `docs/PROJECT_STATUS.md` — trạng thái hiện tại, bằng chứng kiểm tra và giới hạn còn lại.
3. `docs/PLAN.md` — phạm vi, mốc thực hiện và thứ tự công việc.
4. `docs/DECISIONS.md` — các quyết định đã chốt, không tự ý đảo ngược.
5. `tasks/todo.md` — việc đã hoàn thành và việc còn phải làm.
6. Đọc thêm source/test liên quan trực tiếp đến task; không nạp toàn bộ repository nếu không cần.

Các file trên là nguồn thông tin bền vững cho agent giữa các phiên. Sau mỗi mốc lớn, cập nhật trạng thái, quyết định và task còn lại; không coi lịch sử hội thoại là nguồn duy nhất.

- `backend/`: REST API Java 17, Spring Boot 3.5.16, Spring Security, JPA/Hibernate.
- `frontend/`: React 19, TypeScript, Vite 8.
- `database/`: schema, seed và dữ liệu backup MySQL.
- `docs/`: hướng dẫn, báo cáo, API và sơ đồ.
- `scripts/`: script kiểm thử/audit và tạo tài liệu.
- `tasks/`: kế hoạch hoặc yêu cầu công việc.

`D:\he_thong_thong_tin-regression-tests` là Git worktree phụ dùng cho regression test, không phải bản chính. Khi người dùng nói “dự án” mà không nói khác, làm việc tại `D:\he_thong_thong_tin`. Không xóa worktree hoặc các thay đổi chưa commit nếu chưa được người dùng yêu cầu rõ ràng.

## 2. Công nghệ và lệnh chuẩn

### Chạy bằng Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/actuator/health`
- API: `http://localhost:8080/api/v1`

### Backend

```powershell
cd backend
mvn verify
mvn spring-boot:run
```

`mvn verify` là kiểm tra bắt buộc trước khi bàn giao backend. Test mặc định dùng H2; môi trường Docker dùng MySQL.

### Frontend

```powershell
cd frontend
npm install
npm run test
npm run check
npm run dev
```

`npm run check` phải đạt cả typecheck và Vite build. Không dùng `localStorage` để lưu JWT; token hiện được giữ trong memory tại `frontend/src/api/client.ts`.

## 3. Kiến trúc cần tuân thủ

### Backend

Luồng chuẩn là:

```text
Controller → Service → Repository → JPA Domain Entity
```

- Controller ở các package `auth`, `admin`, `people`, `leave`, `attendance`, `payroll`, `report`.
- Request/response dùng DTO riêng, không trả entity JPA trực tiếp nếu không cần.
- Dùng Bean Validation cho request và các exception dùng chung trong `common`.
- Quyền endpoint phải được bảo vệ bằng Spring Security và/hoặc `@PreAuthorize`.
- Lỗi API giữ cấu trúc thống nhất `{ status, code, message, details }`.
- Khi thay đổi nghiệp vụ, đọc service và test tương ứng trước khi sửa controller.

### Frontend

- `frontend/src/App.tsx` chọn trang theo màn hình và người dùng hiện tại.
- `frontend/src/context/AuthContext.tsx` xử lý login/logout và user hiện tại.
- `frontend/src/components/AppShell.tsx` xử lý menu, responsive navigation và tách khu vực Admin.
- Gọi API qua `frontend/src/api/client.ts`; không tự tạo `fetch` mới nếu client hiện tại đáp ứng được.
- Kiểu dữ liệu API đặt trong `frontend/src/api/types.ts`.
- Các page phải có loading, empty, error state; form phải có label, trạng thái lỗi và thao tác bàn phím.
- UI có thể ẩn thao tác theo role nhưng backend vẫn luôn là nơi quyết định quyền thật.

## 4. Role và phân quyền

Role hợp lệ hiện tại:

- `ADMIN`: khu vực Admin riêng, quản lý account/role/audit và có quyền toàn hệ thống.
- `HR_MANAGER`: quản lý nhân sự, đơn từ, chấm công, kỳ lương, bảng lương và báo cáo.
- `TEAM_LEADER`: chỉ xem dữ liệu nhóm được phân công; không được ghi/xem nhóm khác.
- `EMPLOYEE`: xem/sửa phần hồ sơ cá nhân được phép, gửi/hủy đơn chờ duyệt, xem dữ liệu chấm công và bảng lương của chính mình.

Không đổi tên role hoặc tạo role mới chỉ để làm UI chạy. Nếu cần thay đổi quyền, cập nhật đồng bộ enum/backend, seed, frontend type/menu và test RBAC.

Admin phải giữ navigation riêng (`ADMIN SERVER`/`adminNav`), không gộp giao diện Admin vào menu HR thông thường.

## 5. Quy tắc nghiệp vụ quan trọng

- Nhân viên đã có lịch sử không được xóa cứng; dùng trạng thái nghỉ việc và ngày kết thúc.
- Nhân viên chỉ sửa email và số điện thoại của mình; không được sửa mã, phòng ban, chức vụ, lương hoặc trạng thái.
- Đơn nghỉ dùng các trạng thái `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`; chỉ người có quyền mới duyệt/từ chối.
- Không tạo hai đơn nghỉ trùng thời gian cho cùng nhân viên nếu nghiệp vụ hiện tại cấm trùng.
- Một nhân viên chỉ có một lịch/chấm công trong một ngày.
- Kỳ lương đã khóa không được chỉnh sửa trực tiếp.
- Thay đổi role, lương, trạng thái nhân viên và phê duyệt đơn phải được audit theo nghiệp vụ hiện có.
- Nhân viên không được xem bảng lương hoặc dữ liệu chấm công của người khác.

## 6. Cơ sở dữ liệu

- MySQL trong Docker dùng các file `database/init/01-schema.sql` và `database/init/02-seed.sql`.
- Hai file tương ứng ở thư mục `database/schema.sql` và `database/seed.sql` phải được cập nhật đồng bộ; hiện nội dung đang giống nhau.
- Khi sửa entity hoặc schema, kiểm tra cả foreign key, unique key, trạng thái và dữ liệu seed.
- Volume MySQL hiện tại có thể giữ schema cũ; không dùng `docker compose down -v` hoặc xóa volume nếu người dùng chưa cho phép rõ ràng.
- Dữ liệu demo phải giữ các tài khoản: `admin`, `hr.manager`, `leader01`, `employee01`, mật khẩu demo `password` chỉ dùng cho môi trường trình diễn.

## 7. Quy trình cho mỗi thay đổi

1. Chạy `git status --short --untracked-files=all` và bảo toàn các thay đổi có sẵn.
2. Nếu repository có `.codegraph/`, dùng CodeGraph để tìm symbol/call path trước khi đọc hoặc sửa nhiều file.
3. Đọc file sẽ sửa, test liên quan và một ví dụ cùng pattern trong source.
4. Với thay đổi hành vi, thêm hoặc cập nhật test cùng thay đổi; không xóa/skip test để làm build xanh.
5. Chạy test tập trung trước, sau đó chạy toàn bộ test và build liên quan.
6. Nếu thay đổi auth, role, dữ liệu cá nhân hoặc API, kiểm tra cả `401`, `403`, validation và dữ liệu không hợp lệ.
7. Nếu thay đổi UI, kiểm tra desktop `1440px`, tablet `1024px`/`768px` và mobile `320px`; kiểm tra console/network nếu chạy trên browser.
8. Kết thúc bằng báo cáo file đã đổi, lệnh đã chạy, kết quả test/build và phần chưa kiểm tra được.

## 8. Ranh giới an toàn

- Không commit `.env`, secret thật, token, mật khẩu production hoặc thông tin cá nhân thật.
- Không dùng `git reset --hard`, `git checkout --`, xóa volume/database hoặc xóa worktree nếu chưa có yêu cầu rõ ràng.
- Không sửa file build/generated như `backend/target`, `frontend/dist` để thay đổi logic.
- Không thêm dependency mới nếu chưa kiểm tra lý do, ảnh hưởng build và lockfile.
- Nếu yêu cầu mới mâu thuẫn với source hoặc đặc tả, dừng ở điểm mâu thuẫn và báo rõ lựa chọn thay vì âm thầm đoán.

## 9. Tài liệu tham chiếu nhanh

- Quy chuẩn chất lượng: `CONSTRAINTS.md`.
- Hướng dẫn cài đặt/sử dụng: `README.md`, `docs/user-guide.md`.
- Trạng thái dự án: `docs/PROJECT_STATUS.md`.
- Kế hoạch và mốc thực hiện: `docs/PLAN.md`.
- Quyết định kiến trúc/nghiệp vụ: `docs/DECISIONS.md`.
- Việc đã làm/còn lại: `tasks/todo.md`.
- API: `docs/api.md`.
- CSDL và backup: `database/`, `docs/backup-restore.md`.
- Sơ đồ: `docs/diagrams/`.
- Test frontend: các file `*.test.tsx`/`*.test.ts` cạnh source.
- Test backend: `backend/src/test/java/`.
