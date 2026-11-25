# Tổng quan Kiến trúc Hệ thống (System Overview)

Tài liệu này mô tả kiến trúc hiện hành (**As-Is Architecture**) của **StreamClick** theo khung chuẩn **arc42** và mô hình trực quan hóa **C4 Model**. Mọi cổng mạng, tên container, giao thức và ranh giới module đều được đối chiếu trực tiếp từ mã nguồn trong repository.

---

## 1. Bối cảnh & Mục tiêu Kiến trúc (Introduction & Goals)

**StreamClick** là nền tảng thu thập và phân tích luồng sự kiện Clickstream cho thương mại điện tử. Kiến trúc hệ thống được thiết kế để thỏa mãn ba mục tiêu kỹ thuật cốt lõi:

1. **Tách biệt tải đọc/ghi và độ trễ (Lambda Architecture):** Cung cấp đồng thời số liệu tổng hợp gần thời gian thực (chu kỳ cửa sổ 60 giây) và kho lưu trữ lịch sử định dạng cột (Apache Parquet) phục vụ phân tích OLAP.
2. **Bảo vệ chất lượng dữ liệu ngay từ biên (Schema-on-Write):** Xác thực cấu trúc sự kiện 4W1H, chuẩn hóa kiểu dữ liệu và loại bỏ trường không khai báo trước khi đẩy vào Message Broker.
3. **Độc lập hạ tầng (Infrastructure Portability):** Cô lập logic nghiệp vụ khỏi thư viện giao tiếp Kafka/S3 thông qua tầng trừu tượng **Ports & Adapters** và cấu hình **12-Factor App**.

---

## 2. Sơ đồ Ngữ cảnh Hệ thống — C4 Level 1 (System Context)

Sơ đồ dưới đây thể hiện ranh giới của **StreamClick** và cách các tác nhân bên ngoài tương tác với nền tảng:

```mermaid
flowchart TB
    Shopper["[Person] E-Commerce Shopper (Browser)"]
    Engineer["[Person] Data Engineer / Operator"]
    Analyst["[Person] Data Analyst / BI User"]

    Kaggle["[External System] Kaggle Hub API (CSV Dataset Source)"]

    StreamClick["[Software System] StreamClick Platform (Clickstream Ingestion, Stream Processing & Data Lake)"]

    Shopper -->|"Duyệt sản phẩm & gửi sự kiện HTTP JSON"| StreamClick
    Engineer -->|"Chạy Simulator CLI, giám sát Redpanda & MinIO Console"| StreamClick
    StreamClick -->|"Tải CSV lần đầu qua kagglehub HTTPS"| Kaggle
    Analyst -->|"Truy vấn SQL qua DuckDB / PostgreSQL & xem Grafana"| StreamClick

    style StreamClick fill:#163300,color:#ffffff,stroke:#65cf21,stroke-width:2px
    style Kaggle fill:#f3f4f6,color:#111827,stroke:#9ca3af,stroke-dasharray: 5 5
```

*(Ghi chú: Kết nối tới Kaggle Hub chỉ kích hoạt khi chạy công cụ giả lập mà chưa có sẵn file CSV cục bộ trong `data/raw/`).*

---

## 3. Sơ đồ Thành phần Container — C4 Level 2 (Container Diagram)

Ở cấp độ Container, hệ thống bao gồm các ứng dụng phía client, các tiến trình xử lý Python 3.11 và cụm hạ tầng lưu trữ/broker định nghĩa trong `docker-compose.yml`:

```mermaid
flowchart TB
    subgraph Producers["Client & Replay Producers (Host / Browser)"]
        WebApp["[Container: React 19 + TS SDK] JerseyPlug Storefront (:5173)"]
        SimCLI["[Container: Python CLI] Simulator (simulator.main)"]
    end

    subgraph SystemBoundary["StreamClick Platform (Docker Bridge: streamclick-net)"]
        API["[Container: FastAPI / Uvicorn] ingestion-api (:8000)"]

        Broker["[Container: Redpanda v23.3.14] redpanda (:9092 / :29092 / :9644)"]
        Console["[Container: Redpanda Console v2.5.2] redpanda-console (:8080)"]

        StreamProc["[Container: Python / Quix Streams] stream-processor"]
        BatchProc["[Container: Python / confluent-kafka] batch-consumer"]

        Postgres[("[Container: PostgreSQL 16 Alpine] postgres (:5432)")]
        MinIO[("[Container: MinIO S3] minio (:9000 / :9001)")]

        Grafana["[Container: Grafana] grafana (:3000)"]
    end

    DuckDB["[Container: Python / DuckDB] DuckDB OLAP (analytics/duckdb_olap.py)"]

    WebApp -->|"POST /track (JSON array, fetch / sendBeacon)"| API
    SimCLI -->|"POST /track (Single JSON, pooled Session)"| API
    API -->|"Kafka Protocol (acks=all, snappy)"| Broker
    Console -->|"Kafka Internal (:29092)"| Broker

    Broker -->|"Consume (streamclick-realtime-group)"| StreamProc
    StreamProc -->|"psycopg2 UPSERT (:5432)"| Postgres
    Grafana -->|"SQL Query (:5432)"| Postgres

    Broker -->|"Poll manual-commit (streamclick-datalake-group)"| BatchProc
    BatchProc -->|"boto3 S3 PutObject (:9000)"| MinIO
    DuckDB -->|"S3 HTTP GET Parquet (:9000)"| MinIO
```

