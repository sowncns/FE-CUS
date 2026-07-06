# Hướng dẫn tích hợp API vào Frontend

Tài liệu này hướng dẫn **cách sử dụng thực tế** API backend nhà hàng để tích hợp vào Frontend (React / Next.js / mobile). Về danh sách endpoint đầy đủ, xem [`API.md`](./API.md).

---

## 1. Chuẩn bị

### 1.1 Base URL & môi trường

| Môi trường | Base URL |
|---|---|
| Local | `http://localhost:5000/api` |
| Production | `https://<domain>/api` |

Đặt trong biến môi trường FE (ví dụ `.env`):

```env
# React (CRA)
REACT_APP_API_URL=http://localhost:5000/api
# Vite
VITE_API_URL=http://localhost:5000/api
# Next.js
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 1.2 CORS — điều kiện bắt buộc

Backend chỉ cho phép các origin đã khai báo trong env `CORS_ORIGINS` (phân tách bằng dấu phẩy) và bật `credentials: true`.

> ⚠️ **Origin FE của bạn PHẢI nằm trong `CORS_ORIGINS` của backend.** Nếu không, browser sẽ chặn request. Báo backend thêm origin (vd `http://localhost:3000`) khi phát triển.

Vì backend dùng cookie HTTP-only + `credentials: true`, mọi request từ FE **bắt buộc gửi kèm credentials**:

- `fetch`: thêm `credentials: "include"`
- `axios`: thêm `withCredentials: true`

Thiếu tùy chọn này, cookie đăng nhập sẽ không được gửi/nhận → luôn bị `401`.

---

## 2. Xác thực (Authentication)

### 2.1 Cơ chế

Backend cấp JWT qua **cookie HTTP-only** (JS không đọc được — an toàn hơn localStorage). Có 2 luồng token độc lập:

| Đối tượng | Cookie access (24h) | Cookie refresh (7 ngày) | Prefix API |
|---|---|---|---|
| Khách hàng | `customerAccessToken` | `customerRefreshToken` | `/api/customer` |
| Nhân viên | `internalAccessToken` | `internalRefreshToken` | `/api/internal` |

> Cookie cấu hình `httpOnly: true`, `sameSite: "lax"`, `secure` chỉ bật ở production (HTTPS).
> Ở production, FE và API nên cùng domain (hoặc dùng subdomain) để cookie hoạt động ổn định.

**Không cần tự lưu token.** Chỉ cần bật `withCredentials`/`credentials: "include"`, browser tự đính kèm cookie.

Với **mobile app / Postman** (không có cookie tự động), dùng header thay thế:

```
Authorization: Bearer <accessToken>
```

### 2.2 Cấu hình client (axios)

```js
// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // hoặc process.env.REACT_APP_API_URL
  withCredentials: true,                 // BẮT BUỘC — gửi/nhận cookie
  headers: { "Content-Type": "application/json" },
});

export default api;
```

### 2.3 Luồng đăng nhập khách hàng

```js
// Đăng ký → nhận email xác thực
await api.post("/customer/auth/register", {
  full_name: "Nguyễn Văn A",
  username: "user01",
  email: "a@gmail.com",
  password: "matkhau123",
});

// Đăng nhập → backend set cookie tự động
const { data } = await api.post("/customer/auth/login", {
  username: "user01",
  password: "matkhau123",
});
console.log(data.customer); // thông tin user, KHÔNG có token (nằm trong cookie)

// Gọi API cần auth — không cần thêm gì, cookie tự gửi
const me = await api.get("/customer/profile/me");

// Đăng xuất → xóa cookie
await api.post("/customer/auth/logout");
```

Đăng nhập nhân viên tương tự với prefix `/internal/auth/login`.

### 2.4 Tự động refresh token khi hết hạn (interceptor)

Access token hết hạn sau 24h → API trả `401`. Dùng interceptor gọi `/refresh-token` một lần rồi thử lại request:

```js
// src/api/client.js (bổ sung)
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original.url?.includes("/auth/");

    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        // gộp nhiều request 401 cùng lúc vào 1 lần refresh
        refreshing = refreshing || api.post("/customer/auth/refresh-token");
        await refreshing;
        refreshing = null;
        return api(original); // thử lại request gốc
      } catch (e) {
        refreshing = null;
        // refresh thất bại → chuyển về trang đăng nhập
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
```

