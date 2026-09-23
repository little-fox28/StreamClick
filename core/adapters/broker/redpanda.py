import json
from typing import Dict, Any
import time
import logging
import threading
from typing import Optional
from confluent_kafka import Producer, KafkaException

from core.adapters.broker.base import AbstractMessagePublisher

logger = logging.getLogger(__name__)
class RedpandaPublisher(AbstractMessagePublisher):
    """
    Thread-Safe Singleton Adapter cho Redpanda. 
    - Đảm bảo FastAPI nhận hàng nghìn request đồng thời trên nhiều thread, chỉ có Duy nhất 1 kết nối (Producer instance) được tạo trong bộ nhớ.
    """

    _instance: Optional['RedpandaPublisher'] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *arg, **kwargs):
        """
        Kĩ thuật Double-checked Locking đảm bảo tính Thread-Safe cho Singleton
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(RedpandaPublisher, cls).__new__(cls)  
                    cls._instance._initialized = False         
        return cls._instance

    def __init__(self, bootstrap_servers: str, max_retries: int = 5, retry_interval: float = 2.0):
        # Đảm bảo logic init chỉ được chạy 1 lần duy nhất khi instance được tạo.
        if self._initialized:
            return

        self.bootstrap_servers = bootstrap_servers
        self.max_retries = max_retries
        self.retry_interval = retry_interval
        self._producer: Optional[Producer] = None
        self._producer_lock = threading.Lock()

        self.connect()
        self._initialized = True

    def connect(self) -> None:
        """
        Khởi tạo kết nối với cơ chế Retry Backoff chống lỗi Network / Startup Delay.
        """

        conf = {
            'bootstrap.servers': self.bootstrap_servers,
            'client.id': 'streamclick-redpanda-publisher',
            'acks': 'all',                  # Đảm bảo độ bền dữ liệu cao nhất (Strong Durability)
            'retries': 3,
            'retry.backoff.ms': 250,
            'linger.ms': 5,                 # Gom micro-batch 5ms để đạt throughput cao
            'compression.type': 'snappy',   # Nén snappy tối ưu băng thông
        }

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(f"Connecting to Redpanda at {self.bootstrap_servers}...")

                with self._producer_lock:
                    self._producer = Producer(conf)

                logger.info("Initial Redpanda Producer successful ✅")
                return
            except KafkaException as e:
                logger.warning(f"Unable to connect to Redpanda (Time:{attempt }): {e}")
                if attempt < self.max_retries:
                    time.sleep(self.retry_interval)
                else:
                    logger.error("❌Cannot connect to Redpanda")

    def _delivery_callback(self, err, msg):
        """
        Hàm callback chạy ngầm nhận phản hồi từ broker.
        """
        if err is not None:
            logger.error(f"Gửi message thất bại: {err}")
        else:
            logger.debug(f"Đã gửi tới topic {msg.topic()} [Partition: {msg.partition()}] tại offset {msg.offset()}")

    def publish(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        """
        Bắn event vào topic bất đồng bộ (Non-blocking).
        """
        if self._producer is None:
            logger.error("The producer is not ready. Attempting to reconnect...")
            self.connect()
            if self._producer is None:
                return False
        try:
            payload = json.dumps(message).encode("utf-8")
            partition_key = key.encode("utf-8") if key else None  # Đảm bảo thứ tự sự event
            with self._producer_lock:
                self._producer.produce(
                    topic=topic,
                    value=payload,
                    key=partition_key,
                    on_delivery=self._delivery_callback()
                )
                # Kích hoạt phục vụ hàng đợi callback mà không block thread
                self._producer.poll(0)
            return True
        except BufferError:
            # Xử lý khi bộ đệm RAM của Producer bị đầy.
            logger.warning("Producer buffer full! Flushing and retrying...")
            self.flush(timeout=1.0)
            try:
                with self._producer_lock:
                    self._producer.produce(
                        topic=topic,
                        value=payload,
                        key=partition_key,
                        on_delivery=self._delivery_callback
                    )
                return True
            except Exception as e:
                logger.exception(f"Retrying after failure: {e}")
                return False
        except Exception as e:
            logger.exception(f"Unknown error when publishing to the topic {topic}: {e}")
            return False

    def flush(self, timeout: float = 5.0) -> None:
        """
        Xả toàn bộ tin còn tồn trong buffer xuống mạng.
        """
        if self._producer:
            self._producer.flush(timeout=timeout)

    def close(self) -> None:
        """
        Xả toàn bộ buffer và đóng kết nối an toàn.
        """
        if self._producer:
            logger.info("Flushing buffer and closing Redpanda connection...")
            self.flush(timeout=5.0)
            self._producer = None
            self._initialized = False


# Alias tương thích ngược với Kafa
KafkaMessagePublisher = RedpandaPublisher