import duckdb
from core.config import settings


def query_clickstream_lake():
    """
    Executes OLAP queries using DuckDB directly against MinIO/S3 Parquet Lake.
    """
    con = duckdb.connect(database=':memory:')

    # Install & Load httpfs extension for S3 support
    con.execute("INSTALL httpfs; LOAD httpfs;")

    # Configure S3/MinIO credentials in DuckDB
    endpoint = settings.S3_ENDPOINT_URL.replace("http://", "").replace("https://", "")
    con.execute(f"SET s3_endpoint='{endpoint}';")
    con.execute(f"SET s3_access_key_id='{settings.S3_ACCESS_KEY}';")
    con.execute(f"SET s3_secret_access_key='{settings.S3_SECRET_KEY}';")
    con.execute("SET s3_use_ssl=false;")
    con.execute("SET s3_url_style='path';")

    parquet_glob = f"s3://{settings.S3_BUCKET_NAME}/raw/events/*/*/*/*.parquet"

    print(f"📊 Querying Data Lake path: {parquet_glob}\n")

    query = f"""
    SELECT 
        event_type,
        count(*) AS total_events,
        count(DISTINCT user_id) AS unique_users,
        count(DISTINCT session_id) AS unique_sessions
    FROM read_parquet('{parquet_glob}')
    GROUP BY event_type
    ORDER BY total_events DESC;
    """

    try:
        df = con.execute(query).df()
        print(df)
        return df
    except Exception as e:
        print(f"Query error (ensure Parquet files exist in MinIO): {e}")


if __name__ == "__main__":
    query_clickstream_lake()
