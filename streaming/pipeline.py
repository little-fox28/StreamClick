import json
import logging
import psycopg2
from quixstreams import Application
from core.config import settings

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("streamclick.streaming")


def get_pg_connection():
    return psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD
    )


def save_product_view(product_id: str):
    """Update realtime product view counter in PostgreSQL (Speed Layer)."""
    if not product_id:
        return
    query = """
    INSERT INTO realtime_product_views (product_id, view_count, last_viewed_at)
    VALUES (%s, 1, NOW())
    ON CONFLICT (product_id)
    DO UPDATE SET
        view_count = realtime_product_views.view_count + 1,
        last_viewed_at = NOW();
    """
    try:
        with get_pg_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (product_id,))
            conn.commit()
    except Exception as e:
        logger.error(f"Error updating product view in PostgreSQL: {e}")


def main():
    logger.info("Starting Quix Streams Processing Application...")
    app = Application(
        broker_address=settings.KAFKA_BOOTSTRAP_SERVERS,
        consumer_group=settings.KAFKA_CONSUMER_GROUP,
        auto_offset_reset="latest"
    )

    input_topic = app.topic(settings.KAFKA_TOPIC_CLICKSTREAM, value_deserializer="json")
    sdf = app.dataframe(topic=input_topic)

    # Filter and process product view events in real time
    def process_event(event: dict):
        logger.info(f"Stream received event: {event.get('event_type')} for session {event.get('session_id')}")
        if event.get("event_type") == "product_view" and event.get("product_id"):
            save_product_view(event["product_id"])
        return event

    sdf = sdf.apply(process_event)

    app.run(sdf)


if __name__ == "__main__":
    main()