---

## 4. Ranh giới Trừu tượng Ports & Adapters (Component Boundaries)

Module `core/` đóng vai trò hạt nhân dùng chung giữa `api/`, `batch/`, `streaming/` và `simulator/`. Logic nghiệp vụ được tách khỏi các thư viện giao tiếp ngoại vi thông qua hai Port Interface:

```mermaid
classDiagram
    class Settings {
        +str APP_ENV
        +str BROKER_TYPE
        +str STORAGE_TYPE
        +validate_s3_credentials()
    }

    class ClickstreamEvent {
        +str event_id
        +datetime timestamp
        +Optional~str~ user_id
        +str anonymous_id
        +str session_id
        +EventType event_type
        +to_message_dict() Dict
    }

    class AbstractMessagePublisher {
        <<interface>>
        +connect() None
        +publish(topic, message, key) bool
        +flush(timeout) None
        +close() None
    }

    class RedpandaPublisher {
        -_instance RedpandaPublisher
        -_producer confluent_kafka.Producer
        +connect() None
        +publish(topic, message, key) bool
        +flush(timeout) None
        +close() None
    }

    class AbstractStorageClient {
        <<interface>>
        +upload_file(local_path, destination_path, bucket_name) bool
        +upload_bytes(data, destination_path, bucket_name) bool
        +download_file(source_path, local_path, bucket_name) bool
        +list_objects(prefix, bucket_name) List~str~
    }

    class MinIOClient {
        -_instance MinIOClient
        -_s3_client boto3.client
        +upload_file(...) bool
        +upload_bytes(...) bool
        +download_file(...) bool
        +list_objects(...) List~str~
        +close() None
    }

    AbstractMessagePublisher <|.. RedpandaPublisher : implements
    AbstractStorageClient <|.. MinIOClient : implements
```

### Đặc tính kỹ thuật tại ranh giới Adapter
* **Message Broker Seam (`core/adapters/broker/`):** `AbstractMessagePublisher` định nghĩa hợp đồng gửi sự kiện kèm `key` phân vùng. `RedpandaPublisher` triển khai **Thread-Safe Singleton** (`threading.Lock`), gom lô `linger.ms=5`, nén `snappy`, đảm bảo độ bền `acks='all'` và tự xả đệm khi gặp `BufferError`.
* **Object Storage Seam (`core/adapters/storage/`):** `AbstractStorageClient` định nghĩa phương thức `upload_bytes()` truyền thẳng byte buffer từ RAM. `MinIOClient` quản lý `boto3` connection pool (`max_pool_connections=50`), tự động thử lại (`mode="adaptive"`, tối đa 3 lần) và tự kiểm tra/khởi tạo bucket khi khởi động (`_ensure_bucket_exists`).
* **Lưu ý hiện trạng (As-Is Coupling):** Dù interface đã tách biệt sạch sẽ, `api/main.py` hiện đang khởi tạo trực tiếp `RedpandaPublisher` trong hàm `lifespan`, và `batch/datalake_consumer.py` khởi tạo trực tiếp `MinIOClient` + `confluent_kafka.Consumer`. Chi tiết điểm nối này được ghi nhận tại [GCP Readiness Baseline](../migration/gcp-readiness-baseline.md).

---

## 5. Luồng Xử lý Sự kiện Đầu-Cuối (End-to-End Sequence Flow)

Sơ đồ tuần tự dưới đây mô tả vòng đời hoàn chỉnh của một sự kiện từ lúc phát sinh trên trình duyệt đến khi xuất hiện ở cả hai nhánh Speed Layer và Batch Layer:

