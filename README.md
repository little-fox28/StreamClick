# StreamClick: E-commerce Clickstream Tracking System

Hệ thống thu thập hành vi người dùng và xử lý dữ liệu Clickstream thương mại điện tử theo kiến trúc **Lambda Architecture**. Dự án được thiết kế theo chuẩn **12-Factor App** & **Cloud-Native**, hoạt động độc lập trên môi trường Self-hosted qua **Docker Compose** và sẵn sàng migrate 1-to-1 lên **Google Cloud Platform (GCP)**.

---

## 1. Architecture Overview (Tổng quan kiến trúc)

StreamClick kết hợp cả hai luồng xử lý thời gian thực (**Speed Layer**) và xử lý theo lô/lưu trữ dài hạn (**Batch Layer**) để tối ưu hóa giữa độ trễ (latency) thấp và độ chính xác (completeness) của dữ liệu.

```
                             +-----------------------+
                             |   Clickstream Events  |
                             |   (Web / Mobile App)  |
                             +-----------+-----------+
                                         |
                                         v HTTP POST /v1/events
                             +-----------------------+
                             |     Ingestion API     |
                             |   (FastAPI - Python)  |
                             +-----------+-----------+
                                         |
                                         v Produce Event
                             +-----------------------+
                             |    Message Broker     |
                             |      (Redpanda)       |
                             +-----+-----------+-----+
                                   |           |
            [ Speed Layer ]        |           |        [ Batch Layer ]
    +------------------------------+           +------------------------------+
    |                                                                         |
    v                                                                         v
+-----------------------+                                         +-----------------------+
|   Stream Processing   |                                         |  Batch Lake Ingestion |
|    (Quix Streams)     |                                         |  (Consumer to Parquet)|
+-----------+-----------+                                         +-----------+-----------+
            |                                                                 |
            v Realtime Aggregations                                           v Partitioned Parquet
+-----------------------+                                         +-----------------------+
|      Serving DB       |                                         |       Data Lake       |
|     (PostgreSQL)      |                                         |     (MinIO - S3)      |
+-----------+-----------+                                         +-----------+-----------+
            |                                                                 |
            v Low-Latency Dashboard Queries                                   v Analytical SQL Queries
+-----------------------+                                         +-----------------------+
|  Real-time Dashboards |                                         |     OLAP Engine       |
|    (Speed Serving)    |                                         |       (DuckDB)        |
+-----------------------+                                         +-----------------------+
```

### Luồng xử lý dữ liệu (Data Flow):
1. **Ingestion Layer (Stateless API):**
   - **FastAPI** tiếp nhận các HTTP POST event payload (Clickstream JSON) với tính năng validate schema tự động qua Pydantic.
   - Sử dụng **Adapter Pattern** (`MessagePublisher`) để đẩy event vào **Redpanda** topic `events.clickstream.raw`.
2. **Speed Layer (Real-time Stream Processing):**
   - **Quix Streams** liên tục consume message từ Redpanda theo Stream Processing model.
   - Thực hiện aggregation (ví dụ: đếm lượt xem sản phẩm theo thời gian thực, rolling windows) và ghi kết quả vào **PostgreSQL** (Serving Database).
3. **Batch Layer (Immutable Raw Data Lake):**
   - Batch Ingestion Service pull dữ liệu theo micro-batch từ Redpanda, chuyển đổi thành định dạng nén cột (**Parquet**).
   - Lưu trữ vào **MinIO** (S3-compatible Object Storage) theo định dạng partition theo thời gian: `raw/events/year=YYYY/month=MM/day=DD/*.parquet`.
4. **Serving & OLAP Layer:**
   - **Speed Queries:** Dashboard thời gian thực truy vấn trực tiếp từ **PostgreSQL** với latency mili-giây.
   - **Analytical / Deep Analytics:** **DuckDB** chạy các câu lệnh OLAP SQL trực tiếp trên các file Parquet nằm trong MinIO mà không cần nạp lại dữ liệu vào database server.

---

## 2. Core Design Principles (Nguyên tắc thiết kế)

* **12-Factor App & Cloud-Native:** Toàn bộ cấu hình hệ thống được externalize qua biến môi trường (`.env` và `pydantic-settings`). Không hard-code credentials hay endpoint.
* **Interface Abstraction (Adapter Pattern):**
  - `MessagePublisher` (Abstract Base Class): Tách biệt logic kinh doanh khỏi Kafka/Redpanda. Khi chuyển sang GCP Pub/Sub chỉ cần inject `PubSubPublisher`.
  - `StorageClient` (Abstract Base Class): Tách biệt lưu trữ MinIO/S3. Khi chuyển sang Google Cloud Storage chỉ cần inject `GCSStorageClient`.
* **Stateless Services:** Các container API và Stream Processor không lưu trữ trạng thái trên local disk, sẵn sàng scale-out ngang (Horizontal Auto-scaling).

