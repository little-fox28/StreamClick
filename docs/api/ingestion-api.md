# Đặc tả Giao diện Lập trình Ứng dụng Tiếp nhận Sự kiện (Ingestion API Reference)

Tài liệu này mô tả chi tiết hợp đồng giao tiếp HTTP của dịch vụ **StreamClick Ingestion API** được hiện thực hóa tại `api/main.py` trên nền tảng **FastAPI**.

---

## 1. Thông tin Chung (Service Metadata)

* **Service Title:** `StreamClick Ingestion API` (`v1.0.0`)
* **Base URL (Local Default):** `http://localhost:8000`
* **Tài liệu Tương tác Tự động:**
  * **Swagger UI (OpenAPI):** `http://localhost:8000/docs`
  * **ReDoc:** `http://localhost:8000/redoc`
* **Chính sách CORS (`CORSMiddleware`):** Cho phép mọi nguồn gốc (`allow_origins=["*"]`), mọi phương thức (`allow_methods=["*"]`), mọi header (`allow_headers=["*"]`) và bật `allow_credentials=True` để phục vụ các yêu cầu `fetch()` / `navigator.sendBeacon()` từ trình duyệt.
* **Xác thực (As-Is):** Không yêu cầu xác thực ở môi trường phát triển cục bộ.
* **Quản lý Vòng đời (`lifespan`):** Khởi tạo kết nối đơn nhất `RedpandaPublisher` khi ứng dụng bật và tự động gọi `flush()` + `close()` an toàn khi nhận tín hiệu dừng tiến trình.

---

## 2. Danh mục Endpoints

### 2.1. `POST /track` — Tiếp nhận Sự kiện Clickstream (Đơn lẻ hoặc Theo Lô)

Tiếp nhận một đối tượng sự kiện đơn lẻ hoặc một danh sách các sự kiện, xác thực theo hợp đồng `ClickstreamEvent` và đẩy bất đồng bộ vào topic cấu hình trong `KAFKA_TOPIC_CLICKSTREAM`.

* **Content-Type:** `application/json`
* **Request Body Schema:** `Union[ClickstreamEvent, List[ClickstreamEvent]]`
* **Cơ chế Định tuyến Partition:** Với mỗi sự kiện trong request, API trích xuất `partition_key = event.user_id or event.anonymous_id` và truyền xuống `publisher.publish()`.

#### Ví dụ 1: Gửi một sự kiện đơn lẻ (tương tự Simulator CLI)

```bash
curl -i -X POST "http://localhost:8000/track" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "usr_1042",
    "anonymous_id": "anon_usr_1042",
    "session_id": "sess_9f8e7d6c5b4a",
    "event_type": "product_view",
    "page_url": "https://shop.streamclick.com/products/JERSEY_ARS_HOME_26",
    "referrer_url": "https://www.google.com/search?q=football+jersey",
    "product_id": "JERSEY_ARS_HOME_26",
    "price": 89.99,
    "device": {
      "os": "Windows",
      "browser": "Chrome",
      "user_agent": "Mozilla/5.0"
    },
    "properties": {
      "category": "Premier League",
      "on_sale": true
    }
  }'
```

#### Ví dụ 2: Gửi lô nhiều sự kiện trong một Request (tương tự Browser Tracking SDK)

```bash
curl -i -X POST "http://localhost:8000/track" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "anonymous_id": "anon_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "session_id": "sess_a1b2c3d4e5f6",
      "event_type": "product_view",
      "page_url": "http://localhost:5173/product-detail/real-madrid-home",
      "product_id": "101",
      "price": 75.0
    },
    {
      "anonymous_id": "anon_6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "session_id": "sess_a1b2c3d4e5f6",
      "event_type": "add_to_cart",
      "page_url": "http://localhost:5173/product-detail/real-madrid-home",
      "product_id": "101",
      "price": 85.0,
      "properties": {
        "size": "L",
        "quantity": 1,
        "custom_name": "BELLINGHAM",
        "custom_number": "5"
      }
    }
  ]'
```

