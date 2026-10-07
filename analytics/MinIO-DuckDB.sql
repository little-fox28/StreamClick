-- 1. Tải và kích hoạt tính năng kết nối S3/MinIO
INSTALL httpfs;
LOAD httpfs;

-- 2. Khai báo Credentials MinIO (Thay đổi thông tin nếu .env của bạn khác)
CREATE SECRET minio_secret (
    TYPE S3,
    KEY_ID 'minioadmin',
    SECRET 'minioadmin',
    REGION 'us-east-1',
    ENDPOINT 'localhost:9000',
    USE_SSL false,
    URL_STYLE 'path'
);

-- Truy vấn 100 dòng đầu tiên
SELECT * 
FROM read_parquet('s3://clickstream-lake/raw/clickstream/*/*/*/*/*.parquet', hive_partitioning=1)
LIMIT 100;
