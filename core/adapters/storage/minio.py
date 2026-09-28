import io
import logging
import os
import threading
from typing import List, Optional

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError, EndpointConnectionError

from core.adapters.storage.base import AbstractStorageClient

logger = logging.getLogger(__name__)


class MinIOClient(AbstractStorageClient):
    """Client kết nối và tương tác với MinIO / AWS S3 Object Storage.

    Lớp này triển khai kiến trúc Thread-Safe Singleton sử dụng cơ chế
    Double-Checked Locking, tích hợp HTTP Connection Pooling và cơ chế
    tự phục hồi (Exponential Backoff / Adaptive Retries) để đảm bảo độ tin cậy
    trong môi trường Ingestion & Batch Processing phân tán.

    Attributes:
        endpoint_url (str): Địa chỉ URL endpoint của MinIO/S3 (ví dụ: http://localhost:9000).
        access_key (str): Khóa truy cập (Access Key ID).
        secret_key (str): Khóa bí mật (Secret Access Key).
        default_bucket (str): Tên bucket mặc định của data Lake.
        region_name (str): Vùng lưu trữ AWS/MinIO (mặc định 'us-east-1').
        use_ssl (bool): Cờ bật/tắt giao thức TLS/HTTPS.
    """

    _instance: Optional["MinIOClient"] = None
    _lock: threading.Lock = threading.Lock()
    _initialized: bool = False

    def __new__(cls, *args, **kwargs) -> "MinIOClient":
        """Khởi tạo hoặc trả về instance Singleton duy nhất của MinIOClient.

        Sử dụng cơ chế Double-Checked Locking đảm bảo an toàn tuyệt đối
        trong môi trường đa luồng (Multi-threaded Concurrency).

        Returns:
            MinIOClient: Instance Singleton dùng chung cho toàn bộ tiến trình.
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(MinIOClient, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        endpoint_url: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        region_name: str = "us-east-1",
        use_ssl: bool = False,
        secure: Optional[bool] = None,
        max_pool_connections: int = 50,
        **kwargs,
    ) -> None:
        """Khởi tạo kết nối S3 Client với Connection Pooling tối ưu.

        Args:
            endpoint_url: URL của MinIO hoặc S3 storage.
            access_key: Access Key ID cho xác thực.
            secret_key: Secret Access Key cho xác thực.
            bucket_name: Tên bucket mặc định làm data Lake storage.
            region_name: Khu vực địa lý S3.
            use_ssl: Cờ kích hoạt kết nối bảo mật HTTPS.
            secure: Tham số tương thích ngược, ghi đè use_ssl nếu được truyền.
            max_pool_connections: Số lượng HTTP connections tối đa trong pool.
            **kwargs: Các tham số mở rộng khác.
        """
        if self._initialized:
            return

        with self._lock:
            if self._initialized:
                return

            self.endpoint_url = endpoint_url
            self.access_key = access_key
            self.secret_key = secret_key
            self.default_bucket = bucket_name
            self.region_name = region_name
            self.use_ssl = secure if secure is not None else use_ssl

            boto_config = Config(
                signature_version="s3v4",
                max_pool_connections=max_pool_connections,
                connect_timeout=10,
                read_timeout=30,
                retries={"max_attempts": 3, "mode": "adaptive"},
            )

            logger.info("Initializing S3/MinIO client connection pool (max_pool_connections=%d)...", max_pool_connections)
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region_name,
                use_ssl=self.use_ssl,
                config=boto_config,
            )

            self._ensure_bucket_exists(self.default_bucket)
            self._initialized = True

    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        """Kiểm tra sự tồn tại của bucket và tự động khởi tạo nếu chưa có.

        Giúp đảm bảo tính sẵn sàng (Fault Tolerant & Self-healing) khi khởi động
        hệ thống mới mà không yêu cầu can thiệp thủ công từ quản trị viên.

        Args:
            bucket_name: Tên bucket cần kiểm tra.
        """
        try:
            self._s3_client.head_bucket(Bucket=bucket_name)
            logger.info("Target data Lake bucket '%s' is verified and ready.", bucket_name)
        except ClientError as exc:
            error_code = str(exc.response.get("Error", {}).get("Code", ""))
            if error_code in ["404", "NoSuchBucket", "NotFound"]:
                logger.warning("Bucket '%s' does not exist. Creating bucket automatically...", bucket_name)
                try:
                    self._s3_client.create_bucket(Bucket=bucket_name)
                    logger.info("Successfully created data Lake bucket '%s'.", bucket_name)
                except Exception as create_exc:
                    logger.error("Failed to create bucket '%s': %s", bucket_name, create_exc)
            else:
                logger.warning("Error checking bucket '%s': %s", bucket_name, exc)
        except EndpointConnectionError as conn_exc:
            logger.error("Cannot connect to MinIO/S3 endpoint at %s: %s", self.endpoint_url, conn_exc)
        except Exception as exc:
            logger.exception("Unexpected error while verifying bucket '%s': %s", bucket_name, exc)

    def upload_file(self, local_path: str, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """Upload một file từ ổ đĩa cục bộ lên data Lake.

        Áp dụng kiểm tra phòng thủ (Defensive Programming) để tránh ngoại lệ
        khi file nguồn không tồn tại.

        Args:
            local_path: Đường dẫn tuyệt đối hoặc tương đối tới file cục bộ.
            destination_path: Khóa đối tượng (S3 Object Key) trên data Lake.
            bucket_name: Tên bucket chỉ định, mặc định dùng default_bucket.

        Returns:
            bool: True nếu upload thành công, False nếu thất bại.
        """
        target_bucket = bucket_name or self.default_bucket

        if not os.path.isfile(local_path):
            logger.error("Local file does not exist: '%s'. Aborting upload.", local_path)
            return False

        try:
            self._s3_client.upload_file(local_path, target_bucket, destination_path)
            logger.info("Successfully uploaded file '%s' to s3://%s/%s", local_path, target_bucket, destination_path)
            return True
        except (ClientError, EndpointConnectionError, BotoCoreError) as exc:
            logger.error("Network or S3 error uploading file '%s' to s3://%s/%s: %s", local_path, target_bucket, destination_path, exc)
            return False
        except Exception as exc:
            logger.exception("Unexpected error uploading file '%s' to s3://%s/%s: %s", local_path, target_bucket, destination_path, exc)
            return False

    def upload_bytes(self, data: bytes, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        """Upload trực tiếp byte buffer từ bộ nhớ RAM lên data Lake.

        Phương pháp Stateless in-memory upload này loại bỏ chi phí I/O ghi đĩa
        tạm, tối ưu hóa thông lượng (Throughput) cho các luồng Batch & Streaming.

        Args:
            data: Dữ liệu nhị phân (bytes) cần lưu trữ.
            destination_path: Khóa đối tượng (S3 Object Key) trên data Lake.
            bucket_name: Tên bucket chỉ định, mặc định dùng default_bucket.

        Returns:
            bool: True nếu upload thành công, False nếu thất bại.
        """
        target_bucket = bucket_name or self.default_bucket

        if not isinstance(data, (bytes, bytearray)):
            logger.error("Provided data is not bytes-like (type: %s). Aborting upload.", type(data).__name__)
            return False

        try:
            buffer = io.BytesIO(data)
            self._s3_client.upload_fileobj(buffer, target_bucket, destination_path)
            logger.info("Successfully uploaded %d bytes to s3://%s/%s", len(data), target_bucket, destination_path)
            return True
        except (ClientError, EndpointConnectionError, BotoCoreError) as exc:
            logger.error("Network or S3 error uploading bytes to s3://%s/%s: %s", target_bucket, destination_path, exc)
            return False
        except Exception as exc:
            logger.exception("Unexpected error uploading bytes to s3://%s/%s: %s", target_bucket, destination_path, exc)
            return False

    def download_file(self, source_path: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
        """Download một object từ data Lake về ổ đĩa cục bộ.

        Tự động tạo các thư mục cha nếu chưa tồn tại trên hệ thống tệp cục bộ.

        Args:
            source_path: Khóa đối tượng nguồn trên S3/MinIO.
            local_path: Đường dẫn đích trên ổ đĩa cục bộ.
            bucket_name: Tên bucket chỉ định, mặc định dùng default_bucket.

        Returns:
            bool: True nếu download thành công, False nếu thất bại.
        """
        target_bucket = bucket_name or self.default_bucket

        try:
            parent_dir = os.path.dirname(local_path)
            if parent_dir:
                os.makedirs(parent_dir, exist_ok=True)

            self._s3_client.download_file(target_bucket, source_path, local_path)
            logger.info("Successfully downloaded s3://%s/%s to '%s'", target_bucket, source_path, local_path)
            return True
        except (ClientError, EndpointConnectionError, BotoCoreError) as exc:
            logger.error("Network or S3 error downloading s3://%s/%s to '%s': %s", target_bucket, source_path, local_path, exc)
            return False
        except Exception as exc:
            logger.exception("Unexpected error downloading s3://%s/%s to '%s': %s", target_bucket, source_path, local_path, exc)
            return False

    def list_objects(self, prefix: str = "", bucket_name: Optional[str] = None) -> List[str]:
        """Liệt kê toàn bộ object keys theo prefix (partition path).

        Sử dụng cơ chế Paginator (list_objects_v2) để quét toàn bộ dữ liệu
        mà không bị giới hạn 1,000 keys của giao thức S3 tiêu chuẩn.

        Args:
            prefix: Tiền tố đường dẫn partition (ví dụ: 'raw/events/year=2026/').
            bucket_name: Tên bucket chỉ định, mặc định dùng default_bucket.

        Returns:
            List[str]: Danh sách các object keys khớp với prefix.
        """
        target_bucket = bucket_name or self.default_bucket

        try:
            paginator = self._s3_client.get_paginator("list_objects_v2")
            keys: List[str] = []

            for page in paginator.paginate(Bucket=target_bucket, Prefix=prefix):
                for item in page.get("Contents", []):
                    keys.append(item["Key"])

            logger.debug("Listed %d objects under prefix '%s' in bucket '%s'.", len(keys), prefix, target_bucket)
            return keys
        except (ClientError, EndpointConnectionError, BotoCoreError) as exc:
            logger.error("Failed to list objects in s3://%s with prefix '%s': %s", target_bucket, prefix, exc)
            return []
        except Exception as exc:
            logger.exception("Unexpected error listing objects in s3://%s with prefix '%s': %s", target_bucket, prefix, exc)
            return []

    def close(self) -> None:
        """Đóng kết nối và giải phóng tài nguyên client.

        Phương thức hỗ trợ cơ chế Graceful Shutdown cho FastAPI Lifespan
        hoặc các Batch Processing jobs khi dừng ứng dụng.
        """
        logger.info("Closing MinIO/S3 storage client resources...")
        with self._lock:
            self._initialized = False
            MinIOClient._instance = None


# Alias hỗ trợ tương thích ngược cho AWS S3 và các mô-đun phụ thuộc
S3StorageClient = MinIOClient
