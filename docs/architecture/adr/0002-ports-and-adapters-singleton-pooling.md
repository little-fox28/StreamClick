# [ADR-0002] Cô lập Hạ tầng qua Ports & Adapters kết hợp Thread-Safe Singleton Pooling

* **Status:** Accepted (Retroactive Baseline)
* **Date:** 2026-10-02
* **Technical Area:** Core Architecture / Portability & Concurrency

---

## Context (Bối cảnh & Vấn đề)

Hệ thống được phát triển và kiểm thử cục bộ trên các công cụ mã nguồn mở tự vận hành (**Redpanda** tương thích Kafka và **MinIO** tương thích S3), nhưng có lộ trình chuyển dịch lên dịch vụ quản lý trên **Google Cloud Platform** (**Cloud Pub/Sub** và **Cloud Storage**). Ngoài ra, dưới tải đồng thời cao trên FastAPI hoặc luồng ghi lô liên tục, việc khởi tạo mới kết nối TCP/HTTP (`confluent_kafka.Producer` hoặc `boto3.client`) trên mỗi thao tác sẽ gây cạn kiệt socket và tăng độ trễ.

---

## Decision (Quyết định Thiết kế)

1. **Định nghĩa Port Interfaces bằng Abstract Base Classes (`abc.ABC`):**
   * `AbstractMessagePublisher` (`core/adapters/broker/base.py`): Chuẩn hóa vòng đời `connect()`, `publish(topic, message, key)`, `flush(timeout)`, và `close()`.
   * `AbstractStorageClient` (`core/adapters/storage/base.py`): Chuẩn hóa `upload_file()`, `upload_bytes()`, `download_file()`, và `list_objects()`.
2. **Triển khai Concrete Adapters theo mẫu Thread-Safe Singleton:**
   * `RedpandaPublisher` (`core/adapters/broker/redpanda.py`) và `MinIOClient` (`core/adapters/storage/minio.py`) đều áp dụng kỹ thuật **Double-Checked Locking** (`__new__` kết hợp `threading.Lock`) để đảm bảo mỗi tiến trình Python chỉ duy trì duy nhất một client instance dùng chung.
   * Cấu hình sẵn Connection Pool & Retry ở tầng Adapter: `MinIOClient` đặt `max_pool_connections=50` và `retries={"max_attempts": 3, "mode": "adaptive"}`; `RedpandaPublisher` thử kết nối lại tối đa 5 lần khi khởi động và tự gọi `flush()` khi tràn bộ đệm (`BufferError`).
3. **Quản lý cấu hình chuẩn 12-Factor (`core/config.py`):**
   * Nạp toàn bộ thông số môi trường qua `pydantic-settings` (`Settings`), kèm `@model_validator` kiểm tra bắt buộc thông tin xác thực S3 khi chạy chế độ MinIO (`STORAGE_TYPE == "s3"` và có `S3_ENDPOINT_URL`).

---

## Consequences (Hệ quả & Đánh đổi)

### Pros (Ưu điểm)
* **Hiệu năng kết nối ổn định:** Tái sử dụng kết nối TCP/HTTP xuyên suốt vòng đời ứng dụng, loại bỏ chi phí bắt tay kết nối lặp lại trên mỗi HTTP request vào `/track`.
* **Sẵn sàng mở rộng sang Cloud:** Khi bổ sung `PubSubPublisher` hoặc `GCSStorageClient`, chữ ký phương thức của tầng nghiệp vụ gọi vào Port Interface không thay đổi.
* **Fail-Fast khi thiếu cấu hình:** Ứng dụng từ chối khởi động ngay lập tức với thông báo rõ ràng nếu thiếu khóa truy cập MinIO thay vì sinh lỗi ngầm lúc đang chạy.

### Cons & Trade-offs (Nhược điểm & Đánh đổi)
* **Quản lý trạng thái toàn cục trong Kiểm thử:** Mẫu Singleton giữ nguyên `_instance` giữa các bài kiểm thử trong cùng một tiến trình nếu không gọi `close()` để đặt lại `_initialized = False` và `_instance = None`.
* **Điểm nối khởi tạo chưa qua Factory:** Hiện tại `api/main.py` và `batch/datalake_consumer.py` vẫn import trực tiếp lớp cụ thể (`RedpandaPublisher`, `MinIOClient`); cần bổ sung bước khởi tạo qua Factory dựa trên `BROKER_TYPE` và `STORAGE_TYPE` khi chuyển sang GCP.

---

## Codebase Evidence (Tham chiếu Mã nguồn)

* `core/config.py`
* `core/adapters/broker/base.py`
* `core/adapters/broker/redpanda.py`
* `core/adapters/storage/base.py`
* `core/adapters/storage/minio.py`