```mermaid
sequenceDiagram
    autonumber
    actor User as Shopper (Browser)
    participant SDK as Tracking SDK (EventTransport)
    participant API as FastAPI (/track)
    participant RP as Redpanda (events.clickstream.raw)
    participant Quix as Quix Streams (Speed Layer)
    participant PG as PostgreSQL (Serving DB)
    participant Batch as DataLakeConsumer (Batch Layer)
    participant S3 as MinIO (Parquet Data Lake)
    participant Duck as DuckDB (OLAP)

    User->>SDK: Xem sản phẩm / Thêm giỏ hàng (trackEvent)
    SDK->>SDK: Gắn UUIDv4, SessionID (30m TTL), DeviceContext vào RAM queue

    alt Đủ BATCH_MAX_SIZE (10) hoặc chu kỳ 3000ms
        SDK->>API: POST /track (JSON Array, fetch keepalive)
    else Đóng tab / ẩn trang (visibilitychange, beforeunload, pagehide)
        SDK->>API: POST /track (Blob JSON via navigator.sendBeacon)
    end

    API->>API: Xác thực Pydantic ClickstreamEvent & strip extra fields
    loop Từng sự kiện trong payload
        API->>RP: produce(topic, value=JSON, key=user_id || anonymous_id)
    end
    API-->>SDK: HTTP 202 Accepted (count, event_ids)

    par Nhánh Speed Layer (Near Real-Time)
        RP->>Quix: Consume message (group: streamclick-realtime-group)
        Quix->>Quix: Chuẩn hóa product_id ("PROD_GENERAL" nếu rỗng)
        Quix->>Quix: Cập nhật bộ đếm trong 60s Tumbling Window
        Quix->>PG: INSERT ... ON CONFLICT (event_type, window_end, product_id) DO UPDATE
    and Nhánh Batch Layer (Historical Data Lake)
        RP->>Batch: poll(1.0s) với enable.auto.commit=False
        Batch->>Batch: Tích lũy vào RAM buffer
        opt Đủ 5000 bản ghi hoặc sau 60s
            Batch->>Batch: Chuyển DataFrame sang PyArrow Parquet (io.BytesIO)
            Batch->>S3: upload_bytes("raw/clickstream/year=.../hour=.../batch_<uuid>.parquet")
            S3-->>Batch: Upload thành công (HTTP 200)
            Batch->>RP: consumer.commit() & xóa RAM buffer
        end
    end

    Duck->>S3: SELECT ... FROM read_parquet(..., hive_partitioning=1)
    S3-->>Duck: Trả về cột & phân vùng Parquet cần thiết
```

---

## 6. Triển khai & Phân bổ Tài nguyên (Deployment & Resource View)

Trong `docker-compose.yml`, hệ thống phân tách nhóm dịch vụ nền tảng chạy mặc định và nhóm container ứng dụng chạy theo Docker Compose Profile `app` (để lập trình viên linh hoạt chạy code trực tiếp bằng `uv run` trên máy host khi debug):

| Container / Service | Docker Profile | Cổng Host : Container | Giới hạn CPU | Giới hạn RAM | Lưu trữ (Volume / State) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `streamclick-redpanda` | *Default* | `9092:9092`, `9644:9644` | `0.50` | `384M` | Ephemeral container fs |
| `streamclick-redpanda-console` | *Default* | `8080:8080` | `0.10` | `64M` | Stateless |
| `streamclick-minio` | *Default* | `9000:9000`, `9001:9001` | `0.25` | `128M` | Named volume `minio_data` |
| `streamclick-postgres` | *Default* | `5432:5432` | `0.25` | `128M` | Named volume `postgres_data` |
| `streamclick-grafana` | *Default* | `3000:3000` | *Không giới hạn* | *Không giới hạn* | Ephemeral container fs |
| `streamclick-ingestion-api` | `app` | `8000:8000` | `0.50` | `192M` | Stateless |
| `streamclick-stream-processor` | `app` | *Internal only* | `0.50` | `192M` | Local state dir (`state/` khi chạy host) |
| `streamclick-batch-consumer` | `app` | *Internal only* | `0.50` | `256M` | Stateless (`io.BytesIO` trên RAM) |

* **Tổng giới hạn tài nguyên khai báo (7 container có limit):** `2.60 CPU cores` và `1,344 MiB (~1.31 GiB) RAM`.
* **Mạng nội bộ:** Toàn bộ container giao tiếp qua mạng bridge `streamclick-net`; Redpanda lắng nghe song song trên `PLAINTEXT://redpanda:29092` (cho nội bộ Docker) và `OUTSIDE://localhost:9092` (cho tiến trình chạy trên máy host).
