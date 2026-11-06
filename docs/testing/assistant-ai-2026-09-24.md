# Kiểm thử trợ lý AI theo role — 24/09/2026

## Kết quả tự động

- Backend `mvn verify`: đạt, 42 test, không lỗi/thất bại.
- Frontend `npm run test`: đạt, 40 test trong 16 file.
- Frontend `npm run check`: đạt typecheck và Vite production build.
- `docker compose config --quiet`: đạt.
- `docker compose up -d --build`: database healthy, backend và frontend started.
- `GET http://localhost:8080/actuator/health`: `UP`.
- Ollama `ollama list`: có `qwen3.5:4b`, dung lượng `3.4 GB`.
- API thật với tài khoản `employee01`: `POST /api/v1/assistant/answers` trả `200 ANSWER`, nguồn `Quy tắc tính lương`, ngày công chuẩn `26`, hệ số tăng ca `1.50`.

## Kết quả Chrome DevTools

- Đăng nhập `hr.manager` thành công; menu có **Trợ lý AI**.
- Ở viewport 320px, trang trợ lý chuyển thành một cột, form và nút không bị tràn ngang.
- Khi Ollama chưa bật, `POST /api/v1/assistant/answers` trả `503`; giao diện hiển thị `Trợ lý AI chưa sẵn sàng. Hãy kiểm tra Ollama và model đã tải.`.
- Đăng nhập `admin` thành công; sidebar giữ nhãn `ADMIN SERVER`, navigation là `Điều hướng quản trị`, và có menu Trợ lý AI riêng trong khu vực Admin.
- Console có một lỗi `Failed to load resource: ... 503` tương ứng đúng request AI chưa sẵn sàng; không có lỗi JavaScript.

## Ghi chú vận hành

DNS mặc định của Docker ban đầu không phân giải được `registry.ollama.ai`. Compose đã bổ sung DNS dự phòng `1.1.1.1` và `8.8.8.8`, recreate service thành công và tải model hoàn tất. Có thể kiểm tra lại bằng:

```powershell
docker compose --profile ai up -d ollama
docker compose --profile ai exec ollama ollama pull qwen3.5:4b
```
