from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class MessagePublisher(ABC):
    """
    Abstract Base Class for Message Broker publishers (Adapter Pattern).
    Decouples business logic from specific broker technologies (Redpanda, Kafka, GCP Pub/Sub).
    """

    @abstractmethod
    def connect(self) -> None:
        """Establish connection to the message broker."""
        pass

    @abstractmethod
    def publish(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        """
        Publish a message payload to a specified topic.
        
        :param topic: Name of the topic/channel
        :param message: Dict payload to be serialized and published
        :param key: Optional partition/ordering key
        :return: True if successfully queued/published, False otherwise
        """
        pass

    @abstractmethod
    def close(self) -> None:
        """Flush buffers and cleanly close the connection."""
        pass
