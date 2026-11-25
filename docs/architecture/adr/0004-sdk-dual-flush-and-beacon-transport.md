# [ADR-0004] Gom lô Dual-Flush, Quản lý Phiên Trượt & Beacon API trên Tracking SDK

* **Status:** Accepted (Retroactive Baseline)
* **Date:** 2026-10-02
* **Technical Area:** Client SDK / Frontend Telemetry

---

## Context (Bối cảnh & Vấn đề)

Trên ứng dụng storefront thương mại điện tử (`frontend/` — *JerseyPlug*), việc gửi ngay một HTTP request mỗi khi người dùng xem sản phẩm hoặc thao tác giỏ hàng sẽ tạo ra lượng kết nối dư thừa lớn. Nghiêm trọng hơn, các sự kiện quan trọng cuối phiên thường xảy ra ngay trước khi người dùng chuyển trang, ẩn ứng dụng trên trình duyệt di động hoặc đóng tab — thời điểm mà các lời gọi `fetch()` thông thường dễ bị trình duyệt hủy ngang làm thất thoát dữ liệu.

---

## Decision (Quyết định Thiết kế)

Xây dựng module **TypeScript Tracking SDK** độc lập (`sdk/tracking/`) theo mẫu **Facade & Singleton** (`TrackingService`), gồm ba cơ chế cốt lõi:

1. **Dual-Flush In-Memory Queue (`EventTransport`):**
   * Tích lũy sự kiện vào mảng bộ nhớ và tự động gửi mảng JSON tới `POST /track` qua `fetch(..., { keepalive: true })` ngay khi chạm ngưỡng số lượng **`BATCH_MAX_SIZE = 10`** hoặc theo chu kỳ định thời **`FLUSH_INTERVAL_MS = 3000`** (3 giây).
   * Sao chụp nguyên tử (`const batchToSend = [...this.eventQueue]; this.eventQueue = []`) trước khi thực hiện I/O mạng để tránh xung đột ghi đè (race condition).
2. **Xả hàng đợi khẩn cấp bằng Beacon API (`flushWithBeacon`):**
   * Đăng ký lắng nghe các sự kiện vòng đời trang gồm `document.visibilitychange` (`hidden`), `window.beforeunload` và `window.pagehide` (hỗ trợ Mobile Safari).
   * Khi kích hoạt, đóng gói toàn bộ sự kiện còn tồn thành `Blob` (`application/json`) và chuyển giao cho trình duyệt gửi ngầm qua `navigator.sendBeacon()` (có fallback về `fetch` kèm `keepalive: true`).
3. **Định danh Bền vững & Sliding-Window Session (`IdentityManager`):**
   * Lưu trữ `anon_<uuid>` bền vững trong `localStorage` (`streamclick_user_id`), hỗ trợ nâng cấp lên định danh thật qua `setUserId()`, và tự động gia hạn hoặc cấp mới `sess_<12-hex>` theo ngưỡng nhàn rỗi **30 phút** (`SESSION_IDLE_TIMEOUT_MS = 1800000`).

---

## Consequences (Hệ quả & Đánh đổi)

### Pros (Ưu điểm)
* **Giảm tải kết nối mạng:** Gom tối đa 10 sự kiện vào một HTTP POST duy nhất, tận dụng tối đa khả năng nhận mảng `List[ClickstreamEvent]` của FastAPI.
* **Chống mất sự kiện cuối phiên:** `navigator.sendBeacon` và cờ `keepalive: true` giúp gói tin tiếp tục được gửi đi ngay cả khi DOM của trang đã bị dỡ bỏ.
* **Không chặn luồng hiển thị UI:** Mọi lỗi mạng hoặc lỗi `localStorage` (ví dụ chế độ ẩn danh khóa lưu trữ) đều được bắt gọn và xử lý dự phòng an toàn mà không làm văng ngoại lệ lên ứng dụng React.

### Cons & Trade-offs (Nhược điểm & Đánh đổi)
* **Độ trễ đệm phía Client:** Sự kiện lẻ tẻ có thể nằm trong hàng đợi trình duyệt tối đa 3 giây trước khi được đẩy lên server.
* **Ưu tiên At-Most-Once ở biên trình duyệt:** Để tránh phình bộ nhớ hoặc lặp vô hạn trên máy người dùng, hàng đợi được làm rỗng ngay khi bắn request và không lưu xuống IndexedDB để thử lại nếu mất kết nối mạng hoàn toàn.

---

## Codebase Evidence (Tham chiếu Mã nguồn)

* `sdk/tracking/config.ts`
* `sdk/tracking/transport.ts`
* `sdk/tracking/tracker.ts`
* `sdk/tracking/identity.ts`
* `frontend/src/App.jsx`
* `frontend/src/pages/ProductDetailPage.jsx`
