import sys
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from core.config import settings
import duckdb

def inital_duckdb():
    print("Initial DuckDB in memory...")
    conn = duckdb.connect(database=":memory:")

    print("Install httpfs extension to connect DataLake...")
    conn.execute("INSTALL httpfs;")
    conn.execute("LOAD httpfs;")

    print("Initial DuckDB successfull")

    return conn

def configure_minio(conn):

    raw_endpoint = settings.S3_ENDPOINT_URL.replace("http://", "").replace("https://", "")
    use_ssl_str = "true" if settings.S3_SECURE else "false"

    query = f"""
        CREATE SECRET minio_secret (
            TYPE S3,
            KEY_ID '{settings.S3_ACCESS_KEY}',
            SECRET '{settings.S3_SECRET_KEY}',
            REGION '{settings.S3_REGION_NAME}',
            ENDPOINT '{raw_endpoint}',
            USE_SSL {use_ssl_str},
            URL_STYLE 'path'
        );
    """
    conn.execute(query)
    print("MinIO configuration successfull")

def query_with_parttion_pruning(conn):
    # Dùng ký tự đại diện (*) để quét mọi thư mục con
    # bật hive_partitioning=1 để tự động nhận diện cột phân vùng (year, month, day, hour)
    query = f"""
        SELECT * 
        FROM read_parquet('s3://{settings.S3_BUCKET_NAME}/raw/clickstream/*/*/*/*/*.parquet', hive_partitioning=1)
        LIMIT 10;
    """
    # Hàm .df() của DuckDB sẽ tự động chuyển kết quả SQL thành Pandas DataFrame
    df = conn.execute(query).df()
    print(df)

def analyze_conversion_funnel(conn):
    print("\n📊 Đang phân tích Phễu chuyển đổi (Conversion Funnel)...")
    
    query = f"""
        WITH funnel_counts AS (
            SELECT 
                -- Đếm số lượng phiên giao dịch (session) duy nhất cho từng hành động
                COUNT(DISTINCT CASE WHEN event_type IN ('view', 'view_item', 'product_view') THEN user_session END) AS total_views,
                COUNT(DISTINCT CASE WHEN event_type IN ('cart', 'add_to_cart') THEN user_session END) AS total_carts,
                COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_session END) AS total_purchases
            FROM read_parquet('s3://{settings.S3_BUCKET_NAME}/raw/clickstream/*/*/*/*/*.parquet', hive_partitioning=1)
        )
        SELECT 
            total_views,
            total_carts,
            total_purchases,
            -- Tính tỷ lệ phần trăm (dùng NULLIF để tránh lỗi chia cho 0)
            ROUND(total_carts * 100.0 / NULLIF(total_views, 0), 2) AS view_to_cart_pct,
            ROUND(total_purchases * 100.0 / NULLIF(total_carts, 0), 2) AS cart_to_purchase_pct,
            ROUND(total_purchases * 100.0 / NULLIF(total_views, 0), 2) AS overall_conversion_pct
        FROM funnel_counts;
    """
    
    df = conn.execute(query).df()
    
    print("-" * 60)
    print("BÁO CÁO PHỄU CHUYỂN ĐỔI (CONVERSION FUNNEL)")
    print("-" * 60)
    print(df.to_string(index=False))
    print("-" * 60)


if __name__ == "__main__":
    conn = inital_duckdb()
    configure_minio(conn)
    query_with_parttion_pruning(conn)
    # Gọi thêm hàm phân tích phễu
    analyze_conversion_funnel(conn)