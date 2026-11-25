# [ADR-0003] Thực thi Data Contract 4W1H, PII Whitelist & Phản hồi Bất đồng bộ tại Ingestion API

* **Status:** Accepted (Retroactive Baseline)
* **Date:** 2026-10-02
* **Technical Area:** Ingestion API / Data Governance

---

## Context (Bối cảnh & Vấn đề)

Cổng tiếp nhận sự kiện Clickstream mở ra cho trình duyệt web và thiết bị đầu cuối nên thường xuyên đối mặt với ba rủi ro:

1. **Dữ liệu sai lệch cấu trúc (Schema Drift):** Sự kiện thiếu định danh phiên/thiết bị hoặc sai định dạng thời gian sẽ làm gãy luồng tính toán tại Speed Layer và làm bẩn Data Lake.
2. **Rò rỉ thông tin định danh cá nhân (PII Leakage):** Mã phía client có thể vô tình đính kèm email, số điện thoại hoặc trường nhạy cảm ngoài thiết kế vào root JSON payload.
3. **Nghẽn mạng từ phía Client:** Gửi từng sự kiện rời rạc hoặc buộc HTTP request phải chờ xử lý downstream hoàn tất sẽ làm tăng độ trễ phía người dùng.

---

## Decision (Quyết định Thiết kế)

1. **Thiết lập Data Contract chặt chẽ bằng Pydantic V2 (`ClickstreamEvent`):**
   * Chuẩn hóa cấu trúc sự kiện theo mô hình **4W1H** (`anonymous_id`, `session_id`, `user_id`, `timestamp` UTC, `event_type` giới hạn bởi Enum `EventType`, `page_url`, `device`, `product_id`, `price`, `properties`).
   * Cấu hình `ConfigDict(extra="ignore", str_strip_whitespace=True)` ở cả `ClickstreamEvent` và `DeviceContext` để hoạt động theo cơ chế **Whitelist**: tự động cắt bỏ mọi trường lạ chưa được phê duyệt ở cấp độ root/device, trong khi dành riêng trường `properties: Dict[str, Any]` cho dữ liệu nghiệp vụ mở rộng.
2. **Hỗ trợ linh hoạt Single & Batch Payload trên cùng một Endpoint (`POST /track`):**
   * Khai báo kiểu đầu vào `Union[ClickstreamEvent, List[ClickstreamEvent]]` giúp một endpoint duy nhất phục vụ được cả Simulator bắn đơn lẻ lẫn Browser SDK bắn theo mảng gom lô.
3. **Giao tiếp Non-blocking & Bảo toàn thứ tự theo Người dùng:**
   * Đẩy bất đồng bộ vào bộ đệm của `RedpandaPublisher` (`poll(0)`), sử dụng `event.user_id or event.anonymous_id` làm **Partition Key** để định tuyến các sự kiện của cùng một người dùng vào cùng một Kafka partition, và trả ngay mã `HTTP 202 Accepted`.

---

## Consequences (Hệ quả & Đánh đổi)

### Pros (Ưu điểm)
* **Ngăn chặn dữ liệu rác ngay tại biên:** Payload thiếu trường bắt buộc hoặc sai `EventType` bị từ chối tức thì với mã `422 Unprocessable Entity` trước khi chạm tới Redpanda.
* **An toàn quyền riêng tư mặc định:** Mọi thuộc tính ngoài hợp đồng ở cấp ngoài cùng bị lọc bỏ tự động mà không làm lỗi request hợp lệ.
* **Độ trễ phản hồi thấp & Thứ tự sự kiện nhất quán:** Trả về `202 Accepted` ngay khi ghi nhận vào hàng đợi producer và giữ đúng trình tự hành vi của từng khách hàng trên partition.

### Cons & Trade-offs (Nhược điểm & Đánh đổi)
* **Loại bỏ âm thầm trường khai báo nhầm chỗ:** Nếu client truyền nhầm trường mở rộng ở ngoài `properties` (ví dụ truyền `amount` ở root như trong `sdk/tracking/types.ts`), trường đó sẽ bị cắt bỏ mà không báo lỗi cảnh báo cho client.
* **Xác thực toàn phần trên Batch:** Nếu 1 phần tử trong mảng JSON gửi lên `/track` vi phạm schema, toàn bộ HTTP batch đó sẽ bị trả về `422`.

---

## Codebase Evidence (Tham chiếu Mã nguồn)

* `core/schemas/clickstream.py`
* `api/main.py`
* `infrastructure/scripts/test_pipeline_modules.py`
