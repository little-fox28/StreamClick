# Giải thích Chi tiết Kiến trúc & Tham số Cấu hình Docker Compose

Tài liệu này cung cấp giải thích chi tiết về vai trò của từng công cụ trong kiến trúc **Lambda Architecture** của dự án **StreamClick**, cùng ý nghĩa của toàn bộ các tham số cấu hình được định nghĩa trong [`docker-compose.yml`](../docker-compose.yml).

---

## 1. Tổng quan các Dịch vụ (Services Overview)

| Dịch vụ (Service) | Công nghệ | Tầng kiến trúc (Layer) | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **`redpanda`** | Redpanda v23.3 | Message Broker | Hàng đợi phân tán (Kafka-compatible) tiếp nhận Clickstream events |
| **`redpanda-console`** | Redpanda Console v2.5 | Monitoring / Management UI | Giao diện đồ họa giám sát Topics, Partitions, Messages và Consumer Groups |
| **`minio`** | MinIO Server | Data Lake (Batch Layer) | Lưu trữ Object Storage (chuẩn S3) chứa các file dữ liệu dạng cột Parquet |
| **`postgres`** | PostgreSQL 16 Alpine | Serving DB (Speed Layer) | Lưu trữ các chỉ số thời gian thực đã được tổng hợp để phục vụ Dashboard |
| **`ingestion-api`** | FastAPI (Python 3.11) | Ingestion Layer (Stateless) | API tiếp nhận HTTP POST event từ client và đẩy vào Redpanda |
| **`stream-processor`** | Quix Streams (Python 3.11)| Speed Layer (Stream Processing)| Xử lý stream thời gian thực từ Redpanda và ghi aggregation vào PostgreSQL |

---

## 2. Chi tiết Cấu hình từng Dịch vụ

### 2.1. `redpanda` (Message Broker)

```yaml
redpanda:
  image: docker.redpanda.com/redpandadata/redpanda:v23.3.14
  container_name: streamclick-redpanda
  command:
    - redpanda start
    - --smp 1
    - --memory 512M
    - --reserve-memory 0M
    - --overprovisioned
    - --node-id 0
    - --check=false
    - --kafka-addr PLAINTEXT://0.0.0.0:29092,OUTSIDE://0.0.0.0:9092
    - --advertise-kafka-addr PLAINTEXT://redpanda:29092,OUTSIDE://localhost:9092
  ports:
    - "9092:9092"
    - "9644:9644"
  networks:
    - streamclick-net
```

#### Giải thích các cờ lệnh (`command`):
* **`redpanda start`**: Lệnh khởi chạy tiến trình Redpanda broker.
* **`--smp 1`**: Giới hạn Redpanda sử dụng tối đa **1 CPU core** (Symmetric Multi-Processing), tránh chiếm dụng toàn bộ tài nguyên CPU của máy host khi phát triển local.
* **`--memory 512M`**: Cấp phát giới hạn bộ nhớ RAM tối đa cho Redpanda là **512 Megabytes**.
* **`--reserve-memory 0M`**: Không dành riêng bộ nhớ đệm cho kernel OS, giúp giảm tối đa dung lượng RAM sử dụng trên môi trường local/test.
* **`--overprovisioned`**: Thông báo cho Redpanda biết nó đang chạy trong môi trường chia sẻ tài nguyên (như container trên laptop). Khi bật cờ này, Redpanda sẽ tắt cơ chế liên tục polling ép xung CPU.
* **`--node-id 0`**: Định danh node ID duy nhất của broker trong cụm (cluster).
* **`--check=false`**: Bỏ qua các bài kiểm tra phần cứng chuẩn production (ví dụ: tốc độ đọc/ghi I/O của đĩa, kernel tune).
* **`--kafka-addr PLAINTEXT://0.0.0.0:29092,OUTSIDE://0.0.0.0:9092`**: Định nghĩa 2 listener lắng nghe kết nối:
  * `PLAINTEXT://0.0.0.0:29092`: Dành riêng cho các service cùng nằm trong mạng Docker nội bộ.
  * `OUTSIDE://0.0.0.0:9092`: Dành cho các client kết nối từ bên ngoài máy host.
* **`--advertise-kafka-addr PLAINTEXT://redpanda:29092,OUTSIDE://localhost:9092`**: Địa chỉ mà Redpanda phản hồi lại cho Client để Client biết endpoint chính xác gửi/nhận dữ liệu.

#### Cổng kết nối (`ports`):
* **`9092:9092`**: Cổng Kafka client API cho máy host.
* **`9644:9644`**: Cổng Redpanda Admin API (dùng để kiểm tra health check và metrics).

---

### 2.2. `redpanda-console` (Giao diện Quản trị Broker)

```yaml
redpanda-console:
  image: docker.redpanda.com/redpandadata/console:v2.5.2
  container_name: streamclick-redpanda-console
  environment:
    KAFKA_BROKERS: redpanda:29092
  ports:
    - "8080:8080"
  depends_on:
    - redpanda
  networks:
    - streamclick-net
```

