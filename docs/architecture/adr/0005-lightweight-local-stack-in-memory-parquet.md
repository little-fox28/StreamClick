# [ADR-0005] Lựa chọn Local Stack Siêu nhẹ & Ghi Parquet In-Memory Chuẩn At-Least-Once

* **Status:** Accepted (Retroactive Baseline)
* **Date:** 2026-10-02
* **Technical Area:** Infrastructure / Batch Data Lake & OLAP

---

## Context (Bối cảnh & Vấn đề)

Một hệ thống Big Data truyền thống dựa trên hệ sinh thái JVM (Apache Kafka + ZooKeeper, Apache Spark, Hadoop HDFS, Presto/Trino) thường tiêu tốn từ 8 GB đến 16 GB RAM chỉ để khởi chạy môi trường phát triển cục bộ, gây khó khăn khi vận hành, kiểm thử E2E và demo trên máy cá nhân. Đồng thời, tiến trình lưu trữ Data Lake cần đảm bảo không làm mất sự kiện khi gặp lỗi kết nối Object Storage và không để lại file rác trên đĩa cứng container.

---

## Decision (Quyết định Thiết kế)

1. **Tối ưu hóa Công nghệ Hạ tầng Cục bộ (`docker-compose.yml`):**
   * Chọn **Redpanda** (viết bằng C++, không phụ thuộc JVM hay ZooKeeper, cấu hình `--smp 1 --memory 256M --overprovisioned`) thay cho Apache Kafka.
   * Chọn **MinIO** làm S3-compatible Object Storage và **DuckDB** (`httpfs` extension chạy `:memory:`) làm động cơ OLAP truy vấn trực tiếp file Parquet từ xa mà không cần duy trì cụm OLAP server luôn bật.
   * Áp đặt `deploy.resources.limits` chặt chẽ cho các container lõi với tổng trần bộ nhớ chỉ khoảng **1.31 GiB RAM**.
2. **Nén Parquet In-Memory & Cam kết Offset Thủ công (`batch/datalake_consumer.py`):**
   * Tắt tự động xác nhận offset trên Kafka Consumer (`enable.auto.commit = False`).
   * Khi bộ đệm chạm ngưỡng `batch_size = 5000` hoặc `flush_interval_seconds = 60.0` (hoặc khi nhận tín hiệu dừng `KeyboardInterrupt`), chuyển đổi danh sách sự kiện sang `pandas.DataFrame` và nén thành **Apache Parquet** bằng `pyarrow` trực tiếp trên bộ nhớ **`io.BytesIO`**.
   * Đẩy thẳng byte buffer lên MinIO theo đường dẫn phân vùng Hive `raw/clickstream/year=YYYY/month=MM/day=DD/hour=HH/batch_<uuid>.parquet`. **Chỉ gọi `self.consumer.commit()` và xóa bộ đệm RAM sau khi `upload_bytes()` trả về `True`**.

---

## Consequences (Hệ quả & Đánh đổi)

### Pros (Ưu điểm)
* **Tiêu thụ tài nguyên tối thiểu:** Toàn bộ nền tảng khởi động trong vài giây trên máy cá nhân phổ thông trong khi vẫn giữ nguyên giao thức chuẩn công nghiệp (Kafka API, S3 API, PostgreSQL, Parquet).
* **Đảm bảo độ tin cậy At-Least-Once:** Nếu MinIO tạm thời ngắt kết nối, ngoại lệ được văng ra trước bước `commit()`, giúp Redpanda giữ nguyên offset để phát lại dữ liệu ở lần chạy kế tiếp mà không mất bản ghi.
* **Container hoàn toàn Stateless:** Quá trình chuyển đổi Parquet diễn ra 100% trên RAM, loại bỏ chi phí I/O đĩa cục bộ và nguy cơ đầy ổ đĩa do file tạm.

### Cons & Trade-offs (Nhược điểm & Đánh đổi)
* **Khả năng trùng lặp bản ghi khi sự cố giữa chừng:** Nếu upload lên MinIO đã thành công nhưng tiến trình bị ngắt đột ngột ngay trước lệnh `consumer.commit()`, lô sự kiện đó sẽ được đọc lại và tạo thêm một file `batch_<uuid>.parquet` mới; do đó các truy vấn OLAP chính xác tuyệt đối ở hạ nguồn cần khử trùng lặp theo `event_id`.
* **Phân vùng theo thời điểm xử lý (Processing-Time Partitioning):** Đường dẫn phân vùng `year/month/day/hour` hiện được sinh từ `datetime.now()` lúc xả đệm thay vì trường `timestamp` gốc của từng sự kiện, nên các sự kiện đến trễ hoặc phát lại từ tập dữ liệu lịch sử sẽ nằm trong phân vùng của ngày chạy Batch Consumer.

---

## Codebase Evidence (Tham chiếu Mã nguồn)

* `docker-compose.yml`
* `batch/datalake_consumer.py`
* `analytics/duckdb_olap.py`
* `analytics/MinIO-DuckDB.sql`
