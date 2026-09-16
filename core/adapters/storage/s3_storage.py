import io
import logging
from typing import Optional, List
import boto3
from botocore.client import Config

from core.adapters.storage.base import StorageClient

logger = logging.getLogger(__name__)


class S3StorageClient(StorageClient):
    """
    MinIO / AWS S3 implementation of StorageClient adapter.
    """

    def __init__(
        self,
        endpoint_url: Optional[str],
        access_key: Optional[str],
        secret_key: Optional[str],
        bucket_name: str,
        region_name: str = "us-east-1",
        secure: bool = False
    ):
        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key
        self.default_bucket = bucket_name
        self.region_name = region_name
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region_name,
            config=Config(signature_version='s3v4')
        )
        self._ensure_bucket_exists(self.default_bucket)

    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
        except Exception:
            try:
                self.s3_client.create_bucket(Bucket=bucket_name)
                logger.info(f"Created bucket '{bucket_name}' in storage.")
            except Exception as e:
                logger.warning(f"Could not automatically create bucket {bucket_name}: {e}")

    def upload_file(self, local_path: str, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        target_bucket = bucket_name or self.default_bucket
        try:
            self.s3_client.upload_file(local_path, target_bucket, destination_path)
            return True
        except Exception as e:
            logger.exception(f"Failed to upload {local_path} to s3://{target_bucket}/{destination_path}: {e}")
            return False

    def upload_bytes(self, data: bytes, destination_path: str, bucket_name: Optional[str] = None) -> bool:
        target_bucket = bucket_name or self.default_bucket
        try:
            self.s3_client.upload_fileobj(io.BytesIO(data), target_bucket, destination_path)
            return True
        except Exception as e:
            logger.exception(f"Failed to upload bytes to s3://{target_bucket}/{destination_path}: {e}")
            return False

    def download_file(self, source_path: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
        target_bucket = bucket_name or self.default_bucket
        try:
            self.s3_client.download_file(target_bucket, source_path, local_path)
            return True
        except Exception as e:
            logger.exception(f"Failed to download s3://{target_bucket}/{source_path} to {local_path}: {e}")
            return False

    def list_objects(self, prefix: str = "", bucket_name: Optional[str] = None) -> List[str]:
        target_bucket = bucket_name or self.default_bucket
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            result = []
            for page in paginator.paginate(Bucket=target_bucket, Prefix=prefix):
                for obj in page.get('Contents', []):
                    result.append(obj['Key'])
            return result
        except Exception as e:
            logger.exception(f"Failed to list objects in s3://{target_bucket}/{prefix}: {e}")
            return []
