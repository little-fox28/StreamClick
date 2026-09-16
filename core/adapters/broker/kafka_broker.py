import json
import logging
from typing import Any, Dict, Optional
from confluent_kafka import Producer

from core.adapters.broker.base import MessagePublisher

logger = logging.getLogger(__name__)


class KafkaMessagePublisher(MessagePublisher):
    """
    Kafka / Redpanda implementation of MessagePublisher adapter.
    """

    def __init__(self, bootstrap_servers: str):
        self.bootstrap_servers = bootstrap_servers
        self._producer: Optional[Producer] = None

    def connect(self) -> None:
        if self._producer is None:
            conf = {
                'bootstrap.servers': self.bootstrap_servers,
                'client.id': 'streamclick-ingestion-producer',
                'acks': 'all',  # Strong durability
                'retries': 3,
                'linger.ms': 5,
            }
            self._producer = Producer(conf)
            logger.info(f"Connected to Kafka/Redpanda at {self.bootstrap_servers}")

    def _delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    def publish(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        if self._producer is None:
            self.connect()
        try:
            payload = json.dumps(message).encode('utf-8')
            kafka_key = key.encode('utf-8') if key else None
            self._producer.produce(
                topic=topic,
                value=payload,
                key=kafka_key,
                on_delivery=self._delivery_report
            )
            # Serve delivery reports from previous produce calls
            self._producer.poll(0)
            return True
        except Exception as e:
            logger.exception(f"Error publishing message to {topic}: {e}")
            return False

    def close(self) -> None:
        if self._producer:
            self._producer.flush(timeout=5.0)
            logger.info("Kafka producer flushed and closed.")
