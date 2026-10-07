from datetime import datetime
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
        consumer_group="streamclick-realtime-group-v1",
        auto_offset_reset="earliest"
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

    # Log luồng dữ liệu đang chạy
    sdf = sdf.update(lambda row: logger.info(f"[Processing Event]: {row.get('event_type')}"))

    # Group topic
    sdf= sdf.group_by("event_type")
    # Waitting time
    sdf = sdf.tumbling_window(duration_ms=60000)

    # Events counter
    # Mỗi window sẽ duy trì một bộ đếm
    # Lần đầi thấy event -> gán bằng 1 (initializer). Các lần sau -> + 1
    sdf = sdf.reduce(
        reducer=lambda state, row: {"event_type": row["event_type"], "count": state["count"] + 1},
        initializer=lambda row: {"event_type": row["event_type"], "count": 1}
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
                CREATE TABLE IF NOT EXISTS realtime_metrics (
                    event_type VARCHAR(50),
                    window_end TIMESTAMP,
                    event_count INT,
                    PRIMARY KEY (event_type, window_end)
                );
            """)
    
    def __call__(self, row):
        state = row["value"]
        window_end_ms = row["end"]

        # Đổi timestamp từ mili-giây sang Datetime chuẩn của PostgreSQL
        window_end_dt = datetime.fromtimestamp(window_end_ms / 1000.0)

        # Deduplicate data
        upsert_query = """
            INSERT INTO realtime_metrics (event_type, window_end, event_count)
            VALUES (%s, %s, %s)
            ON CONFLICT (event_type, window_end)
            DO UPDATE SET event_count = EXCLUDED.event_count;
        """
        with self.conn.cursor() as cur:
            cur.execute(upsert_query, (state["event_type"], window_end_dt, state["count"]))
            logger.info(f"UPSERT PostgreSQL: {state['event_type']} - {state['count']} events at {window_end_dt}")


if __name__ == "__main__":
    app, input_topic = init_processor()
    sdf = create_pipeline(app, input_topic)
    postgre_sink = PostgreSink()
    sdf = sdf.update(postgre_sink)

    logger.info("Start real-time Processer... Press Ctrl + C to stop.")
    app.run(sdf)