> Đổi `/customer/auth/refresh-token` thành `/internal/auth/refresh-token` cho app nhân viên.

### 2.5 Các bước ràng buộc trước khi dùng chức năng nhạy cảm

Một số endpoint yêu cầu điều kiện bổ sung, FE cần xử lý theo thứ tự:

1. **Xác thực email** (`requireVerifiedEmail`): sau đăng ký, user bấm link trong email → FE gọi `GET/POST /customer/auth/verify-email?token=...`. Trước khi verify, các thao tác như cập nhật hồ sơ, đặt bàn, thanh toán sẽ bị `403`.
2. **Thiết lập PIN thanh toán** (`requirePaymentPin`): gọi `POST /customer/profile/setup-pin` với `{ pin }` (6 số). Bắt buộc trước khi xem ví, xác nhận thanh toán QR.

FE nên đọc `GET /customer/profile/me` để biết trạng thái (đã verify email chưa, đã có PIN chưa) và điều hướng người dùng hoàn tất.

---

## 3. Xử lý response & lỗi

### 3.1 Định dạng lỗi chuẩn

Mọi lỗi trả về JSON: `{ "message": "Mô tả lỗi" }`

```js
try {
  await api.post("/customer/reservations", payload);
} catch (err) {
  const msg = err.response?.data?.message || "Có lỗi xảy ra";
  toast.error(msg); // hiển thị đúng thông báo từ backend
}
```

### 3.2 Bảng mã lỗi

| Status | Ý nghĩa | Cách xử lý ở FE |
|---|---|---|
| 400 | Dữ liệu sai (Zod validate) | Hiển thị lỗi form, kiểm tra lại body |
| 401 | Chưa/hết đăng nhập | Chạy refresh, hoặc chuyển về login |
| 403 | Không đủ quyền / chưa verify email / chưa có PIN | Điều hướng hoàn tất điều kiện, hoặc ẩn chức năng |
| 404 | Không tìm thấy | Trang not found / thông báo |
| 409 | Trùng dữ liệu (username, mã...) | Báo người dùng đổi giá trị |
| 429 | Vượt rate limit | Yêu cầu thử lại sau ít phút |
| 500 | Lỗi hệ thống | Thông báo chung, log lại |

### 3.3 Rate limit

Backend giới hạn số request (nghiêm ngặt hơn với endpoint auth). Khi nhận `429`, không nên retry liên tục — chờ và báo người dùng.

---

## 4. Phân quyền theo vai trò (app nhân viên)

Các endpoint `/internal/*` kiểm tra role của nhân viên. FE nên đọc role từ response đăng nhập / `me` và **ẩn/hiện UI tương ứng** để tránh gọi API bị `403`.

| Role | Chức năng chính hiển thị |
|---|---|
| `SUPER_ADMIN` / `COMPANY_ADMIN` | Toàn bộ: quản trị, báo cáo, cấu hình |
| `BRANCH_MANAGER` | Đơn hàng, kho, nhân sự, báo cáo trong chi nhánh |
| `RECEPTIONIST` | Đặt bàn, check-in, quản lý bàn |
| `WAITER` | Order, trạng thái bàn |
| `CASHIER` | Thanh toán, hóa đơn |
| `KITCHEN` | Hàng chờ bếp, trạng thái nấu, tồn kho |

> Lưu ý: ẩn UI chỉ để trải nghiệm; backend vẫn là nơi chốt quyền cuối cùng.

---

## 5. Các luồng nghiệp vụ mẫu

### 5.1 Hiển thị menu công khai (không cần đăng nhập)

```js
const { data: companies } = await api.get("/public/companies");
const companyId = companies[0].id;
const menu = await api.get(`/public/companies/${companyId}/menu`);
const combos = await api.get(`/public/companies/${companyId}/combos`);
```

### 5.2 Khách đặt bàn kèm đặt món trước

