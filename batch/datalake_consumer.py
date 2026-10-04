"""Data Lake Consumer for StreamClick Batch Ingestion.

Module này tiêu thụ các sự kiện Clickstream từ Redpanda Broker, gom thành
micro-batch trong bộ nhớ và nén thành định dạng Apache Parquet trước khi
lưu trữ phân vùng vào MinIO Data Lake.
"""

import sys
from pathlib import Path
import logging
import time
from typing import Any, Dict, List, Optional

import json
import io
import uuid
import pandas as pd
from datetime import datetime
from confluent_kafka import Consumer, KafkaError


# Add project root to sys.path for direct script execution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from confluent_kafka import Consumer
from core.config import settings
from core.adapters.storage.minio import MinIOClient

logger = logging.getLogger("streamclick.datalake")


class DataLakeConsumer:
    """Consumer chuyên trách tiêu thụ sự kiện từ Redpanda và nạp vào Data Lake.

    Attributes:
        batch_size (int): Số lượng bản ghi tối đa trong một micro-batch.
        flush_interval_seconds (float): Thời gian chờ tối đa giữa các lần xả đệm (giây).
        consumer (Consumer): Instance Kafka/Redpanda Consumer.
        storage (MinIOClient): Singleton client tương tác với MinIO Object Storage.
        buffer (List[Dict[str, Any]]): Bộ nhớ đệm RAM lưu trữ tạm các sự kiện trước khi ghi.
        last_flush_time (float): Timestamp ghi nhận thời điểm xả đệm gần nhất.
    """

    def __init__(
        self,
        batch_size: int = 5000,
        flush_interval_seconds: float = 60.0,
        group_id: str = "streamclick-datalake-group",
    ):
        """Khởi tạo DataLakeConsumer với cấu hình Micro-batching và Storage."""
        self.batch_size = batch_size
        self.flush_interval_seconds = flush_interval_seconds
        self.buffer: List[Dict[str, Any]] = []
        self.last_flush_time = time.time()

        # Báo cho Checker biết các biến này chắc chắn tồn tại
        assert settings.S3_ENDPOINT_URL is not None, "S3_ENDPOINT_URL must be valid"
        assert settings.S3_ACCESS_KEY is not None, "S3_ACCESS_KEY must be valid"
        assert settings.S3_SECRET_KEY is not None, "S3_SECRET_KEY must be valid"

        # NFN: Khởi tạo Storage Client (Singleton Connection Pool)
        self.storage = MinIOClient(
            endpoint_url=settings.S3_ENDPOINT_URL,
            access_key=settings.S3_ACCESS_KEY,
            secret_key=settings.S3_SECRET_KEY,
            bucket_name=settings.S3_BUCKET_NAME,
            region_name=settings.S3_REGION_NAME,
            use_ssl=settings.S3_SECURE,
        )

        # FN & NFN: Cấu hình Consumer với Manual Commit để đảm bảo At-Least-Once
        consumer_conf = {
            "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
            "group.id": group_id,
            "auto.offset.reset": "earliest",
            "enable.auto.commit": False,  # Bắt buộc tắt auto-commit
        }

        self.consumer = Consumer(consumer_conf)
        self.consumer.subscribe([settings.KAFKA_TOPIC_CLICKSTREAM])
        logger.info(
            f"DataLakeConsumer subscribed to topic '{settings.KAFKA_TOPIC_CLICKSTREAM}' "
            f"[Group: {group_id}, BatchSize: {batch_size}, FlushInterval: {flush_interval_seconds}s]"
        )

    def run(self) -> None:
        """
        Event-loop tiêu thụ topic từ Redpanda
        """
        logger.info("Starting DataLake consumer loop...")

        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)

                current_time = time.time()
                if(current_time - self.last_flush_time) >= self.flush_interval_seconds:
                    if self.buffer:
                        self._flush_buffer()
                    self.last_flush_time = current_time
                
                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # Bỏ qua thông báo đã đọc đến cuối phân vùng (không phải lỗi)
                        continue
                    logger.error(f"Kafka Consumer error: {msg.error()}")
                    continue

                try:
                    raw_value = msg.value().decode("utf-8")
                    payload = json.loads(raw_value)
                    self.buffer.append(payload)

                    # Micro-batching
                    if len(self.buffer) >= self.batch_size:
                        self._flush_buffer()
                        self.last_flush_time = time.time()


                except Exception as e:
                    # Bỏ qua lỗi tránh crash process
                    logger.warning(f"Ignore error message at offset: {msg.offset()}: {e}") 
                    continue

        except KeyboardInterrupt:
            logger.info("Consumer stopped by user!")
        finally: # Xả hêt message trong RAM Buffer để tránh mất dữ liệu
            if getattr(self, 'buffer', None):
                self._flush_buffer()
            self.consumer.close()
            logger.info("Kafka Consumer closed gracefully.")


    def _flush_buffer(self) -> None:
        """
        Xử lý đẩy dữ liệu từ RAM lên DataLake và Commit Offset.
        """

        if not self.buffer:
            return 

        record_count = len(self.buffer)
        logger.info(f"Triggered flush: {record_count} records...")

        try:
            batch_df = pd.DataFrame(self.buffer)

            parquet_buffer = io.BytesIO() # Ghi lên RAM thay vì Ổ đĩa
            batch_df.to_parquet(parquet_buffer, engine="pyarrow", index=False)

            # Hive Partition Path
            now = datetime.now()
            partition_path = (
                f"raw/clickstream/"
                f"year={now.strftime('%Y')}/"
                f"month={now.strftime('%m')}/"
                f"day={now.strftime('%d')}/"
                f"hour={now.strftime('%H')}/"
                f"batch_{uuid.uuid4().hex}.parquet"
            )

            # Upload to MinIO
            success = self.storage.upload_bytes(
                data=parquet_buffer.getvalue(),
                destination_path=partition_path
            )

            if success:
                logger.info(f"Successfully uploaded {record_count} records to {partition_path}")
                self.consumer.commit()
                # CHỈ dọn dẹp RAM sau khi mọi thứ đã được ghi nhận an toàn
                self.buffer.clear()
            else:
                # Nếu upload thất bại, văng lỗi để ngừng luồng commit.
                # Lần chạy sau Kafka sẽ tự gửi lại (At-Least-Once).
                raise RuntimeError("Failed to upload Parquet to MinIO.")
            

        except Exception as e:
            logger.error(f"Error during flush_buffer: {e}")
            raise


if __name__ == "__main__":
    consumer = DataLakeConsumer()
    consumer.run()