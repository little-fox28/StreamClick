from typing import Optional
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod

class AbstractMessagePublisher(ABC):
    """
    Abstract Base Class cho Message Broker Publishers (Port Interface)
    """

    @abstractmethod
    def connect(self) -> None: 
        """
        Thiết lập kết nối đến Message Broker.
        """
        pass

    @abstractmethod
    def publish(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        """
        Publish một payload sự kiện (dict) vào topic chỉ định.

        :parm topic:    Tên của topic/channel nhận dữ liệu.
        :parm message:  Dict chứa dữ liệu sự kiện (payload).
        :param key:     key định tuyến partition (đảm bảo sự kiện theo User/Session).
        :return:        True nếu event đã vào hàng đợi / publish thành công, False nếu thất bại.
        """
        pass

    @abstractmethod
    def flush(self, timeout: float = 5.0) -> None:
        """
        Xả toàn bộ message còn trong bộ nhớ đệm (Buffer) xuống Broker.
        """
        pass

    @abstractmethod
    def close(self) -> None:
        """
        Đóng toàn bộ kết nối an toàn, giải phóng socket và network.
        """
        pass

# Hỗ trợ tương thích ngược (backward compatibility)
MessagePublisher = AbstractMessagePublisher