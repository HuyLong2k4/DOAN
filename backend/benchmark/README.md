# Benchmark — đo hiệu năng hệ thống

Bộ script tạo số liệu thật cho mục **Đánh giá hiệu năng (4.6)** của báo cáo.

## Yêu cầu
- **Node 18+** (dùng `fetch` có sẵn).
- Máy chủ backend đang chạy (local hoặc URL Railway).
- Đã nạp dữ liệu mẫu: `node scripts/seed.js` (tạo tài khoản donor/receiver, mật khẩu `123456`).

## Cấu hình (biến môi trường, đều có mặc định)
| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `BENCH_BASE_URL` | `http://localhost:5000/api` | Gốc API (đặt URL Railway khi đo trên cloud) |
| `BENCH_VU` | `10` | Số request đồng thời cho đo latency |
| `BENCH_N_READ` / `BENCH_N_WRITE` | `200` / `50` | Số request mỗi endpoint đọc / ghi |
| `BENCH_DONOR` / `BENCH_RECEIVER` | `0905100001` / `0906200001` | Tài khoản đăng nhập |
| `BENCH_RECEIVERS` | `0906200001..05` | Danh sách receiver (CSV) cho test đồng thời |
| `BENCH_ITER` | `10` | Số vòng lặp test đồng thời |
| `BENCH_CONVERSATION_ID` | (trống) | Id hội thoại để đo RTT gửi tin nhắn |

## Chạy

```bash
# 1) Độ trễ + thông lượng API  -> Bảng 4.x "API latency"
npm i -D autocannon             # chỉ cần một lần
node benchmark/api-latency.js

# 2) Test đồng thời (chống double-booking) -> Bảng 4.x "Tương tranh"
node benchmark/concurrency.js

# 3) Độ trễ thời gian thực -> Bảng 4.x "Realtime"
npm i socket.io-client          # chỉ cần một lần
node benchmark/realtime-rtt.js
```

> autocannon báo các phân vị `p50`, `p90`, `p97.5`, `p99` (không có p95 — dùng **p97.5** làm cột đuôi trễ trong bảng).

Đo trên Railway: đặt `BENCH_BASE_URL=https://<app>.up.railway.app/api` trước lệnh, ví dụ:
```bash
BENCH_BASE_URL=https://your-app.up.railway.app/api node benchmark/api-latency.js
```
Đo ở nhiều mức tải: lặp lại với `BENCH_VU=1`, `10`, `50`, `100` để điền nhiều dòng/đơn vị tải trong bảng.

## Lấy `BENCH_CONVERSATION_ID`
Mở một cuộc trò chuyện bất kỳ trong app (vai trò trùng `BENCH_RT_USER`), hoặc lấy `_id` một document trong collection `conversations` có chứa user đó trong `participants`.

## Lưu ý
- Các script đo **POST tạo đơn** và **gửi tin nhắn** sẽ sinh dữ liệu thật; chạy lại `node scripts/seed.js` để dọn về trạng thái sạch.
- Ghi lại kèm **môi trường** (gói Railway/CPU-RAM, tier MongoDB Atlas, mạng) vào bảng Môi trường (mục 4.6.1).
