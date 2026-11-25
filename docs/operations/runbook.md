# Cẩm nang Vận hành Hệ thống (Operations Runbook)

Tài liệu này hướng dẫn quy trình thiết lập môi trường, bảng tham chiếu đầy đủ biến môi trường, các chế độ khởi chạy hạ tầng cục bộ, công cụ phát tải giả lập và ma trận chẩn đoán sự cố cho **StreamClick**.

---

## 1. Yêu cầu Công cụ (Prerequisites)

| Công cụ | Phiên bản Yêu cầu | Mục đích Sử dụng | Lệnh Kiểm tra |
| :--- | :--- | :--- | :--- |
| **Docker & Docker Compose** | Docker 24+ / Compose v2+ | Khởi chạy Redpanda, MinIO, PostgreSQL, Grafana và các app container | `docker compose version` |
| **Python** | `>= 3.10` (Dockerfile dùng `3.11`) | Chạy API, Stream Processor, Batch Consumer, DuckDB và Simulator | `python --version` |
| **uv** | `>= 0.4` | Quản lý môi trường ảo `.venv` và khóa gói `uv.lock` tốc độ cao | `uv --version` |
| **Node.js & pnpm** *(Tùy chọn)* | Node 20+ / pnpm 9+ | Chỉ cần khi chạy giao diện storefront `frontend/` (*JerseyPlug*) | `pnpm --version` |

---

## 2. Bảng Tham chiếu Biến Môi trường (Environment Variables Reference)

### 2.1. Cấu hình Backend & Data Pipeline (`.env` — Định nghĩa tại `core/config.py`)

> **Cảnh báo Quan trọng (Fail-Fast):** Lớp `Settings` khởi tạo ngay khi import `core.config`. Các biến đánh dấu **Bắt buộc = Có** không có giá trị mặc định trong code; nếu bỏ trống hoặc thiếu trong `.env`, mọi module Python sẽ báo lỗi `ValidationError` ngay lập tức.

