# Quality Constraints

## Floor

- Không commit secret thật, file `.env`, token hoặc mật khẩu production.
- Không dùng `localStorage` để lưu JWT.
- Không bỏ qua hoặc xóa test để làm build xanh.
- Không để lại stub chưa triển khai trong luồng demo.
- Các endpoint bảo vệ phải kiểm tra cả xác thực và quyền truy cập.

## Enforced checks

| Dimension | Rule | Command | Stage |
|---|---|---|---|
| Backend build | Không có lỗi biên dịch | `mvn verify` | Mỗi mốc |
| Backend tests | Business rules đạt 80% khi cấu hình JaCoCo | `mvn verify` | Mỗi mốc |
| Frontend types/build | TypeScript và Vite build thành công | `npm run check` | Mỗi mốc |
| Security | Không có secret trong source; dependency audit được rà soát | `npm audit --audit-level=high` | Trước khi nộp |
| RBAC | Luồng sai quyền phải trả 403 | Backend integration tests | Mỗi mốc |

## Performance and accessibility

- Giao diện phải usable ở 320px, 768px, 1024px và 1440px.
- Form có label, focus state, keyboard navigation và trạng thái lỗi.
- Trang danh sách có loading, empty và error state.

