from abc import ABC, abstractmethod
from typing import Any, BinaryIO, Optional


class StorageClient(ABC):
    """
    Abstract Base Class for Data Lake / Object Storage client (Adapter Pattern).
    Decouples storage operations from specific vendors (MinIO, AWS S3, Google Cloud Storage).
    """

    @abstractmethod
    def upload_file(self, local_path: str, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """Upload a file from local path or memory to remote object storage."""
        pass

    @abstractmethod
    def upload_bytes(self, data: bytes, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """Upload in-memory bytes (e.g. serialized Parquet buffer) directly to object storage."""
        pass

    @abstractmethod
    def download_file(self, source_path: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
        """Download an object from remote storage to local filesystem."""
        pass

    @abstractmethod
    def list_objects(self, prefix: str = "", bucket_name: Optional[str] = None) -> list[str]:
        """List object keys under a given prefix."""
        pass