| Tên Biến | Kiểu | Mặc định trong Code | Bắt buộc | Giá trị Khuyến nghị Local (Host Mode) | Mô tả Chức năng |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `APP_ENV` | `str` | `"development"` | Không | `development` | Định danh môi trường thực thi. |
| `APP_NAME` | `str` | `"StreamClick"` | Không | `StreamClick` | Tên ứng dụng chuẩn (được kiểm tra bởi unit test `config`). |
| `LOG_LEVEL` | `str` | `"INFO"` | Không | `INFO` | Cấp độ ghi log hệ thống (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `API_HOST` | `str` | `"0.0.0.0"` | Không | `0.0.0.0` | Địa chỉ IP bind cho FastAPI server. |
| `API_PORT` | `int` | `8000` | Không | `8000` | Cổng lắng nghe HTTP của Ingestion API. |
| `BROKER_TYPE` | `str` | `"kafka"` | Không | `kafka` | Loại Message Broker (`kafka` hoặc `pubsub`). |
| `KAFKA_BOOTSTRAP_SERVERS` | `str` | — | **Có** | `localhost:9092` *(Container tự ghi đè thành `redpanda:29092`)* | Địa chỉ kết nối Redpanda/Kafka broker. |
| `KAFKA_TOPIC_CLICKSTREAM` | `str` | — | **Có** | `events.clickstream.raw` | Tên topic chính chứa sự kiện Clickstream thô. |
| `KAFKA_CONSUMER_GROUP` | `str` | — | **Có** | `streamclick-consumer-group` | Nhóm consumer cấu hình chung *(lưu ý: `processor.py` dùng `streamclick-realtime-group` và `datalake_consumer.py` dùng `streamclick-datalake-group`)*. |
| `STORAGE_TYPE` | `str` | `"s3"` | Không | `s3` | Loại Object Storage (`s3` hoặc `gcs`). |
| `S3_ENDPOINT_URL` | `Optional[str]` | `None` | Có *(với MinIO)* | `http://localhost:9000` *(Container tự ghi đè `http://minio:9000`)* | Endpoint S3 API; bắt buộc phải có mặt khi chạy `batch/datalake_consumer.py`. |
| `S3_ACCESS_KEY` | `Optional[str]` | `None` | Có *(khi có `S3_ENDPOINT_URL`)* | `minioadmin` | Access Key của MinIO; được kiểm tra bắt buộc bởi `validate_s3_credentials`. |
| `S3_SECRET_KEY` | `Optional[str]` | `None` | Có *(khi có `S3_ENDPOINT_URL`)* | `minioadmin` | Secret Key của MinIO; được kiểm tra bắt buộc bởi `validate_s3_credentials`. |
| `S3_BUCKET_NAME` | `str` | — | **Có** | `clickstream-lake` | Tên bucket lưu trữ các tệp Parquet trên Data Lake. |
| `S3_REGION_NAME` | `str` | `"us-east-1"` | Không | `us-east-1` | Vùng định danh S3 tiêu chuẩn cho `boto3` và DuckDB. |
| `S3_SECURE` | `bool` | `False` | Không | `false` | Bật/tắt HTTPS TLS khi kết nối S3/MinIO. |
| `POSTGRES_HOST` | `str` | — | **Có** | `localhost` *(Container tự ghi đè thành `postgres`)* | Hostname máy chủ PostgreSQL Serving DB. |
| `POSTGRES_PORT` | `int` | — | **Có** | `5432` | Cổng kết nối PostgreSQL. |
| `POSTGRES_DB` | `str` | — | **Có** | `streamclick` | Tên cơ sở dữ liệu khớp với `docker-compose.yml`. |
| `POSTGRES_USER` | `str` | — | **Có** | `postgres` | Tài khoản đăng nhập PostgreSQL. |
| `POSTGRES_PASSWORD` | `str` | — | **Có** | `postgres_secret_pw` | Mật khẩu khớp với biến `POSTGRES_PASSWORD` của container `postgres`. |
| `GCP_PROJECT_ID` | `Optional[str]` | `None` | Không | *(Để trống ở Local)* | Stub cấu hình sẵn cho lộ trình chuyển đổi GCP. |
| `GCP_PUBSUB_TOPIC` | `Optional[str]` | `None` | Không | *(Để trống ở Local)* | Stub tên Pub/Sub topic cho lộ trình GCP. |
| `GCP_GCS_BUCKET` | `Optional[str]` | `None` | Không | *(Để trống ở Local)* | Stub tên Google Cloud Storage bucket cho lộ trình GCP. |

### 2.2. Biến Môi trường Công cụ Phụ trợ (Simulator & Frontend SDK)

| Tên Biến | Nơi Đọc | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `KAGGLE_API_TOKEN` | `simulator/dataset.py` | `None` | Token xác thực Kaggle Hub để tự động tải dataset nếu chưa có file CSV trong `data/raw/`. |
| `KAGGLE_USERNAME` / `KAGGLE_KEY` | `simulator/dataset.py` | `None` | Phương thức xác thực Kaggle dự phòng nếu không dùng `KAGGLE_API_TOKEN` hoặc `~/.kaggle/kaggle.json`. |
| `VITE_TRACKING_API_URL` | `sdk/tracking/config.ts` | `'http://localhost:8000/track'` | Địa chỉ endpoint Ingestion API mà giao diện React gửi sự kiện tới. |
| `VITE_APP_NAME` | `frontend/.env.example` | `"JerseyPlug"` | Tên hiển thị cửa hàng trên giao diện Frontend. |

---

## 3. Quản lý Vòng đời Hạ tầng Cục bộ (Local Stack Lifecycle)

### Chế độ A — Hybrid Development (Khuyến nghị khi Phát triển & Debug)

Chạy 5 dịch vụ nền tảng (`redpanda`, `redpanda-console`, `minio`, `postgres`, `grafana`) trong Docker và chạy các tiến trình Python trực tiếp trên máy host bằng `uv`:

```bash
# 1. Khởi động cụm hạ tầng nền tảng
docker compose up -d

# 2. Kiểm tra trạng thái Healthy của Redpanda và PostgreSQL
docker compose ps

# 3. Cài đặt dependencies Python vào .venv
uv sync

# 4. Chạy từng tiến trình ứng dụng trên các cửa sổ Terminal riêng:
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
uv run python -m streaming.processor
uv run python batch/datalake_consumer.py
```

### Chế độ B — Full Containerized Stack (`profiles: ["app"]`)

Khởi chạy toàn bộ 8 container (bao gồm `ingestion-api`, `stream-processor`, `batch-consumer`) bên trong mạng Docker `streamclick-net`:

```bash
docker compose --profile app up -d --build
docker compose --profile app ps
docker compose --profile app logs -f ingestion-api stream-processor batch-consumer
```

### Dừng & Xóa sạch Trạng thái (Stop & Full Reset)

```bash
# Dừng các container nhưng giữ nguyên dữ liệu PostgreSQL và MinIO
docker compose --profile app stop

# Xóa toàn bộ container, mạng và dữ liệu trong volumes (minio_data, postgres_data)
docker compose --profile app down -v

# Xóa thêm RocksDB state cục bộ của Quix Streams trên máy host (nếu từng chạy Chế độ A)
rm -rf state/
```

---

## 4. Phát tải Giả lập & Kiểm thử (Simulation & Verification)

### 4.1. Chạy Replay Simulator (`simulator/main.py`)

```bash
# Phát thử 500 sự kiện từ file CSV cục bộ có sẵn với độ trễ 10ms/sự kiện
uv run python -m simulator.main -f "data/raw/ecommerce_clickstream_transactions.csv" -l 500 -d 0.01

# Bắn tải tốc độ cao (tắt delay -d 0) toàn bộ 2,000 dòng đầu để kiểm thử micro-batching
uv run python -m simulator.main -f "data/raw/ecommerce_clickstream_transactions.csv" -l 2000 -d 0
```

| Tham số CLI | Mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| `-f`, `--file` | `None` *(tự tìm/tải trong `data/raw/`)* | Đường dẫn tới tệp CSV cục bộ. |
| `--dataset` | `waqi786/e-commerce-clickstream-and-transaction-dataset` | Định danh bộ dữ liệu trên Kaggle Hub. |
| `-u`, `--url` | `http://localhost:8000/track` | URL đích của Ingestion API. |
| `-c`, `--chunk-size` | `1000` | Số dòng đọc vào bộ nhớ mỗi lần qua generator `islice`. |
| `-d`, `--delay` | `0.01` | Thời gian nghỉ (giây) giữa hai lần gửi HTTP POST. |
| `-l`, `--limit` | `None` *(đọc hết file)* | Tổng số sự kiện tối đa cần phát trước khi dừng. |
| `-t`, `--timeout` | `5.0` | Ngưỡng timeout (giây) cho mỗi HTTP request. |

### 4.2. Chạy Bộ Kiểm thử Hệ thống

```bash
# Liệt kê toàn bộ test modules trong Test Registry
uv run python infrastructure/scripts/test_pipeline_modules.py --list

# Chạy riêng nhóm Unit Tests (không cần bật Docker)
uv run python infrastructure/scripts/test_pipeline_modules.py -c unit

# Chạy toàn bộ Unit + Integration Tests (yêu cầu Redpanda & MinIO đang chạy)
uv run python infrastructure/scripts/test_pipeline_modules.py --all
```

---

## 5. Ma trận Chẩn đoán & Xử lý Sự cố (Troubleshooting Matrix)

| Triệu chứng (Symptom) | Nguyên nhân Khả dĩ (Probable Cause) | Lệnh Kiểm tra (Verification Command) | Cách Khắc phục (Fix) |
| :--- | :--- | :--- | :--- |
| Ứng dụng crash ngay khi khởi động với `pydantic_core._pydantic_core.ValidationError` | Chưa tạo file `.env` hoặc để trống các biến bắt buộc (`KAFKA_*`, `S3_BUCKET_NAME`, `POSTGRES_*`) như trong `.env.example` gốc. | `uv run python -c "from core.config import settings; print(settings)"` | Sao chép `.env.example` sang `.env` và điền đầy đủ giá trị theo **Mục 2.1** của Runbook này. |
| `ValueError: Missing required S3 credentials for MinIO mode` | Đã khai báo `S3_ENDPOINT_URL` nhưng để trống `S3_ACCESS_KEY` hoặc `S3_SECRET_KEY`. | Kiểm tra giá trị `S3_*` trong `.env`. | Đặt `S3_ACCESS_KEY=minioadmin` và `S3_SECRET_KEY=minioadmin` khớp với cấu hình container `minio`. |
| Tiến trình trên máy host báo lỗi không phân giải được tên miền `redpanda:29092` hoặc `postgres` | Đặt hostname nội bộ của mạng Docker vào `.env` trong khi lại chạy Python trực tiếp trên máy host. | Kiểm tra `KAFKA_BOOTSTRAP_SERVERS`, `POSTGRES_HOST`, `S3_ENDPOINT_URL` trong `.env`. | Trong `.env`, luôn đặt `localhost` (`localhost:9092`, `localhost`, `http://localhost:9000`). `docker-compose.yml` đã tự động ghi đè sang hostname nội bộ cho các container. |
| `POST /track` trả về `HTTP 503 Service Unavailable` | Container `redpanda` chưa khởi động xong hoặc đã dừng, khiến `RedpandaPublisher` không thể kết nối. | `docker compose ps redpanda` và `docker exec streamclick-redpanda rpk cluster health` | Khởi động lại broker bằng `docker compose up -d redpanda` và chờ trạng thái chuyển sang `healthy`. |
| Đã bắn 200 sự kiện nhưng chưa thấy file `.parquet` trên MinIO Console (`:9001`) | `DataLakeConsumer` mặc định chờ đủ `batch_size=5000` sự kiện hoặc đủ `flush_interval_seconds=60.0` giây mới xả đệm. | Quan sát log terminal của `batch/datalake_consumer.py` tìm dòng `Triggered flush`. | Chờ tối đa 60 giây, bắn trên 5,000 sự kiện, hoặc nhấn `Ctrl+C` trên `datalake_consumer.py` để kích hoạt khối `finally` xả đệm tức thì. |
| Đã chạy `streaming/processor.py` nhưng bảng `realtime_product_metrics` vẫn trống | `processor.py` dùng `auto_offset_reset="latest"` nên chỉ xử lý sự kiện mới phát sinh **sau** thời điểm processor đã kết nối xong. | `docker exec -it streamclick-postgres psql -U postgres -d streamclick -c "SELECT COUNT(*) FROM realtime_product_metrics;"` | Giữ `streaming.processor` đang chạy, sau đó mở terminal khác chạy lại `simulator.main` để phát sự kiện mới. |
| `uv run pytest` báo lỗi `TypeError` tại `tests/unit/batch/test_batch_consumer.py` | Tệp unit test TDD đời đầu truyền tham số `DataLakeConsumer(consumer=..., storage=...)` khác với chữ ký `__init__` thực tế của `datalake_consumer.py`. | `uv run pytest -v` | Sử dụng bộ kiểm thử chuẩn đang hoạt động `uv run python infrastructure/scripts/test_pipeline_modules.py --all` (trước khi đồng bộ lại test fixture ở giai đoạn refactor). |