```js
await api.post("/customer/reservations", {
  branch_id: 1,
  reservation_date: "2026-07-10",   // YYYY-MM-DD
  reservation_time: "19:00",         // HH:mm
  guest_count: 4,
  customer_phone: "0901234567",
  note: "Gần cửa sổ",
  items: [                           // món đặt trước (tùy chọn)
    { menu_item_id: 10, quantity: 2 },
    { menu_item_id: 15, quantity: 1 },
  ],
});

const list = await api.get("/customer/reservations");        // đặt bàn của tôi
await api.delete(`/customer/reservations/${id}`);            // hủy
```

### 5.3 Nạp ví bằng PayOS

```js
// yêu cầu: đã verify email + đã thiết lập PIN
const { data } = await api.post("/customer/payment/create", {
  amount: 200000,
  description: "Nạp ví",
  returnUrl: "https://fe-domain/wallet/success",
  cancelUrl: "https://fe-domain/wallet/cancel",
});
window.location.href = data.checkoutUrl; // chuyển tới trang thanh toán PayOS
```

Sau khi thanh toán, PayOS gọi webhook backend cập nhật ví. FE ở `returnUrl` chỉ cần load lại số dư/`/customer/profile/transactions`.

### 5.4 Thanh toán QR tại quầy (khách xác nhận trên app)

```js
// App khách: sinh token QR để nhân viên quét
const { data } = await api.post("/customer/qr-payment/generate-token");
// hiển thị data dưới dạng mã QR

// Khi có yêu cầu thanh toán chờ:
const pending = await api.get("/customer/qr-payment/pending");
await api.post("/customer/qr-payment/confirm", {
  requestId: pending.data.id,
  action: "ACCEPT",   // hoặc "REJECT"
  pin: "123456",
});
```

### 5.5 Nhân viên tạo order tại bàn

```js
// app nhân viên (đã đăng nhập /internal/auth/login)
await api.post("/internal/orders", {
  table_id: 5,
  order_items: [
    { menu_item_id: 10, quantity: 2, note: "Không cay" },
    { menu_item_id: 12, quantity: 1 },
  ],
});

const active = await api.get("/internal/orders/table/5/active"); // order đang mở
const queue = await api.get("/internal/orders/kitchen/queue");   // bếp: hàng chờ
```

### 5.6 Thanh toán tại bàn (cashier)

```js
// (tùy chọn) áp voucher trước
await api.post("/internal/checkout/validate-voucher", {
  code: "GIAM10",
  orderTotal: 500000,
  tableId: 5,
});

// tạo hóa đơn
await api.post("/internal/checkout/create-invoice", {
  tableId: 5,
  paymentMethod: "CASH", // CASH | TRANSFER | APP
  customerId: 42,        // nếu khách có tài khoản (tích điểm)
});
```

---

## 6. Checklist tích hợp nhanh

- [ ] Cấu hình `baseURL` từ biến môi trường
- [ ] Bật `withCredentials: true` (axios) / `credentials: "include"` (fetch) trên **mọi** request
- [ ] Yêu cầu backend thêm origin FE vào `CORS_ORIGINS`
- [ ] Thêm interceptor tự refresh token khi gặp `401`
- [ ] Đọc `/profile/me` để kiểm tra trạng thái verify email & PIN
- [ ] Ẩn/hiện UI theo role (app nhân viên)
- [ ] Hiển thị `error.response.data.message` cho người dùng
- [ ] Xử lý `429` (rate limit): không retry dồn dập

---

## 7. Ví dụ với `fetch` (không dùng axios)

```js
async function login(username, password) {
  const res = await fetch(`${API_URL}/customer/auth/login`, {
    method: "POST",
    credentials: "include",                       // BẮT BUỘC
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message);
  }
  return res.json();
}
```

---

## 8. React hooks với TanStack Query

