# [ADR-0001] Áp dụng Lambda Architecture tách biệt Speed Layer và Batch Layer

* **Status:** Accepted (Retroactive Baseline)
* **Date:** 2026-10-02
* **Technical Area:** System Architecture / Data Pipeline

---

## Context (Bối cảnh & Vấn đề)

Hệ thống theo dõi Clickstream thương mại điện tử phải phục vụ đồng thời hai nhóm tải truy vấn có đặc tính trái ngược nhau:

1. **Giám sát vận hành thời gian thực:** Cần tổng hợp nhanh số lượt tương tác theo từng sản phẩm và loại sự kiện trong các khung cửa sổ ngắn (1 phút) với độ trễ đọc thấp.
2. **Phân tích lịch sử chuyên sâu (OLAP):** Cần lưu giữ nguyên vẹn toàn bộ sự kiện gốc kèm ngữ cảnh thiết bị (`device`) và thuộc tính động (`properties`) để chạy truy vấn quét diện rộng mà không làm suy giảm hiệu năng cơ sở dữ liệu phục vụ dashboard trực tuyến.

Nếu đẩy toàn bộ sự kiện thô vào duy nhất một cơ sở dữ liệu quan hệ (`PostgreSQL`), bảng dữ liệu sẽ phình to nhanh chóng và gây tranh chấp I/O khi chạy truy vấn tổng hợp lịch sử. Ngược lại, nếu chỉ lưu file Parquet theo lô trên Object Storage, độ trễ xả đệm sẽ không đáp ứng được nhu cầu theo dõi tức thời.

---

## Decision (Quyết định Thiết kế)

Triển khai kiến trúc **Lambda Architecture** lấy **Redpanda** (topic `events.clickstream.raw`) làm điểm phân nhánh trung tâm cho hai consumer group hoạt động độc lập:

1. **Speed Layer (`streaming/processor.py`):** Sử dụng `Quix Streams` (`consumer_group="streamclick-realtime-group"`, `auto_offset_reset="latest"`) để gom nhóm sự kiện theo `event_type | product_id` trong cửa sổ **60-second Tumbling Window**, sau đó thực hiện `INSERT ... ON CONFLICT DO UPDATE` vào bảng `realtime_product_metrics` trên **PostgreSQL 16**.
2. **Batch Layer (`batch/datalake_consumer.py` & `analytics/duckdb_olap.py`):** Sử dụng `confluent-kafka` (`group.id="streamclick-datalake-group"`, `auto.offset.reset="earliest"`) gom micro-batch (`5,000` sự kiện hoặc `60` giây), chuyển đổi sang định dạng cột **Apache Parquet** và lưu trữ bất biến trên **MinIO** theo phân vùng Hive (`year/month/day/hour`), phục vụ truy vấn OLAP trực tiếp bằng **DuckDB** (`httpfs`).

---

## Consequences (Hệ quả & Đánh đổi)

### Pros (Ưu điểm)
* **Cô lập tải đọc/ghi:** Truy vấn OLAP nặng trên DuckDB quét trực tiếp từ MinIO mà không ảnh hưởng tới CPU/RAM của PostgreSQL đang phục vụ dashboard thời gian thực.
* **Khả năng phát lại dữ liệu (Replayability):** Nhờ hai consumer group tách biệt trên Redpanda, việc khởi động lại hoặc đọc lại từ `earliest` ở Batch Layer không làm gián đoạn luồng tính toán cửa sổ hiện tại ở Speed Layer.
* **Tối ưu định dạng lưu trữ cho từng mục đích:** Bảng quan hệ có khóa chính chặt chẽ cho truy vấn điểm/cửa sổ ngắn; file Parquet nén cột cho truy vấn phân tích lịch sử.

### Cons & Trade-offs (Nhược điểm & Đánh đổi)
* **Duy trì hai nhánh mã nguồn xử lý:** Phải vận hành và giám sát song song hai tiến trình tiêu thụ (`stream-processor` và `batch-consumer`) với hai thư viện client khác nhau (`quixstreams` và `confluent-kafka`).
* **Trạng thái cục bộ ở Speed Layer:** `Quix Streams` lưu trữ trạng thái cửa sổ thời gian trên đĩa cục bộ (`state/streamclick-realtime-group/`), gây cản trở khi cần scale-out ngang trên môi trường container phi trạng thái (sẽ được giải quyết khi chuyển sang kiến trúc Serverless trên Cloud).

---

## Codebase Evidence (Tham chiếu Mã nguồn)

* `docker-compose.yml`
* `streaming/processor.py`
* `batch/datalake_consumer.py`
* `analytics/duckdb_olap.py`
