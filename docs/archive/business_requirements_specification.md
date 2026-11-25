# Tài liệu Đặc tả Yêu cầu Nghiệp vụ & Hệ thống (BRD & SRS)
## Dự án: StreamClick - E-commerce Clickstream Tracking System

* **Mã tài liệu:** BRD-SRS-STREAMCLICK-01
* **Tiêu chuẩn áp dụng:** IIBA BABOK v3 / IEEE 830 & ISO/IEC/IEEE 29148
* **Phương pháp tiếp cận:** Feature-Driven Requirements Specification (Đặc tả theo Tính năng)
* **Phiên bản:** 1.0.0
* **Trạng thái:** Approved / Production-Ready

---

## MỤC LỤC
1. [Tổng quan Dự án & Bối cảnh Kinh doanh (Business Context)](#1-tổng-quan-dự-án--bối-cảnh-kinh-doanh)
2. [Các Bên Liên quan & Chân dung Người dùng (Stakeholders & Personas)](#2-các-bên-liên-quan--chân-dung-người-dùng)
3. [Kiến trúc Giải pháp Tổng thể (Solution Architecture)](#3-kiến-trúc-giải-pháp-tổng-thể)
4. [Đặc tả Yêu cầu Chức năng theo Tính năng (Feature-based Functional Requirements)](#4-đặc-tả-yêu-cầu-chức-năng-theo-tính-năng)
   * [Tính năng 1: Thu thập & Xác thực Sự kiện (Event Ingestion & Validation)](#tính-năng-1-thu-thập--xác-thực-sự-kiện-event-ingestion--validation)
   * [Tính năng 2: Hàng đợi & Phân phối Sự kiện (Message Broker & Streaming Queue)](#tính-năng-2-hàng-đợi--phân-phối-sự-kiện-message-broker--streaming-queue)
   * [Tính năng 3: Xử lý Luồng Thời gian thực (Speed Layer & Real-time Serving)](#tính-năng-3-xử-lý-luồng-thời-gian-thực-speed-layer--real-time-serving)
   * [Tính năng 4: Lưu trữ Hồ Dữ liệu Dài hạn (Batch Layer & Data Lake Archival)](#tính-năng-4-lưu-trữ-hồ-dữ-liệu-dài-hạn-batch-layer--data-lake-archival)
   * [Tính năng 5: Động cơ Phân tích Dữ liệu Lớn (OLAP Analytics Engine)](#tính-năng-5-động-cơ-phân-tích-dữ-liệu-lớn-olap-analytics-engine)
   * [Tính năng 6: Quản lý Cấu hình & Kết nối (Configuration & Adapter Management)](#tính-năng-6-quản-lý-cấu-hình--kết-nối-configuration--adapter-management)
   * [Tính năng 7: Khả năng Chuyển dịch Đám mây (Cloud Migration Readiness)](#tính-năng-7-khả-năng-chuyển-dịch-đám-mây-cloud-migration-readiness)
5. [Yêu cầu Phi chức năng (Non-Functional Requirements - NFN)](#5-yêu-cầu-phi-chức-năng-non-functional-requirements)
6. [Từ điển Dữ liệu & Hợp đồng Sự kiện (Data Dictionary & Event Schema Contract)](#6-từ-điển-dữ-liệu--hợp-đồng-sự-kiện)
7. [Tiêu chí Nghiệm thu & Ma trận Truy vết (Acceptance Criteria & Traceability)](#7-tiêu-chí-nghiệm-thu--ma-trận-truy-vết)

---

## 1. Tổng quan Dự án & Bối cảnh Kinh doanh

### 1.1. Tuyên bố Vấn đề (Problem Statement)
Trong ngành Thương mại Điện tử (E-commerce), hành vi của khách hàng (Clickstream) diễn ra liên tục với tần suất cao (hàng nghìn thao tác xem sản phẩm, tìm kiếm, thêm giỏ hàng mỗi giây). Việc phân tích dữ liệu gặp phải 2 thách thức đối nghịch:
1. **Yêu cầu Real-time (Độ trễ thấp):** Đội ngũ Vận hành & Marketing cần dữ liệu tức thì (vài giây) để phát hiện sản phẩm đang "hot", cá nhân hóa giao diện và can thiệp giỏ hàng bị bỏ quên.
2. **Yêu cầu Historical Analytics (Độ chính xác & Toàn vẹn cao):** Đội ngũ Data Science và BI cần toàn bộ dữ liệu thô lịch sử qua nhiều năm để huấn luyện mô hình gợi ý sản phẩm (Recommendation System) và phân tích xu hướng dài hạn.

### 1.2. Mục tiêu Dự án (Business Goals)
* Xây dựng nền tảng **StreamClick** giải quyết triệt để 2 bài toán trên theo kiến trúc **Lambda Architecture**.
* **Tối ưu hóa Chi phí (TCO):** Khởi chạy độc lập trên hạ tầng Self-hosted (Docker Compose) với mức tiêu thụ tài nguyên tối thiểu, đồng thời thiết kế sẵn sàng chuyển dịch (migrate) 1-to-1 lên **Google Cloud Platform (GCP)** mà không cần tái cấu trúc mã nguồn.

---

## 2. Các Bên Liên quan & Chân dung Người dùng

| Bên liên quan (Stakeholder) | Vai trò & Trách nhiệm trong Hệ thống | Mục tiêu Sử dụng Hệ thống |
| :--- | :--- | :--- |
| **End-User (Khách mua hàng)** | Tác nhân sinh ra dữ liệu hành vi trên Web/App | Trải nghiệm duyệt web mượt mà, không bị chậm do việc theo dõi hành vi |
| **Marketing & Growth Team** | Người tiêu thụ dữ liệu thời gian thực (Real-time Consumers) | Theo dõi dashboard trực tiếp: số lượt xem sản phẩm, traffic realtime theo chiến dịch |
| **Data Analyst & BI Team** | Người khai thác dữ liệu phân tích sâu (OLAP Consumers) | Chạy các câu lệnh SQL phức tạp trên toàn bộ dữ liệu lịch sử trong Data Lake |
| **Data Platform Engineer** | Quản trị viên hạ tầng và vận hành pipeline | Triển khai hạ tầng, giám sát độ ổn định (uptime), scale hệ thống và migrate lên Cloud |

---

## 3. Kiến trúc Giải pháp Tổng thể

Hệ thống phân tách luồng dữ liệu thành 3 tầng cốt lõi:

```text
[ Web / Mobile App ]
         |
         v (HTTP POST /v1/events)
[ Ingestion Layer: FastAPI ]
         |
         v (Produce Events)
[ Message Broker: Redpanda ]
         |
         +---------------------------------------+
         |                                       |
         v [Speed Layer]                         v [Batch Layer]
[ Quix Streams Processor ]              [ Batch Ingestion Archiver ]
         |                                       |
         v (Real-time Aggregates)                v (Partitioned Parquet)
[ Serving DB: PostgreSQL ]              [ Data Lake: MinIO (S3) ]
         |                                       |
         v                                       v
[ Real-time Dashboards ]                [ OLAP Engine: DuckDB ]
```

---

## 4. Đặc tả Yêu cầu Chức năng theo Tính năng

### Tính năng 1: Thu thập & Xác thực Sự kiện (Event Ingestion & Validation)
* **Mã tính năng:** `FEAT-INGEST-01`
* **Mô tả:** Tiếp nhận dữ liệu hành vi người dùng từ các ứng dụng Client (Web/Mobile) qua giao thức HTTP RESTful, kiểm tra tính hợp lệ của dữ liệu trước khi nạp vào hệ thống.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-INGEST-1.1`: Cung cấp REST API endpoint `POST /v1/events` tiếp nhận payload JSON.
  * `FR-INGEST-1.2`: Tự động kiểm tra và xác thực cấu trúc dữ liệu dựa trên Pydantic Schema (`ClickstreamEvent`). Bắt buộc phải có các trường định danh thiết bị (`anonymous_id`), phiên làm việc (`session_id`), loại sự kiện (`event_type`), URL trang (`page_url`).
  * `FR-INGEST-1.3`: Trả về mã phản hồi HTTP `202 Accepted` ngay lập tức sau khi sự kiện được đưa vào hàng đợi của Broker thành công (Non-blocking I/O).
  * `FR-INGEST-1.4`: Cung cấp endpoint `GET /health` trả về trạng thái hoạt động của Ingestion Service phục vụ bộ giám sát (Health Check Probe).

---

### Tính năng 2: Hàng đợi & Phân phối Sự kiện (Message Broker & Streaming Queue)
* **Mã tính năng:** `FEAT-BROKER-02`
* **Mô tả:** Đóng vai trò là hàng đợi phân tán trung tâm, tiếp nhận và phân phối sự kiện Clickstream đến các tầng xử lý downstream.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-BROKER-2.1`: Tiếp nhận sự kiện vào topic `events.clickstream.raw` với chuẩn giao tiếp tương thích Apache Kafka API.
  * `FR-BROKER-2.2`: Sử dụng `user_id` hoặc `anonymous_id` làm Partition Key để đảm bảo toàn bộ sự kiện của cùng một người dùng được định tuyến vào cùng một Partition (bảo toàn thứ tự thời gian của sự kiện - Event Ordering).
  * `FR-BROKER-2.3`: Nén dữ liệu truyền tải theo chuẩn Snappy (`compression.type=snappy`) và gom micro-batching (`linger.ms=5`) để tối ưu băng thông mạng.
  * `FR-BROKER-2.4`: Cung cấp giao diện quản trị đồ họa (Web Console) tại cổng `8080` cho phép kiểm tra số lượng messages, trạng thái partitions và độ trễ (consumer lag).

---

### Tính năng 3: Xử lý Luồng Thời gian thực (Speed Layer & Real-time Serving)
* **Mã tính năng:** `FEAT-SPEED-03`
* **Mô tả:** Xử lý và tính toán liên tục các sự kiện Clickstream theo thời gian thực (độ trễ dưới 1 giây) để phục vụ các báo cáo nhanh.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-SPEED-3.1`: Tiêu thụ liên tục (Stream Consume) các message từ topic `events.clickstream.raw` bằng Quix Streams engine.
  * `FR-SPEED-3.2`: Tự động nhận diện và lọc các sự kiện có `event_type = 'product_view'`.
  * `FR-SPEED-3.3`: Tính toán và cập nhật số lượt xem tích lũy của từng sản phẩm vào bảng `realtime_product_views` trên PostgreSQL theo cơ chế Upsert (`ON CONFLICT (product_id) DO UPDATE`).
  * `FR-SPEED-3.4`: Cung cấp cơ sở dữ liệu Serving với độ trễ phản hồi dưới 10ms để phục vụ dashboard hiển thị bảng xếp hạng sản phẩm thịnh hành (Trending Products).

---

### Tính năng 4: Lưu trữ Hồ Dữ liệu Dài hạn (Batch Layer & Data Lake Archival)
* **Mã tính năng:** `FEAT-BATCH-04`
* **Mô tả:** Thu thập định kỳ dữ liệu sự kiện thô bất biến, chuyển đổi sang định dạng nén cột và lưu trữ an toàn trong Data Lake.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-BATCH-4.1`: Đọc các lô sự kiện (micro-batches) từ Redpanda và chuyển đổi cấu trúc sang định dạng nén cột **Apache Parquet**.
  * `FR-BATCH-4.2`: Lưu trữ các file Parquet trực tiếp lên **MinIO Object Storage** (chuẩn S3 API) theo cấu trúc thư mục phân vùng thời gian:
    `raw/events/year=YYYY/month=MM/day=DD/events_*.parquet`
  * `FR-BATCH-4.3`: Quá trình chuyển đổi và nạp dữ liệu phải được thực hiện hoàn toàn trên bộ nhớ RAM (`io.BytesIO`), không tạo file tạm xuống ổ đĩa cục bộ (tuân thủ nguyên tắc **Stateless**).
  * `FR-BATCH-4.4`: Tự động kiểm tra và khởi tạo bucket `clickstream-lake` nếu bucket chưa tồn tại (Idempotent Setup).

---

### Tính năng 5: Động cơ Phân tích Dữ liệu Lớn (OLAP Analytics Engine)
* **Mã tính năng:** `FEAT-OLAP-05`
* **Mô tả:** Cung cấp khả năng thực thi các câu truy vấn phân tích chuyên sâu (OLAP SQL) trực tiếp trên Data Lake mà không cần nạp lại dữ liệu vào database server.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-OLAP-5.1`: Tích hợp động cơ **DuckDB** với extension `httpfs` để truy vấn trực tiếp các file Parquet nằm trên MinIO/S3 thông qua đường dẫn glob: `s3://clickstream-lake/raw/events/*/*/*/*.parquet`.
  * `FR-OLAP-5.2`: Hỗ trợ phân tích tổng hợp: đếm tổng số sự kiện theo từng loại (`event_type`), tính số lượng người dùng duy nhất (`unique_users`), số lượng phiên duy nhất (`unique_sessions`).
  * `FR-OLAP-5.3`: Tận dụng cơ chế Column Pruning và Projection Pushdown của định dạng Parquet để chỉ đọc đúng các cột cần tính toán, tối ưu hóa thời gian thực thi truy vấn.

---

### Tính năng 6: Quản lý Cấu hình & Kết nối (Configuration & Adapter Management)
* **Mã tính năng:** `FEAT-CORE-06`
* **Mô tả:** Đảm bảo toàn bộ hệ thống được quản lý cấu hình tập trung và quản lý vòng đời kết nối an toàn, tối ưu hiệu năng bộ nhớ.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-CORE-6.1`: Sử dụng `pydantic-settings` tự động nạp cấu hình từ tệp `.env`, kiểm soát chặt chẽ kiểu dữ liệu và giá trị mặc định theo chuẩn **12-Factor App**.
  * `FR-CORE-6.2`: Áp dụng kỹ thuật **Thread-Safe Double-Checked Locking Singleton** cho `RedpandaPublisher` và `MinIOClient`, đảm bảo mỗi tiến trình chỉ khởi tạo duy nhất 1 kết nối (Connection Reuse).
  * `FR-CORE-6.3`: Thiết lập Connection Pooling (`max_pool_connections=25`) cho `boto3` để tối ưu hóa I/O đồng thời.
  * `FR-CORE-6.4`: Tự động phục hồi kết nối (Retry Backoff) khi broker hoặc storage gặp sự cố mạng hoặc khởi động trễ.

---

### Tính năng 7: Khả năng Chuyển dịch Đám mây (Cloud Migration Readiness)
* **Mã tính năng:** `FEAT-CLOUD-07`
* **Mô tả:** Thiết kế tầng trừu tượng (Adapter Pattern) cho phép chuyển dịch toàn bộ hệ thống từ môi trường Self-hosted cục bộ lên Google Cloud Platform (GCP) với chi phí thay đổi tối thiểu.
* **Yêu cầu Chi tiết (Functional Specifications):**
  * `FR-CLOUD-7.1`: Định nghĩa Port Interface `AbstractMessagePublisher` và `AbstractStorageClient`.
  * `FR-CLOUD-7.2`: Đảm bảo khi chuyển sang GCP, lập trình viên chỉ cần triển khai `PubSubPublisher` và `GCSClient` kế thừa các interface trên, không làm thay đổi logic tại tầng API hay Batch Processing.
  * `FR-CLOUD-7.3`: Cung cấp bảng ánh xạ 1-to-1 chi tiết sang hệ sinh thái GCP (Cloud Run, Pub/Sub, GCS, Cloud SQL, BigQuery).

---

## 5. Yêu cầu Phi chức năng (Non-Functional Requirements)

Được chuẩn hóa theo tiêu chuẩn chất lượng phần mềm **ISO/IEC 25010**:

| Mã NFN | Tiêu chuẩn chất lượng | Yêu cầu Kỹ thuật Cụ thể |
| :--- | :--- | :--- |
| **NFN-PERF-01** | **Throughput & Concurrency** | Ingestion API phải xử lý tối thiểu **2.000 Requests/giây** (RPS) trên môi trường hạ tầng tối thiểu (0.5 CPU limit). |
| **NFN-PERF-02** | **Latency** | Độ trễ phản hồi HTTP Ingestion API đạt **p50 < 20ms** và **p95 < 50ms**. Độ trễ dữ liệu từ lúc phát sinh đến khi cập nhật Serving DB **< 1 giây**. |
| **NFN-RES-01** | **Resource Footprint** | Toàn bộ cụm 6 container (Broker, Lake, DB, API, Stream, Console) giới hạn tối đa **~2.1 CPU Cores** và **~1.08 GB RAM** (tiêu thụ thực tế ~560 MB RAM). |
| **NFN-SEC-01** | **Zero Hardcoding** | Tuyệt đối không lưu trữ thông tin nhạy cảm (Access Key, Secret Key, Password) trong mã nguồn. 100% nạp từ biến môi trường. |
| **NFN-REL-01** | **Resilience & Fault Tolerance** | Tự động xử lý lỗi mạng (`KafkaException`, `EndpointConnectionError`), tự động thử lại (Retry) và chống tràn bộ đệm RAM (`BufferError`). |
| **NFN-MAINT-01** | **Maintainability & OCP** | Tuân thủ nguyên lý Open-Closed Principle (SOLID). Dễ dàng mở rộng test case mới thông qua Registry Pattern (`@register_test`). |
| **NFN-PORT-01** | **Portability & Containerization** | 100% dịch vụ được đóng gói dưới dạng Docker Containers chuẩn, chạy đồng nhất trên Windows, Linux và Cloud VMs. |

---

## 6. Từ điển Dữ liệu & Hợp đồng Sự kiện

### Cấu trúc Hợp đồng Dữ liệu (Clickstream Event Contract - JSON Schema)

| Tên trường (Field Name) | Kiểu dữ liệu (Data Type) | Bắt buộc (Required) | Mô tả Nghiệp vụ & Ràng buộc (Business Rules) | Ví dụ (Example) |
| :--- | :--- | :---: | :--- | :--- |
| `event_id` | `UUID (String)` | Có (Tự sinh) | Định danh duy nhất toàn cục của sự kiện | `"c3b9e4a1-8d2f-4a3b-9e1a-5f8e2d1c9b3a"` |
| `user_id` | `String` | Không | ID tài khoản khách hàng nếu đã đăng nhập | `"usr_98234"` |
| `anonymous_id` | `String` | **Có** | ID định danh thiết bị / cookie ẩn danh | `"anon_device_8841"` |
| `session_id` | `String` | **Có** | ID phiên truy cập hiện tại của người dùng | `"sess_20260924_01"` |
| `event_type` | `String` | **Có** | Loại hành động: `page_view`, `product_view`, `add_to_cart`, `purchase`, `search` | `"product_view"` |
| `page_url` | `String` | **Có** | Đường dẫn URL đầy đủ của trang đang thao tác | `"https://shop.com/products/PROD_001"` |
| `referrer_url` | `String` | Không | Đường dẫn URL giới thiệu trước đó | `"https://google.com/search?q=shoes"` |
| `product_id` | `String` | Tùy chọn | Mã sản phẩm (Bắt buộc nếu event liên quan đến sản phẩm) | `"PROD_001"` |
| `price` | `Float` | Tùy chọn | Giá sản phẩm tại thời điểm thao tác | `129.99` |
| `currency` | `String` | Không | Đơn vị tiền tệ (Mặc định: `"USD"`) | `"USD"` |
| `properties` | `Dict (JSON)` | Không | Thuộc tính mở rộng tùy biến của sự kiện | `{"color": "black", "size": "42"}` |
| `timestamp` | `ISO 8601 (String)` | Có (Tự sinh) | Thời điểm phát sinh sự kiện theo múi giờ UTC | `"2026-09-24T05:26:22.102Z"` |

---

## 7. Tiêu chí Nghiệm thu & Ma trận Truy vết

| Mã Yêu cầu | Tính năng Nghiệm thu | Phương pháp Kiểm thử (Verification Method) | Tiêu chí Đạt (Acceptance Criteria) |
| :--- | :--- | :--- | :--- |
| `FR-INGEST-01` | Ingestion API | Chạy `stress_test.py` với 5.000 requests | 100% trả về HTTP 202, không thất thoát sự kiện |
| `FR-BROKER-02` | Redpanda Broker | Chạy `test_pipeline_modules.py -m broker` | Đẩy tin nhắn thành công, kiểm tra thấy dữ liệu trên Redpanda Console |
| `FR-SPEED-03` | Speed Layer | Bắn mock `product_view` event | Bảng `realtime_product_views` trên PostgreSQL tự động tăng `view_count` |
| `FR-BATCH-04` | Data Lake Storage | Chạy `test_pipeline_modules.py -m storage` | Tạo file Parquet theo đúng cấu trúc partition thời gian trên MinIO |
| `FR-OLAP-05` | DuckDB OLAP | Thực thi truy vấn `analytics_duckdb.py` | Trả về kết quả tổng hợp chính xác từ file Parquet trong MinIO |
| `FR-CORE-06` | Config & Singleton | Chạy `test_pipeline_modules.py -m config` | Cùng một địa chỉ Instance ID, nạp đúng thông số từ `.env` |
| `NFN-PORT-01` | Mở rộng Kiểm thử | Chạy `test_pipeline_modules.py --all` | Toàn bộ 7/7 bài kiểm thử đều đạt trạng thái `✅ PASS` |
