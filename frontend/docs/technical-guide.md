Để xem đẹp hơn:
=>> Chọn File -> Chuột phải -> Open Preview (Ctrl + Shift + V)

# Tài liệu Hướng dẫn Kỹ thuật

Tài liệu này giải thích cách thức hoạt động của chức năng đa ngôn ngữ và cấu hình theme Tailwind CSS trong dự án này.

## 1. Ngữ cảnh Ngôn ngữ (Language Context)

Cốt lõi của việc cài đặt quốc tế hóa (i18n) là `LanguageContext`.

-   **Tệp:** `src/context/LanguageContext.jsx`
-   **Mục đích:** Nó tạo ra một trạng thái toàn cục có thể truy cập từ bất kỳ component nào trong ứng dụng.
-   **Provider:** Component `<LanguageProvider>` bao bọc toàn bộ ứng dụng (trong `App.jsx`) để cung cấp trạng thái toàn cục này.
-   **Các giá trị được cung cấp:**
    -   `currentLang`: Mã ngôn ngữ hiện đang được chọn (ví dụ: 'EN', 'AF', 'VI').
    -   `setCurrentLang`: Một hàm để thay đổi ngôn ngữ hiện tại.
    -   `languages`: Một mảng các đối tượng ngôn ngữ có sẵn.

## 2. Hook `useTranslation`

Để dễ dàng truy cập các bản dịch trong các component, một hook tùy chỉnh `useTranslation` đã được tạo.

-   **Tệp:** `src/hooks/useTranslation.js`
-   **Mục đích:** Hook này trừu tượng hóa logic để lấy bản dịch chính xác dựa trên ngôn ngữ hiện tại.
-   **Chức năng:**
    -   Nó lấy `currentLang` từ `LanguageContext`.
    -   Nó trả về một hàm `t(key)`.

## 3. Tệp dịch thuật

Tất cả các chuỗi văn bản được lưu trữ trong các tệp JSON.

-   **Thư mục:** `src/locales/`
-   **Các tệp:**
    -   `en.json`: Dành cho bản dịch tiếng Anh.
    -   `af.json`: Dành cho bản dịch tiếng Afrikaans.
-   **Cấu trúc:** Mỗi tệp là một đối tượng cặp khóa-giá trị. Khóa là một định danh duy nhất cho một chuỗi và giá trị là văn bản đã được dịch.

## 4. Cách sử dụng

Để thêm hoặc sử dụng bản dịch trong một component:

1.  **Thêm khóa và bản dịch** vào từng tệp JSON trong `src/locales/`.

    *Ví dụ trong `en.json`:*
    ```json
    "myNewText": "This is a new text."
    ```
    *Ví dụ trong `af.json`:*
    ```json
    "myNewText": "Hierdie is 'n nuwe dokument."
    ```

2.  **Sử dụng hook `useTranslation`** trong component của bạn.

    ```jsx
    import { useTranslation } from '../hooks/useTranslation';

    const MyComponent = () => {
      const { t } = useTranslation();

      return (
        <div>
          <h1>{t('myNewText')}</h1>
        </div>
      );
    };
    ```

Hàm `t('myNewText')` sẽ tự động hiển thị chuỗi văn bản chính xác dựa trên ngôn ngữ được người dùng chọn trong `LanguageSwitcher`.

---

## 5. Cấu hình Theme với Tailwind CSS v4

Trong dự án này, Tailwind CSS v4 được sử dụng và cấu hình theme được thực hiện thông qua các biến CSS, khác với các phiên bản trước sử dụng tệp `tailwind.config.js` riêng biệt.

Cài đặt theme chính, đặc biệt là màu sắc, được định nghĩa trong tệp **`src/index.css`**.

### Cách hoạt động:

1.  **Biến CSS:** Bên trong bộ chọn `:root`, các thuộc tính CSS tùy chỉnh (biến) được khai báo cho mỗi màu (ví dụ: `--primary`, `--secondary`, `--accent`). Các biến này lưu giữ các giá trị màu thực tế (ví dụ: mã hex).
2.  **Chỉ thị `@theme`:** Tailwind CSS v4 sử dụng chỉ thị `@theme` trong CSS để ánh xạ các thuộc tính CSS tùy chỉnh này tới tên lớp tiện ích của Tailwind. Điều này cho phép bạn sử dụng các lớp như `bg-primary`, `text-secondary`, `border-accent`, v.v., trực tiếp trong JSX của bạn.

Dưới đây là phần liên quan từ `src/index.css` định nghĩa các màu tùy chỉnh:

```css
@theme inline {
  /* ... các thuộc tính theme khác ... */
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --color-darkBg: var(--darkBg);
  --color-lightBg: var(--lightBg);
  --color-textMain: var(--textMain);
  --color-textSub: var(--textSub);
}

:root {
  /* ... các thuộc tính root khác ... */
  --primary: #163300;
  --secondary: #f2c86c;
  --accent: #65cf21;
  --darkBg: #0f2400;
  --lightBg: #f9fafb;
  --textMain: #111827;
  --textSub: #4b5563;
}
```

### Sử dụng trong các Component:

Sau khi các màu được định nghĩa trong `src/index.css`, bạn có thể sử dụng chúng trực tiếp như các lớp tiện ích của Tailwind trong các component của mình:

```jsx
// Ví dụ: Trong Header.jsx hoặc HomePage.jsx
<header className="bg-primary text-white">...</header>

<span className="bg-secondary text-primary border-primary">...</span>

<h2 className="text-primary">...</h2>

<div className="bg-accent/20">...</div> // Sử dụng biến màu với độ trong suốt
```
Điều này đảm bảo rằng tất cả các tùy chỉnh theme đều được xử lý hiệu quả thông qua Tailwind CSS.
