# Giải thích Chi tiết Kiến trúc & Tham số Cấu hình Docker Compose

Tài liệu này cung cấp giải thích chi tiết về vai trò của từng công cụ trong kiến trúc **Lambda Architecture** của dự án **StreamClick**, cùng ý nghĩa của toàn bộ các tham số cấu hình và chính sách giới hạn tài nguyên (**Resource Limits & Reservations**) được định nghĩa trong [`docker-compose.yml`](../docker-compose.yml).

---

## 1. Tổng quan các Dịch vụ (Services Overview)

| Dịch vụ (Service) | Công nghệ | Tầng kiến trúc (Layer) | CPU Limit | RAM Limit | Chức năng chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`redpanda`** | Redpanda v23.3 | Message Broker | 0.5 core | 384 MB | Hàng đợi phân tán (Kafka-compatible) tiếp nhận Clickstream events |
| **`redpanda-console`** | Redpanda Console v2.5 | Monitoring / Management UI | 0.1 core | 64 MB | Giao diện đồ họa giám sát Topics, Partitions, Messages và Consumer Groups |
| **`minio`** | MinIO Server | Data Lake (Batch Layer) | 0.25 core | 128 MB | Lưu trữ Object Storage (chuẩn S3) chứa các file dữ liệu dạng cột Parquet |
| **`postgres`** | PostgreSQL 16 Alpine | Serving DB (Speed Layer) | 0.25 core | 128 MB | Lưu trữ các chỉ số thời gian thực đã được tổng hợp để phục vụ Dashboard |
| **`ingestion-api`** | FastAPI (Python 3.11) | Ingestion Layer (Stateless) | 0.5 core | 192 MB | API tiếp nhận HTTP POST event từ client và đẩy vào Redpanda |
| **`stream-processor`** | Quix Streams (Python 3.11)| Speed Layer (Stream Processing)| 0.5 core | 192 MB | Xử lý stream thời gian thực từ Redpanda và ghi aggregation vào PostgreSQL |

> 💡 **Tổng tài nguyên cấp phát cả cụm:** Tối đa **~2.1 Cores CPU** và **~1.08 GB RAM** (Mức tiêu thụ thực tế chỉ khoảng ~560 MB RAM). Cấu hình này cực kỳ tối ưu và chạy mượt mà ngay cả trên server **8 Cores / 4GB RAM** hoặc máy tính cá nhân.

---

## 2. Chi tiết Cấu hình & Giới hạn Tài nguyên từng Dịch vụ

### 2.1. `redpanda` (Message Broker)

```yaml
redpanda:
  image: docker.redpanda.com/redpandadata/redpanda:v23.3.14
  container_name: streamclick-redpanda
  command:
    - redpanda start
    - --smp 1
    - --memory 256M
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
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 384M
      reservations:
        cpus: '0.1'
        memory: 256M
```

#### Giải thích các cờ lệnh (`command`):
* **`redpanda start`**: Khởi chạy tiến trình Redpanda broker.
* **`--smp 1`**: Giới hạn Redpanda sử dụng tối đa **1 CPU core** (Symmetric Multi-Processing), tối ưu cho môi trường local/chia sẻ tài nguyên.
* **`--memory 256M`**: Cấp phát bộ nhớ RAM cho Seastar Engine của Redpanda ở mức tối thiểu an toàn (**256 MB**). *Lưu ý: Không được đặt dưới 256M vì Seastar memory allocator sẽ crash do thiếu bộ nhớ.*
* **`--reserve-memory 0M`**: Không dành riêng bộ nhớ đệm cho kernel OS, giảm tối đa footprint RAM.
* **`--overprovisioned`**: Báo cho Redpanda biết nó đang chạy trong môi trường container/ảo hóa để tắt cơ chế polling liên tục ép xung CPU.
* **`--node-id 0`**: Định danh node ID trong cluster.
* **`--check=false`**: Bỏ qua các bài kiểm tra phần cứng chuẩn production (tốc độ I/O đĩa, OS tuning).
* **`--kafka-addr PLAINTEXT://0.0.0.0:29092,OUTSIDE://0.0.0.0:9092`**: Định nghĩa 2 listener kết nối:
  * `PLAINTEXT://0.0.0.0:29092`: Dành cho các container trong cùng mạng Docker nội bộ.
  * `OUTSIDE://0.0.0.0:9092`: Dành cho client bên ngoài máy host.
* **`--advertise-kafka-addr PLAINTEXT://redpanda:29092,OUTSIDE://localhost:9092`**: Địa chỉ broker phản hồi lại để client định tuyến gửi/nhận dữ liệu.

#### Cổng kết nối (`ports`):
* **`9092:9092`**: Cổng Kafka client API cho máy host.
* **`9644:9644`**: Cổng Redpanda Admin API (Health checks & Metrics).