#### Giải thích tham số:
* **`KAFKA_BROKERS: redpanda:29092`**: Trỏ console tới địa chỉ nội bộ của Redpanda broker trong Docker network.
* **`ports: "8080:8080"`**: Mở cổng Web UI tại `http://localhost:8080` để xem trực quan danh sách messages, lag của consumer group.
* **`depends_on: redpanda`**: Khởi động sau khi container Redpanda được kích hoạt.

---

### 2.3. `minio` (Data Lake Storage)

```yaml
minio:
  image: minio/minio:RELEASE.2024-05-28T07-15-41Z
  container_name: streamclick-minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  ports:
    - "9000:9000"
    - "9001:9001"
  volumes:
    - minio_data:/data
  networks:
    - streamclick-net
```

#### Giải thích tham số:
* **`command: server /data --console-address ":9001"`**: Khởi động MinIO server với thư mục lưu trữ dữ liệu tại `/data` và mở trang quản trị Web Console ở cổng `9001`.
* **`MINIO_ROOT_USER` & `MINIO_ROOT_PASSWORD`**: Cặp Access Key và Secret Key quản trị cao nhất (`minioadmin` / `minioadmin`).
* **`ports`**:
  * `9000:9000`: S3 API Endpoint dành cho code Python (`boto3`, `pyarrow`, `duckdb`) giao tiếp đọc/ghi file.
  * `9001:9001`: Web UI Console để duyệt file trên trình duyệt web tại `http://localhost:9001`.
* **`volumes: minio_data:/data`**: Gắn Docker Volume vào thư mục `/data` để các file Parquet không bị mất khi dừng hoặc xóa container.

---

### 2.4. `postgres` (Serving Database / Speed Layer Sink)

```yaml
postgres:
  image: postgres:16-alpine
  container_name: streamclick-postgres
  environment:
    POSTGRES_DB: streamclick
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres_secret_pw
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
  networks:
    - streamclick-net
```

#### Giải thích tham số:
* **`image: postgres:16-alpine`**: Phiên bản PostgreSQL 16 tối ưu dung lượng dựa trên Alpine Linux.
* **`POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`**: Tự động khởi tạo database tên `streamclick` và tài khoản tương ứng.
* **`ports: "5432:5432"`**: Expose cổng PostgreSQL chuẩn để kết nối từ máy host hoặc công cụ quản trị (DBeaver, DataGrip, pgAdmin).
* **`volumes`**:
  * `postgres_data:/var/lib/postgresql/data`: Đảm bảo dữ liệu bảng biểu được lưu trữ bền vững (persistent).
  * `./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql`: Docker entrypoint sẽ tự động chạy file SQL này khi database được tạo lần đầu để dựng sẵn bảng biểu Speed Layer.

---

### 2.5. `ingestion-api` (FastAPI Ingestion Service)

```yaml
ingestion-api:
  build:
    context: .
    dockerfile: api/Dockerfile
  container_name: streamclick-ingestion-api
  env_file:
    - .env
  ports:
    - "8000:8000"
  depends_on:
    - redpanda
  networks:
    - streamclick-net
```

#### Giải thích tham số:
* **`build`**: Chỉ định ngữ cảnh build từ root (`.`) và file hướng dẫn build tại [`api/Dockerfile`](../api/Dockerfile).
* **`env_file: .env`**: Tuân thủ chuẩn 12-Factor App, nạp cấu hình từ file `.env` vào runtime container.
* **`ports: "8000:8000"`**: Cổng tiếp nhận HTTP request sự kiện tại `http://localhost:8000/v1/events`.
* **`depends_on: redpanda`**: Đảm bảo Message Broker sẵn sàng trước khi nhận tải.

---

### 2.6. `stream-processor` (Quix Streams Speed Layer)

```yaml
stream-processor:
  build:
    context: .
    dockerfile: streaming/Dockerfile
  container_name: streamclick-stream-processor
  env_file:
    - .env
  depends_on:
    - redpanda
    - postgres
  networks:
    - streamclick-net
```

#### Giải thích tham số:
* **`build`**: Build container từ [`streaming/Dockerfile`](../streaming/Dockerfile).
* **`env_file: .env`**: Lấy thông tin kết nối Broker và PostgreSQL.
* **`depends_on`**: Chờ cả Redpanda (nguồn dữ liệu đầu vào) và PostgreSQL (đích ghi đầu ra) khởi động trước.

---

## 3. Hạ tầng Mạng & Ổ đĩa (Volumes & Networks)

```yaml
volumes:
  minio_data:
  postgres_data:

networks:
  streamclick-net:
    driver: bridge
```

* **`volumes`**:
  * `minio_data`: Lưu trữ dữ liệu các tệp Parquet của Data Lake.
  * `postgres_data`: Lưu trữ dữ liệu vật lý của PostgreSQL Serving DB.
* **`networks: streamclick-net`**:
  * Sử dụng mạng ảo `bridge` riêng biệt để các container phân giải DNS nội bộ của nhau bằng tên dịch vụ (ví dụ: `redpanda:29092`, `postgres:5432`, `minio:9000`).
  * Tách biệt toàn bộ hệ thống khỏi default bridge network của Docker để tăng tính bảo mật và kiểm soát luồng dữ liệu.