#### Phản hồi Thành công (`HTTP 202 Accepted`)

Nếu payload không truyền sẵn `event_id` hoặc `timestamp`, hệ thống tự động sinh UUIDv4 và thời gian UTC hiện tại trước khi phản hồi:

```json
{
  "status": "success",
  "count": 2,
  "event_ids": [
    "3f7d8b2a-4c11-4e92-8a55-91f20e19a011",
    "9c41a0d5-82b3-41e7-b0c1-44e19c3d8274"
  ]
}
```

---

### 2.2. `GET /health` — Kiểm tra Trạng thái Dịch vụ (Health Probe)

Cung cấp điểm kiểm tra sức khỏe tiến trình cho bộ cân bằng tải hoặc kịch bản kiểm thử tích hợp (`test_pipeline_modules.py -m api_health`).

#### Yêu cầu mẫu

```bash
curl -s "http://localhost:8000/health"
```

#### Phản hồi Thành công (`HTTP 200 OK`)

```json
{
  "status": "healthy",
  "service": "streamclick-ingestion-api",
  "broker": "kafka"
}
```

*(Ghi chú: `GET /health` phản ánh cấu hình `settings.BROKER_TYPE` và trạng thái sống của FastAPI event loop; endpoint này không thực hiện truy vấn mạng trực tiếp xuống Redpanda).*

---

## 3. Ma trận Mã Trạng thái & Xử lý Lỗi (Status & Error Codes)

| Mã HTTP | Tình huống Kích hoạt | Cấu trúc Phản hồi Mẫu | Hướng xử lý Khuyến nghị cho Client |
| :---: | :--- | :--- | :--- |
| **`200 OK`** | Gọi `GET /health` thành công. | `{"status": "healthy", "service": "streamclick-ingestion-api", "broker": "kafka"}` | Không cần xử lý thêm. |
| **`202 Accepted`** | Tất cả sự kiện trong `POST /track` đã vượt qua xác thực schema và vào bộ đệm Producer. | `{"status": "success", "count": 1, "event_ids": ["..."]}` | Xóa hàng đợi sự kiện phía client. |
| **`422 Unprocessable Entity`** | Thiếu trường bắt buộc (`anonymous_id`, `session_id`, `event_type`, `page_url`), sai giá trị Enum `EventType`, hoặc sai định dạng JSON. | `{"detail": [{"type": "enum", "loc": ["body", "ClickstreamEvent", "event_type"], "msg": "Input should be 'view_item', 'add_to_cart', 'checkout', 'purchase' or 'product_view'"}]}` | **Không thử lại (Non-retryable):** Kiểm tra lại logic ánh xạ payload ở phía client. |
| **`503 Service Unavailable`** | `publisher.publish()` trả về `False` (không thể khởi tạo Producer tới Redpanda hoặc bộ đệm vẫn đầy sau khi đã gọi `flush` thử lại). | `{"detail": "Broker ingestion queue is unavailable."}` | **Có thể thử lại (Retryable):** Áp dụng Exponential Backoff (như `SimulationRunner` đã cấu hình tự động cho mã `502, 503, 504`). |

---

## 4. Hành vi Xử lý Mảng Lô Một phần (Partial Batch Behavior)

Trong `api/main.py`, vòng lặp gửi sự kiện duyệt tuần tự qua danh sách `events`:
* Bước xác thực Pydantic diễn ra **trước** khi vào vòng lặp: nếu bất kỳ phần tử nào sai schema, **không có sự kiện nào** trong lô được đẩy vào Broker và API trả về `422`.
* Nếu toàn bộ lô hợp lệ nhưng Broker gặp sự cố ở phần tử thứ `k` khiến `publisher.publish()` trả về `False`, API lập tức dừng vòng lặp và trả về `503 Service Unavailable` (các phần tử từ `0` đến `k-1` đã nằm trong bộ đệm Producer). Client khi retry lô sự kiện cần giữ nguyên `event_id` ban đầu để hạ nguồn khử trùng lặp chính xác.