#### Giới hạn tài nguyên (`deploy.resources`):
* **`limits` (`cpus: 0.5`, `memory: 384M`)**: Ngăn Redpanda vượt quá 0.5 core và 384MB RAM.
* **`reservations` (`cpus: 0.1`, `memory: 256M`)**: Cam kết cấp phát tối thiểu cho container để broker luôn duy trì hoạt động ổn định.

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
  deploy:
    resources:
      limits:
        cpus: '0.1'
        memory: 64M
```

#### Giải thích tham số:
* **`KAFKA_BROKERS: redpanda:29092`**: Kết nối tới Redpanda broker trong mạng Docker nội bộ.
* **`ports: "8080:8080"`**: Truy cập Web UI tại `http://localhost:8080` để theo dõi Topic, Partition và Consumer Lag theo thời gian thực.
* **`depends_on: redpanda`**: Khởi động sau khi container Redpanda sẵn sàng.
* **`deploy.resources`**: Giới hạn tối đa **0.1 CPU core** và **64 MB RAM**, tiêu tốn tài nguyên gần như không đáng kể.

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
  deploy:
    resources:
      limits:
        cpus: '0.25'
        memory: 128M
      reservations:
        cpus: '0.05'
        memory: 64M
```

#### Giải thích tham số:
* **`command: server /data --console-address ":9001"`**: Khởi động MinIO server lưu dữ liệu vào thư mục `/data` và mở Web Console ở cổng `9001`.
* **`MINIO_ROOT_USER` & `MINIO_ROOT_PASSWORD`**: Tài khoản quản trị (`minioadmin` / `minioadmin`).
* **`ports`**:
  * `9000:9000`: S3 API Endpoint cho Python code (`boto3`, `pyarrow`, `duckdb`).
  * `9001:9001`: Web UI Console duyệt file trên trình duyệt tại `http://localhost:9001`.
* **`volumes: minio_data:/data`**: Giữ dữ liệu file Parquet an toàn, không bị mất khi restart container.
* **`deploy.resources`**: Giới hạn tối đa **0.25 CPU** và **128 MB RAM** (cam kết 64 MB).

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
  deploy:
    resources:
      limits:
        cpus: '0.25'
        memory: 128M
      reservations:
        cpus: '0.05'
        memory: 64M
```

#### Giải thích tham số:
* **`image: postgres:16-alpine`**: Phiên bản PostgreSQL 16 siêu nhẹ trên nền tảng Alpine Linux.
* **`POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`**: Cấu hình cơ sở dữ liệu `streamclick`.
* **`ports: "5432:5432"`**: Cổng kết nối PostgreSQL chuẩn.
* **`volumes`**:
  * `postgres_data:/var/lib/postgresql/data`: Lưu trữ dữ liệu bảng bền vững.
  * `./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql`: Tự động khởi tạo cấu trúc bảng Speed Layer ngay lần đầu chạy.
* **`deploy.resources`**: Giới hạn tối đa **0.25 CPU** và **128 MB RAM**.

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
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 192M
      reservations:
        cpus: '0.1'
        memory: 96M
```

#### Giải thích tham số:
* **`build`**: Build từ mã nguồn [`api/Dockerfile`](../api/Dockerfile).
* **`env_file: .env`**: Nạp biến môi trường theo chuẩn 12-Factor App.
* **`ports: "8000:8000"`**: Cổng API tiếp nhận sự kiện tại `http://localhost:8000/v1/events` (Swagger UI tại `http://localhost:8000/docs`).
* **`depends_on: redpanda`**: Đảm bảo broker sẵn sàng trước khi nhận request.
* **`deploy.resources`**: Giới hạn **0.5 CPU** và **192 MB RAM** — hoàn toàn đủ sức xử lý 2.000 - 4.000 requests/giây nhờ cơ chế async event loop của FastAPI.

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
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 192M
      reservations:
        cpus: '0.1'
        memory: 96M
```

#### Giải thích tham số:
* **`build`**: Build từ [`streaming/Dockerfile`](../streaming/Dockerfile).
* **`env_file: .env`**: Nạp thông tin kết nối Broker và PostgreSQL.
* **`depends_on`**: Chờ cả Redpanda và PostgreSQL khởi động trước.
* **`deploy.resources`**: Giới hạn **0.5 CPU** và **192 MB RAM** cho Stream Processing pipeline.

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

* **`volumes`**: Đảm bảo toàn bộ dữ liệu trong MinIO Data Lake (`minio_data`) và PostgreSQL Serving DB (`postgres_data`) không bị mất đi khi dừng hoặc tái tạo container.
* **`networks: streamclick-net`**: Mạng bridge nội bộ độc lập, cho phép các container phân giải DNS an toàn bằng chính tên dịch vụ (`redpanda:29092`, `postgres:5432`, `minio:9000`) mà không phụ thuộc vào IP tĩnh.
