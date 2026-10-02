from functools import lru_cache
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from typing_extensions import Self


class Settings(BaseSettings):
    """
    12-Factor App Externalized Configuration using Pydantic Settings.
    Reads from environment variables and `.env` file automatically.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "StreamClick"
    LOG_LEVEL: str = "INFO"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Message Broker
    BROKER_TYPE: str = "kafka"  # Options: kafka, pubsub
    KAFKA_BOOTSTRAP_SERVERS: str
    KAFKA_TOPIC_CLICKSTREAM: str
    KAFKA_CONSUMER_GROUP: str

    # Object Storage / Data Lake
    STORAGE_TYPE: str = "s3"  # Options: s3, gcs
    S3_ENDPOINT_URL: Optional[str] = None       
    S3_ACCESS_KEY: Optional[str] = None         
    S3_SECRET_KEY: Optional[str] = None         
    S3_BUCKET_NAME: str
    S3_REGION_NAME: str = "us-east-1"
    S3_SECURE: bool = False

    @model_validator(mode="after")
    def validate_s3_credentials(self) -> Self:
        """Kiểm tra bắt buộc (Fail-Fast) tính hợp lệ của S3 credentials.

        Khi `STORAGE_TYPE=s3` và `S3_ENDPOINT_URL` được cung cấp (MinIO mode),
        `S3_ACCESS_KEY` và `S3_SECRET_KEY` là bắt buộc. Nếu thiếu, ứng dụng
        phải từ chối khởi động ngay lập tức thay vì âm thầm dùng giá trị mặc định.

        Raises:
            ValueError: Nếu thiếu credentials khi cần thiết.

        Returns:
            Self: Instance Settings đã được xác thực.
        """
        if self.STORAGE_TYPE == "s3" and self.S3_ENDPOINT_URL is not None:
            # MinIO mode: explicit endpoint nghĩa là KHÔNG dùng IAM Role -> phải có key
            missing = []
            if not self.S3_ACCESS_KEY:
                missing.append("S3_ACCESS_KEY")
            if not self.S3_SECRET_KEY:
                missing.append("S3_SECRET_KEY")
            if missing:
                raise ValueError(
                    f"Missing required S3 credentials for MinIO mode: {', '.join(missing)}. "
                    f"Set them via .env file or environment variables. "
                    f"Never hardcode credentials in source code."
                )
        return self

    # Serving Database (PostgreSQL)
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    # GCP Cloud Migration Stubs
    GCP_PROJECT_ID: Optional[str] = None
    GCP_PUBSUB_TOPIC: Optional[str] = None
    GCP_GCS_BUCKET: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    """
    Singleton Pattern thông qua @lru_cache.
    Đảm bảo việc đọc ổ đĩa và prase cấu hình chỉ diễn ra 1 lần duy nhất.
    """
    return Settings()


settings = Settings()
