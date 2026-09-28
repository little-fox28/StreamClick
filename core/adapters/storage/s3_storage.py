"""
AWS S3 & MinIO Storage Adapter Compatibility Wrapper.
Provides backwards compatibility for legacy and module imports.
"""

from core.adapters.storage.minio import MinIOClient, S3StorageClient

__all__ = ["MinIOClient", "S3StorageClient"]
