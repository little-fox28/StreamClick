from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


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
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_CLICKSTREAM: str = "events.clickstream.raw"
    KAFKA_CONSUMER_GROUP: str = "streamclick-consumer-group"

    # Object Storage / Data Lake
    STORAGE_TYPE: str = "s3"  # Options: s3, gcs
    S3_ENDPOINT_URL: Optional[str] = "http://localhost:9000"
    S3_ACCESS_KEY: Optional[str] = "minioadmin"
    S3_SECRET_KEY: Optional[str] = "minioadmin"
    S3_BUCKET_NAME: str = "clickstream-lake"
    S3_REGION_NAME: str = "us-east-1"
    S3_SECURE: bool = False

    # Serving Database (PostgreSQL)
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "streamclick"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_secret_pw"

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
