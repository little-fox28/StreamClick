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


if __name__ == "__main__":
    conn = inital_duckdb()
    configure_minio(conn)