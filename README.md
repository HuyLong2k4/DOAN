# Food 4 life — Hệ thống chia sẻ thực phẩm dư thừa

Nền tảng kết nối **người quyên góp** thực phẩm dư thừa với **người nhận** thông qua đội ngũ **tình nguyện viên** giao nhận. Hệ thống gồm app di động (ba vai trò), trang quản trị web và backend API thời gian thực.

| Thành phần | Công nghệ | Cổng |
|------------|-----------|------|
| Backend (API + real-time) | Node.js, Express, Mongoose, Socket.IO | `5000` |
| Admin Web | React + Vite + TypeScript | `5173` |
| Mobile App | React Native (Expo) | — |

Cơ sở dữ liệu dùng **MongoDB Atlas** (đám mây), không cần cài MongoDB cục bộ.

---

# Bản đã triển khai (dùng ngay — không cần cài đặt)

Hệ thống đã chạy sẵn trên cloud (Railway). Để chấm/demo nhanh, **không cần** cài MongoDB hay dựng server — chỉ cần truy cập:

| Thành phần | Truy cập |
|------------|----------|
| **Admin Web** | https://adminweb-production-ba29.up.railway.app/login |
| **Backend API** | https://doan-production-de5f.up.railway.app/api (kiểm tra: `/health`) |
| **Mobile App (Android)** | Cài file APK qua bản build nội bộ EAS — mở [link cài đặt](https://expo.dev/accounts/maihuylong102/projects/Food/builds/558f3e9f-3330-4325-a084-4a9ba6ac293e) rồi quét mã QR / bấm tải trên trang đó |

**Tài khoản demo** (mật khẩu chung `123456`):

| Vai trò | Số điện thoại |
|---------|---------------|
| Quản trị viên (Admin) | `0900000001` |
| Người quyên góp (Donor) | `0905100001` → `0905100010` |
| Người nhận (Receiver) | `0906200001` → `0906200010` |
| Tình nguyện viên (Volunteer) | `0907300001` → `0907300010` |

> Admin Web đăng nhập bằng tài khoản **Admin**; app di động đăng nhập bằng Donor / Receiver / Volunteer.

---

# Cài đặt cục bộ (cho nhà phát triển)

## 1. Yêu cầu

- **Node.js ≥ 20 LTS** + **npm**, và **Git**.
- Một tài khoản **MongoDB Atlas** (miễn phí) — xem mục 2.
- Mobile App: ứng dụng **Expo Go** (hoặc Android Studio / Xcode); điện thoại và máy chạy backend phải **cùng mạng Wi-Fi**.

## 2. Cơ sở dữ liệu (MongoDB Atlas)

1. Tạo một **Cluster** miễn phí (M0) tại [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → tạo user/mật khẩu.
3. **Network Access** → thêm `0.0.0.0/0` (chỉ dùng khi học tập/demo).
4. **Connect → Drivers** → lấy chuỗi kết nối, giữ nguyên tên database **`Food`**:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/Food?retryWrites=true&w=majority
   ```

## 3. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Điền `backend/.env` — bắt buộc 2 biến:

```
MONGO_URI=<chuỗi kết nối Atlas ở mục 2>
JWT_SECRET=<chuỗi ngẫu nhiên dài>
```

> Các biến khác (`PORT`, `ALLOWED_ORIGINS`, `GOOGLE_MAPS_API_KEY`…) để trống là chạy được khi dev.

Chạy `npm run dev` → log hiện `Server listening on port 5000`. Kiểm tra: `http://localhost:5000/health`.

## 4. Nạp dữ liệu mẫu

```bash
cd backend && node scripts/seed.js
```

Script tạo các tài khoản demo (xem bảng ở mục **Bản đã triển khai**, mật khẩu chung `123456`), idempotent — chạy lại không nhân đôi.

## 5. Admin Web

```bash
cd adminWeb
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # http://localhost:5173
```

File `adminWeb/.env`: `VITE_API_URL=http://localhost:5000/api`. Đăng nhập bằng Admin `0900000001` / `123456`.

## 6. Mobile App (Expo)

```bash
cd mobileApp/Food
npm install
```

Tạo `mobileApp/Food/.env` trỏ về **IP LAN của máy backend** (không dùng `localhost`):

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
```

> Lấy IP LAN bằng `ipconfig` → dòng **IPv4 Address**.

Chạy `npx expo start`, quét mã QR bằng **Expo Go** (hoặc nhấn `a` / `i` cho emulator).

> Bản đồ và một số module gốc không chạy đầy đủ trên Expo Go. Để chạy đầy đủ, tạo development build: `npx expo run:android` (cần Android Studio) hoặc `npx expo run:ios` (cần Xcode).

## 7. Chạy bằng Docker (tùy chọn)

Dựng Backend + Admin Web trong container (CSDL vẫn dùng Atlas; cần `backend/.env` ở mục 3):

```bash
cp .env.example .env        # thư mục gốc; Windows: copy .env.example .env
docker compose up --build -d
```

Backend `http://localhost:5000` · Admin Web `http://localhost:8080`. Dừng: `docker compose down`.