[TanStack Query](https://tanstack.com/query) (React Query) quản lý cache, loading/error, và refetch giúp code gọi API gọn hơn nhiều. Dùng client axios ở [mục 2.2](#22-cấu-hình-client-axios) (đã bật `withCredentials`).

### 8.1 Thiết lập Provider

```jsx
// src/main.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // đừng retry các lỗi 4xx (401/403/404/409) — vô ích
        const status = error?.response?.status;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000, // dữ liệu "tươi" trong 30s, tránh refetch thừa
    },
  },
});

export function AppProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

### 8.2 Hàm helper tách lỗi

```js
// src/api/helpers.js
// Chuẩn hóa message lỗi từ backend ({ message }) để component hiển thị
export function getErrorMessage(error) {
  return error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
}
```

### 8.3 Hook xác thực (`useAuth`)

```jsx
// src/hooks/useAuth.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

// Lấy thông tin user hiện tại — dùng cookie, không cần truyền token
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/customer/profile/me")).data,
    retry: false,        // chưa đăng nhập → 401, không cần retry
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credentials) =>
      (await api.post("/customer/auth/login", credentials)).data,
    onSuccess: (data) => {
      // đưa thẳng user vào cache "me", không cần gọi lại
      qc.setQueryData(["me"], data.customer);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/customer/auth/logout")).data,
    onSuccess: () => qc.clear(), // xóa toàn bộ cache khi đăng xuất
  });
}
```

Dùng trong component:

```jsx
import { useLogin } from "../hooks/useAuth";
import { getErrorMessage } from "../api/helpers";

function LoginForm() {
  const login = useLogin();

  const onSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login.mutate({
      username: form.get("username"),
      password: form.get("password"),
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="username" />
      <input name="password" type="password" />
      <button disabled={login.isPending}>
        {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
      {login.isError && <p className="error">{getErrorMessage(login.error)}</p>}
    </form>
  );
}
```

### 8.4 Query dữ liệu (menu, đặt bàn)

```jsx
// src/hooks/useMenu.js
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

// Menu công khai — không cần đăng nhập
export function useMenu(companyId) {
  return useQuery({
    queryKey: ["menu", companyId],
    queryFn: async () => (await api.get(`/public/companies/${companyId}/menu`)).data,
    enabled: !!companyId,   // chỉ chạy khi đã có companyId
    staleTime: 10 * 60_000, // menu ít đổi → cache lâu
  });
}

// Danh sách đặt bàn của tôi — cần đăng nhập
export function useMyReservations() {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: async () => (await api.get("/customer/reservations")).data,
  });
}
```

```jsx
function MenuList({ companyId }) {
  const { data, isLoading, isError, error } = useMenu(companyId);

  if (isLoading) return <p>Đang tải menu...</p>;
  if (isError) return <p>{getErrorMessage(error)}</p>;

  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>{item.name} — {item.price}đ</li>
      ))}
    </ul>
  );
}
```

### 8.5 Mutation + tự động làm mới danh sách

Sau khi tạo/hủy đặt bàn, dùng `invalidateQueries` để TanStack Query tự refetch danh sách:

```jsx
// src/hooks/useReservationActions.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post("/customer/reservations", payload)).data,
    onSuccess: () => {
      // đánh dấu danh sách cũ → tự động tải lại
      qc.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/customer/reservations/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
```

```jsx
function BookingButton() {
  const create = useCreateReservation();

  return (
    <button
      disabled={create.isPending}
      onClick={() =>
        create.mutate(
          {
            branch_id: 1,
            reservation_date: "2026-07-10",
            reservation_time: "19:00",
            guest_count: 4,
            items: [{ menu_item_id: 10, quantity: 2 }],
          },
          {
            onSuccess: () => toast.success("Đặt bàn thành công"),
            onError: (e) => toast.error(getErrorMessage(e)),
          }
        )
      }
    >
      Đặt bàn
    </button>
  );
}
```

### 8.6 Bảo vệ route theo trạng thái đăng nhập

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useMe } from "../hooks/useAuth";

export function ProtectedRoute({ children }) {
  const { data: user, isLoading, isError } = useMe();

  if (isLoading) return <p>Đang tải...</p>;
  if (isError || !user) return <Navigate to="/login" replace />;
  return children;
}
```

> **Lưu ý:** interceptor refresh token ở [mục 2.4](#24-tự-động-refresh-token-khi-hết-hạn-interceptor) vẫn hoạt động ngầm dưới axios, nên các hook trên tự động xử lý token hết hạn mà không cần thêm code. Với **app nhân viên**, đổi các path `/customer/*` thành `/internal/*` tương ứng.