---

## 3. Project Structure (Cấu trúc thư mục)

```
StreamClick/
├── .env.example                     # Mẫu biến môi trường (12-Factor config)
├── .gitignore
├── README.md                        # Tài liệu hệ thống
├── docker-compose.yml               # Khởi chạy toàn bộ hạ tầng cục bộ
├── requirements.txt                 # Danh sách Python dependencies
├── setup_project.sh                 # Script tự động tạo cây thư mục
│
├── core/                            # Shared domain logic & abstractions
│   ├── __init__.py
│   ├── config.py                    # Externalized settings (Pydantic BaseSettings)
│   ├── schemas/                     # Event Data Contracts
│   │   ├── __init__.py
│   │   └── clickstream.py           # Pydantic Schema cho Clickstream Event
│   └── adapters/                    # Adapter Pattern implementations
│       ├── __init__.py
│       ├── broker/                  # Redpanda / Kafka Adapter
│       └── storage/                 # MinIO / S3 Adapter
│
├── simulator/                       # Data Generator & Simulator
│   ├── __init__.py
│   ├── dataset.py                   # Tải Kaggle Dataset tự động
│   ├── transformer.py               # Biến đổi dữ liệu sang schema chuẩn
│   ├── runner.py                    # Worker bắn sự kiện có pacing/delay
│   └── main.py                      # CLI Simulator Entrypoint
│
├── api/                             # Ingestion Layer
│   ├── __init__.py
│   ├── Dockerfile
│   └── main.py                      # FastAPI App (Stateless Ingestion)
│
├── streaming/                       # Speed Layer
│   ├── __init__.py
│   ├── Dockerfile
│   └── pipeline.py                  # Quix Streams real-time pipeline
│
├── batch/                           # Batch Layer (Storage / Data Lake)
│   ├── __init__.py
│   ├── consumer.py                  # Consumer module alias
│   └── datalake_consumer.py         # Micro-batching & Parquet Archiver lên MinIO
│
├── analytics/                       # OLAP & Serving Layer
│   └── duckdb.py                    # OLAP Engine truy vấn MinIO qua DuckDB
│
└── infrastructure/                  # Cấu hình hạ tầng & Script tiện ích
    ├── docker/
    │   └── postgres/
    │       └── init.sql             # SQL Schema cho Speed Layer
    └── scripts/
        └── produce_mock_events.py   # Script bắn mock events kiểm thử E2E
```

---

## 4. Prerequisites & Setup (Cài đặt & Khởi chạy)

### Yêu cầu hệ thống:
- **Docker** và **Docker Compose** (v2.0+)
- **Python** 3.10+
- **uv** (Package manager hiện đại cho Python)

### Hướng dẫn từng bước:

#### Bước 1: Khởi tạo biến môi trường
Sao chép file cấu hình mẫu `.env.example` thành `.env` để thiết lập các thông số chạy cục bộ:

**Trên macOS/Linux hoặc Windows PowerShell:**
```bash
cp .env.example .env
```

**Trên Windows Command Prompt (CMD):**
```cmd
copy .env.example .env
```

*(Mở file `.env` và tùy chỉnh thông số nếu cần thiết)*

#### Bước 2: Khởi chạy hạ tầng bằng Docker Compose
Khởi động toàn bộ các service hạ tầng (Redpanda, MinIO, PostgreSQL, Redpanda Console):
```bash
docker compose up -d
```

Kiểm tra trạng thái các container:
```bash
docker compose ps
```

#### Bước 3: Truy cập Web Consoles & API Docs
- **FastAPI Swagger Docs:** `http://localhost:8000/docs`
- **Redpanda Console UI:** `http://localhost:8080`
- **MinIO Console UI:** `http://localhost:9001` (User: `minioadmin` / Pass: `minioadmin`)
- **PostgreSQL Port:** `localhost:5432` (DB: `streamclick`, User: `postgres`, Pass: `postgres_secret_pw`)

#### Bước 4: Khởi tạo môi trường & Cài đặt Dependencies
Dự án sử dụng `uv` để quản lý dependencies và môi trường ảo độc lập:

```bash
# 1. Cài đặt dependencies vào .venv
uv sync

# 2. Chạy Test Suite (Unit Tests)
uv run pytest -v
```

---

## 5. Hướng dẫn khởi chạy Pipelines

### 🌊 A. Luồng Batch Processing (Redpanda -> MinIO Data Lake -> DuckDB)

Batch Layer chịu trách nhiệm gom các sự kiện Clickstream theo micro-batch từ Redpanda, nén thành định dạng cột **Apache Parquet** và lưu trữ phân vùng (Hive Partitioning) trên **MinIO Object Storage**, sau đó phục vụ truy vấn phân tích tức thời qua **DuckDB**.

