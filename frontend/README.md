# 👕 JerseyPlug - Frontend

Giao diện người dùng hiện đại dành cho hệ thống bán áo đấu bóng đá **JerseyPlug**, được xây dựng với hiệu năng cao và trải nghiệm người dùng mượt mà.

---

## 🚀 Công nghệ sử dụng

Dự án được triển khai dựa trên các công nghệ mới nhất trong hệ sinh thái React:

- **Core:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Tối ưu tốc độ phát triển và build).
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (Hệ thống CSS utility-first mới nhất).
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Thư viện component chất lượng cao, dễ tùy chỉnh).
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Quản lý giỏ hàng và trạng thái ứng dụng nhẹ nhàng).
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest) (Quản lý trạng thái server, caching và đồng bộ dữ liệu).
- **Animation:** [AutoAnimate](https://auto-animate.formkit.com/) & [React CountUp](https://github.com/ctimmerm/react-countup) (Hiệu ứng chuyển động mượt mà).
- **Forms:** [React Hook Form](https://react-hook-form.com/) (Xử lý form hiệu quả).
- **Notifications:** [Sonner](https://sonner.stevenly.me/) (Hệ thống thông báo toast hiện đại).
- **Icons:** [Lucide React](https://lucide.dev/) (Bộ icon vector sắc nét).

---

## 📁 Cấu trúc thư mục `src`

Dự án được tổ chức theo cấu trúc module hóa, dễ dàng bảo trì và mở rộng:

```text
src/
├── assets/             # Hình ảnh (images) và biểu tượng (icons) của dự án.
├── components/
│   ├── ui/             # Các thành phần gốc từ Shadcn UI.
│   ├── common/         # Các component dùng chung (Button, Input, Badge...).
│   └── layout/         # Các thành phần khung trang (Navbar, Footer...).
├── constants/          # Định nghĩa các hằng số, danh mục, cấu hình tĩnh.
├── context/            # Các React Context cung cấp dữ liệu toàn cục.
├── hooks/              # Các React Hooks tùy chỉnh cho logic tái sử dụng.
├── lib/                # Cấu hình các thư viện bên thứ ba (utils.js, queryClient...).
├── pages/              # Các trang chính của ứng dụng (Home, Cart, Product...).
├── services/           # Chứa api.js và các logic gọi API đến WordPress Backend.
├── store/              # Quản lý trạng thái Global (Giỏ hàng, Auth) bằng Zustand.
├── utils/              # Các hàm bổ trợ (Format tiền tệ, xử lý chuỗi...).
├── App.jsx             # Thành phần gốc điều hướng ứng dụng.
├── main.jsx            # Điểm khởi đầu của ứng dụng React.
└── index.css           # Cấu hình Tailwind và Global Styles.
```

## 🛠 Hướng dẫn cài đặt

Để bắt đầu phát triển dự án tại môi trường local, vui lòng làm theo các bước sau:

1. **Cài đặt các thư viện phụ thuộc**
   Dự án sử dụng trình quản lý gói pnpm:

   ```bash
   pnpm install
   ```

2. **Khởi động server phát triển**

   ```bash
   pnpm dev
   ```

   Ứng dụng sẽ chạy tại [http://localhost:5173](http://localhost:5173)

3. **Build production**

   ```bash
   pnpm build
   ```

   Kết quả build sẽ nằm trong thư mục `dist/`.

4. **Preview production build**
   ```bash
   pnpm preview
   ```
   Xem thử bản build production trên local.

---

## 🤝 Đóng góp

1. **UI Components:** Khi cần thêm component mới, hãy ưu tiên kiểm tra trong thư viện Shadcn: npx shadcn@latest add [component-name].

2. **API:** Mọi yêu cầu gửi đến Backend phải được định nghĩa trong thư mục services/ thông qua api.js.

3. **Styling:** Sử dụng tối đa các class của Tailwind CSS v4, hạn chế viết CSS thuần trừ khi thực sự cần thiết.

4. **Icons:** Luôn sử dụng lucide-react để đảm bảo tính đồng nhất về mặt hình ảnh.

## 📝 Ghi chú bảo mật

- **TUYỆT ĐỐI KHÔNG** push file `.env` lên GitHub.
- Mọi thay đổi về cấu trúc biến môi trường mới phải được cập nhật tương ứng vào file mẫu `.env.example`.
