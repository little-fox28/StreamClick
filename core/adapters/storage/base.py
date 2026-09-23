from abc import ABC, abstractmethod
from typing import List, Optional


class AbstractStorageClient(ABC):
    """
    Abstract Base Class cho Object Storage / Data Lake (Port Interface).
    Hỗ trợ thay thế linh hoạt giữa MinIO, AWS S3 và Google Cloud Storage (GCS).
    """

    @abstractmethod
    def upload_file(self, local_path: str, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """Upload một file từ ổ đĩa cục bộ lên Data Lake."""
        pass

    @abstractmethod
    def upload_bytes(self, data: bytes, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """
        Upload trực tiếp byte buffer từ RAM lên Data Lake (Stateless in-memory upload).
        """
        pass

    @abstractmethod
    def download_file(self, source_path: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
        """Download một object từ Data Lake về ổ đĩa cục bộ."""
        pass

    @abstractmethod
    def list_objects(self, prefix: str = "", bucket_name: Optional[str] = None) -> List[str]:
        """Liệt kê toàn bộ object keys theo prefix (partition path)."""
        pass


# Alias hỗ trợ tương thích ngược
StorageClient = AbstractStorageClient