```
[Simulator] ──POST /track──> [FastAPI :8000] ──Produce──> [Redpanda :9092]
                                                                │
                                   ┌────────────────────────────┘ (topic: events.clickstream.raw)
                                   ▼
                      [ DataLake Consumer ] (batch/datalake_consumer.py)
                         ├── 1. Buffer sự kiện vào RAM
                         ├── 2. Micro-batching (batch_size hoặc flush_interval)
                         └── 3. Nén Apache Parquet
                                   │
                                   ▼ (Upload S3 API)
                      [ MinIO Data Lake :9000 ]
                         └── raw/clickstream/year=YYYY/month=MM/day=DD/hour=HH/*.parquet
                                   │
                                   ▼ (OLAP Partition Pruning)
                              [ DuckDB ] (analytics/duckdb_olap.py)
```

#### Các bước chạy Batch Pipeline (Mở từng tab Terminal):

1. **Terminal 1 - Khởi chạy Ingestion API:**
   ```bash
   uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Terminal 2 - Khởi chạy Batch DataLake Consumer:**
   ```bash
   uv run python batch/datalake_consumer.py
   ```
   > Consumer sẽ lắng nghe topic `events.clickstream.raw`, gom micro-batch và định kỳ đẩy Parquet lên MinIO `streamclick-datalake`.

3. **Terminal 3 - Bắn sự kiện mô phỏng từ Simulator:**
   ```bash
   # Tải Kaggle Dataset và bắn 100 sự kiện mẫu với delay 0.05s
   uv run python -m simulator.main -l 100 -d 0.05
   
   # Hoặc chỉ định file CSV cụ thể
   uv run python -m simulator.main -f "data/clickstream.csv" -l 500 -d 0.01
   ```

4. **Terminal 4 - Chạy truy vấn phân tích OLAP với DuckDB:**
   Sau khi dữ liệu đã được Consumer đẩy lên MinIO, thực hiện phân tích SQL trực tiếp trên các file Parquet:
   ```bash
   uv run python -m analytics.duckdb_olap
   ```

---

### B. Luồng Real-time Speed Processing (Redpanda -> PostgreSQL)

1. **Khởi chạy Quix Streams Speed Processor:**
   ```bash
   uv run python -m streaming.processor
   ```
2. Processor sẽ tiêu thụ realtime các sự kiện và đếm số lượng thông qua Tumbling Window (60 giây), sau đó UPSERT kết quả tức thì vào bảng `realtime_metrics` trong **PostgreSQL** để chống trùng lặp dữ liệu (Idempotency).

---

## 6. Migration Path (Lộ trình chuyển đổi lên Google Cloud Platform)

Nhờ áp dụng **Adapter Pattern** và thiết kế **Cloud-Native**, việc chuyển dịch từ hạ tầng On-demand sang Google Cloud Platform hoàn toàn là **1-to-1 mapping** mà không phải tái cấu trúc Core Logic:

| Thành phần kiến trúc | Môi trường Local (Self-hosted) | Dịch vụ tương đương trên Google Cloud Platform (GCP) | Chiến lược chuyển đổi (Migration Strategy) |
| :--- | :--- | :--- | :--- |
| **Ingestion API** | FastAPI (Docker Container) | **Cloud Run** | Deploy containerized FastAPI lên Cloud Run với Serverless Auto-scaling (0 -> N instances). |
| **Message Broker** | Redpanda (Kafka-compatible) | **Google Cloud Pub/Sub** | Kích hoạt `PubSubPublisher` (kế thừa `MessagePublisher` ABC) để publish message trực tiếp lên Pub/Sub Topic. |
| **Data Lake Storage** | MinIO (Parquet files) | **Google Cloud Storage (GCS)** | Kích hoạt `GCSStorageClient` (kế thừa `StorageClient` ABC). Đường dẫn `s3://` chuyển thành `gs://`. |
| **Stream Processing** | Quix Streams (Python) | **Cloud Dataflow** (Apache Beam) hoặc **Cloud Run / GKE** | Chuyển logic stream sang Dataflow (Beam Python SDK) hoặc giữ nguyên Quix Streams container chạy trên Cloud Run/GKE. |
| **Serving Database** | PostgreSQL (Docker) | **Cloud SQL for PostgreSQL** | Thay đổi connection string `POSTGRES_HOST` trỏ đến Cloud SQL Instance IP / Private Service Connect. |
| **OLAP / Analytics Engine**| DuckDB (Querying MinIO) | **Google BigQuery** (hoặc BigQuery Omni / External Tables) | Tự động mount GCS Bucket vào BigQuery External Tables hoặc nạp Parquet vào BigQuery Native Storage. |
| **Infrastructure Management**| Docker Compose | **Terraform (IaC) + Artifact Registry** | Khai báo hạ tầng GCP bằng Terraform modules, build & push image lên Artifact Registry. |

