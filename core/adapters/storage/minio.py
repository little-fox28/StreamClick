import io
import threading
from typing import Optional, List
import logging

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, EndpointConnectionError


from core.adapters.storage.base import AbstractStorageClient


logger = logging.getLogger(__name__)

class MinIOClient(AbstractStorageClient):
    
    _instance: Optional['MinIOClient'] = None
    _lock: threading.Lock = threading.Lock()
    def __new__(cls, *args, **kwargs):
        """
        Double-checked Locking đảm bảo tính Thread-Safe cho Singleton.
        """
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(MinIOClient, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self,endpoint_url: str, access_key: str, secret_key: str, bucket_name: str, region_name: str = "us-east-1", use_ssl: bool = False):
        # Đảm bảo khởi tạo Threand cho MinIOClient chỉ 1 lần duy nhất
        if self._initialized:
            return

        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key
        self.default_bucket = bucket_name
        self.region_name = region_name
        self.use_ssl = use_ssl

        # Khởi tạo S3 client với Connection Polling tối ưu
        self._s3_client = boto3.client(
            "s3",
            endpoint_url = self.endpoint_url,
            aws_access_key_id = self.access_key,
            aws_secret_access_key = self.secret_key,
            region_name = self.region_name,
            use_ssl = self.use_ssl,
            config=Config(
                signature_version="s3v4",
                max_pool_connections=25,
                connect_timeout=25,
                read_timeout=10,
                retries={"max_attempts": 3, "mode": "standard"}
            )
        )

        self._ensure_bucket_exists(self.default_bucket)
        self._initialized = True

    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        """
        Kiểm tra và tự động tạo Bucket
        """
        try:
            self._s3_client.head_bucket(Bucket=bucket_name)
            logger.info(f"Target bucket '{bucket_name}' ready!!.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ["404", "NoSuchBucket"]:
                logger.info(f"Bucket '{bucket_name}' does not exist. Creating new...")
                try:
                    self._s3_client.create_bucket(Bucket=bucket_name)
                    logger.info(f"✅ Create '{bucket_name} success'.")
                except Exception as create_err:
                    logger.error(f"❌ Cann't create '{bucket_name}' error: {create_err}")
            else:
                logger.warning(f"Error checking bucket'{bucket_name}': {e}")
        except EndpointConnectionError as conn_err:
            logger.error(f"❌ Cann't connect to MinIO at {self.endpoint_url}: {conn_err}")

    def upload_file(self, local_path: str, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        target_bucket = bucket_name or self.default_bucket

        try:
            self._s3_client.upload_file(local_path, target_bucket, destination_path)
            logger.info(f"Successful upload {local_path} to s3://{target_bucket}/{destination_path}")
            return True
        except (ClientError, EndpointConnectionError) as e:
            logger.error(f"Networking error on upload file {local_path} to s3://{target_bucket}/{destination_path}: {e}")
            return False
        except Exception as e:
            logger.exception(f"Unknown error on upload file: {e}")
            return False

    def upload_bytes(self, data: bytes, destination_path: str, bucket_name: Optional[str] = None) -> bool:

        target_bucket = bucket_name or self.default_bucket

        try:
            buffer = io.BytesIO(data)

            self._s3_client.upload_fileobj(buffer, target_bucket, destination_path)
            logger.info(f"Successful upload{len(data)} bytes to s3://{target_bucket}/{destination_path}")
            return True
        except (ClientError, EndpointConnectionError) as e:
            logger.error(f"Networking error on upload bytes to s3://{target_bucket}/{destination_path}: {e}")
            return False
        except Exception as e:
            logger.exception(f"Unknown error on upload file: {e}")
            return False

    def download_file(self, source_path: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
        target_bucket = bucket_name or self.default_bucket

        try:
          self._s3_client.download_file(target_bucket, source_path, local_path)
          logger.info(f"Successful dowload s3://{target_bucket}/{source_path} in {local_path}")
          return True
        except Exception as e:
            logger.error(f"Error on Download file from s3://{target_bucket}/{source_path}: {e}")
            return False

    def list_objects(self, prefix = "", bucket_name: Optional[str] = None) -> List[str]:
        """
        Sử dụng Paginator để quét toàn bộ keys dưới một prefix mà không bị giới hạn 1000 keys của S3
        """
        target_bucket = bucket_name or self.default_bucket

        try:
            paginator = self._s3_client.get_paginator("list_objects_v2")
            keys = []
            for page in paginator.paginate(Bucket= target_bucket, Prefix = prefix):
                for item in page.get("Contents", []):
                    keys.append(item["Key"])
        
            return keys
        except Exception as e:
            logger.error(f"Error listing objects in s3://{target_bucket}/{prefix}: {e}")
            return []

        pass

# Alias hỗ trợ tương tích ngược 
S3StorageClient =  MinIOClient