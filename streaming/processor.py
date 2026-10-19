from datetime import datetime, timezone 
from quixstreams import Application
import logging
import psycopg2

from core.config import settings


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("streamclick.realtime")

def init_processor():
    logger.info("Start Quix Application...")

    app = Application(
        broker_address=settings.KAFKA_BOOTSTRAP_SERVERS,
        consumer_group="streamclick-realtime-group",
        auto_offset_reset="latest"
    )

    input_topic = app.topic(
        name=settings.KAFKA_TOPIC_CLICKSTREAM,
        value_deserializer="json"
    )

    return app, input_topic

def create_pipeline(app, input_topic):
    logger.info("Build Stream Pipeline..")

    sdf = app.dataframe(
        input_topic
    )

    def normalize_product(row):
        row['product_id'] = row.get("product_id") or "PROD_GENERAL"

    sdf = sdf.update(normalize_product)

    # Log luồng dữ liệu đang chạy
    sdf = sdf.update(
        lambda row: logger.info(f"[Processing Event]: {row.get('event_type')} | {row.get('product_id')}")
    )

    # Group topic
    sdf= sdf.group_by(
        lambda row: f"{row.get('event_type')} | {row.get('product_id')}",
        name="event_product"
    )
    # Waitting time
    sdf = sdf.tumbling_window(duration_ms=60000)

    # Events counter
    # Mỗi (event_type, product_id) trong mỗi window duy trì một bộ đếm riêng.
    # initializer: chạy 1 lần cho event đầu tiên -> tạo state từ row.
    # reducer: các event sau -> giữ nguyên định danh trong state, chỉ tăng count.
    sdf = sdf.reduce(
        reducer=lambda state, row: {
            **state,
            "count": state['count'] + 1
            },
        initializer=lambda row: {
            "event_type": row["event_type"], 
            "product_id": row["product_id"],
            "count": 1
            }
    ).current()


    # In kết quả Aggregation ra màn hình để kiểm tra trước khi đưa vào Database
    sdf.update(lambda row: logger.info(f"Kết quả Window: {row}"))

    return sdf

class PostgreSink:
    def __init__(self):
        logger.info("Connecting to PostgreSQL...")
        self.conn = psycopg2.connect(
            host= settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD
        )

        self.conn.autocommit = True

        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS realtime_product_metrics (
                    event_type VARCHAR(50) NOT NULL,
                    window_end TIMESTAMPTZ NOT NULL,
                    product_id VARCHAR(64) NOT NULL,
                    event_count INT NOT NULL,
                    PRIMARY KEY (event_type, window_end, product_id)
                );
            """)

            cur.execute("""
                CREATE OR REPLACE VIEW realtime_event_metrics AS
                SELECT event_type,
                       window_end,
                       SUM(event_count)::INT AS event_count
                FROM realtime_product_metrics
                GROUP BY event_type, window_end;
            """)
    
    def __call__(self, row):
        state = row["value"]
        window_end_ms = row["end"]

        # Đổi timestamp từ mili-giây sang Datetime chuẩn của PostgreSQL
        window_end_dt = datetime.fromtimestamp(window_end_ms / 1000.0, tz=timezone.utc)

        # Deduplicate data
        upsert_query = """
            INSERT INTO realtime_product_metrics (event_type, window_end, product_id, event_count)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (event_type, window_end, product_id)
            DO UPDATE SET event_count = EXCLUDED.event_count;
        """
        with self.conn.cursor() as cur:
            cur.execute(upsert_query, (state["event_type"], window_end_dt, state["product_id"] ,state["count"]))
            logger.info(
                f"UPSERT PostgreSQL: {state['event_type']} | {state['product_id']} "
                f"- {state['count']} events at {window_end_dt}"
            )


if __name__ == "__main__":
    app, input_topic = init_processor()
    sdf = create_pipeline(app, input_topic)
    postgre_sink = PostgreSink()
    sdf = sdf.update(postgre_sink)

    logger.info("Start real-time Processer... Press Ctrl + C to stop.")
    app.run(sdf)