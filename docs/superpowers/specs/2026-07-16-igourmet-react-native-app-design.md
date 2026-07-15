# iGourmet — App React Native (dùng chung backend với web)

**Ngày:** 2026-07-16
**Mục tiêu:** iGourmet dùng được trên cả web (giữ nguyên app Vite hiện tại) và app native iOS/Android, dùng chung một backend.

## Quyết định

- **App native:** React Native qua **Expo** (managed), **Expo Router** (điều hướng file-based), **NativeWind** (Tailwind cho RN).
- **Vị trí:** folder mới `D:\NhaHang\mobile` (**ngang hàng** với `igourmet-app`, `backend`). Web Vite giữ nguyên, không đụng.
- **Dùng lại:** logic gọi API, types, luồng nghiệp vụ, token màu/spacing Tailwind. **Viết lại:** toàn bộ UI (~13 màn) bằng component RN.
- QR: `react-native-qrcode-svg` (thay `qrcode.react`/`react-qr-code` không chạy trên RN).

## Rủi ro chính — Auth (cookie → token)

Backend hiện **chỉ dùng httpOnly cookie** cho customer:
- `auth.controller.js`: `login`/`refresh` set cookie, body chỉ trả `customer`.
- `auth.middleware.js:8` (`extractToken`): route `/api/customer/*` **ép đọc cookie**, bỏ qua `Bearer` header.

App native không quản cookie đáng tin → phải dùng Bearer token + SecureStore.

### Thay đổi backend (nhỏ, tương thích ngược — web vẫn dùng cookie)

1. `login`/`refresh`: trả thêm `accessToken` + `refreshToken` trong **body** (service đã sinh sẵn, chỉ thêm field).
2. `extractToken`: với route customer, nếu **không có cookie** thì fallback đọc `Authorization: Bearer`. Web có cookie → không đổi hành vi.
3. `refresh`: đọc refresh-token từ cookie **hoặc** header/body (app gửi qua header).

## Kiến trúc app `mobile/`

- `lib/api.ts` — axios instance (port từ web): interceptor gắn `Authorization: Bearer <accessToken>` từ SecureStore, tự refresh khi 401 (gộp request như web), lưu token mới.
- `lib/auth.ts` — lưu/đọc/xóa token qua `expo-secure-store`.
- `app/` — màn hình (Expo Router). Auth guard: chưa đăng nhập → Login.
- Màn: Login, Signup, Home, IGoCard, MyQr, Invoices, Booking, Brands, DeliveryMenu, ReservationHistory, Topup, VerifyEmail, ResetPassword.

## Phạm vi đợt đầu (MVP)

Dựng khung + auth flow chạy được, rồi build màn cốt lõi trước: **Login → Home → IGoCard → MyQr**. Các màn còn lại làm sau.

## Không làm (YAGNI)

- Không gộp web+app một codebase (react-native-web) — giữ tách biệt.
- Không dựng monorepo tooling / shared package — copy phần logic cần dùng.
