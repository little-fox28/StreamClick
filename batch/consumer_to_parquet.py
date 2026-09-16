import io
import json
import logging
from datetime import datetime, timezone
import pyarrow as pa
import pyarrow.parquet as pq
from confluent_kafka import Consumer, KafkaException

from core.config import settings
from core.adapters.storage.s3_storage import S3StorageClient

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("streamclick.batch")


def run_batch_writer(batch_size: int = 50, timeout_seconds: float = 10.0):
    """
    Consumes clickstream events from broker and flushes them as compressed Parquet files to MinIO Lake.
    """
    storage = S3StorageClient(
        endpoint_url=settings.S3_ENDPOINT_URL,
        access_key=settings.S3_ACCESS_KEY,
        secret_key=settings.S3_SECRET_KEY,
        bucket_name=settings.S3_BUCKET_NAME,
        region_name=settings.S3_REGION_NAME,
        secure=settings.S3_SECURE
    )

    conf = {
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        'group.id': 'streamclick-batch-archiver',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True
    }

    consumer = Consumer(conf)
    consumer.subscribe([settings.KAFKA_TOPIC_CLICKSTREAM])
    logger.info(f"Subscribed to topic '{settings.KAFKA_TOPIC_CLICKSTREAM}' for Parquet batch ingestion...")

    buffer = []
    
    try:
        while True:
            msg = consumer.poll(timeout=timeout_seconds)
            if msg is None:
                if buffer:
                    flush_buffer_to_minio(buffer, storage)
                    buffer.clear()
                continue
            if msg.error():
                logger.error(f"Consumer error: {msg.error()}")
                continue

            event_data = json.loads(msg.value().decode('utf-8'))
            buffer.append(event_data)

            if len(buffer) >= batch_size:
                flush_buffer_to_minio(buffer, storage)
                buffer.clear()

    except KeyboardInterrupt:
        logger.info("Stopping batch consumer...")
    finally:
        if buffer:
            flush_buffer_to_minio(buffer, storage)
        consumer.close()


def flush_buffer_to_minio(records: list, storage: S3StorageClient):
    if not records:
        return

    table = pa.Table.from_pylist(records)
    sink = io.BytesIO()
    pq.write_table(table, sink, compression='snappy')
    sink.seek(0)

    now = datetime.now(timezone.utc)
    key_prefix = f"raw/events/year={now.year}/month={now.month:02d}/day={now.day:02d}"
    filename = f"events_{now.strftime('%Y%m%d_%H%M%S')}_{len(records)}_records.parquet"
    destination_key = f"{key_prefix}/{filename}"

    success = storage.upload_bytes(sink.getvalue(), destination_key)
    if success:
        logger.info(f"Successfully archived {len(records)} events to s3://{settings.S3_BUCKET_NAME}/{destination_key}")
    else:
        logger.error(f"Failed to archive batch to {destination_key}")


if __name__ == "__main__":
    run_batch_writer()
