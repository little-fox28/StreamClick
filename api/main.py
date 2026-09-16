from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse

from core.config import settings
from core.schemas.clickstream import ClickstreamEvent
from core.adapters.broker.base import MessagePublisher
from core.adapters.broker.kafka_broker import KafkaMessagePublisher

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("streamclick.api")

# Publisher instance
publisher: MessagePublisher = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global publisher
    logger.info("Initializing Message Publisher...")
    if settings.BROKER_TYPE == "kafka":
        publisher = KafkaMessagePublisher(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
        publisher.connect()
    else:
        raise ValueError(f"Unsupported BROKER_TYPE: {settings.BROKER_TYPE}")
    yield
    logger.info("Shutting down Message Publisher...")
    if publisher:
        publisher.close()


app = FastAPI(
    title="StreamClick Ingestion API",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health", tags=["Monitoring"])
async def health_check():
    return {"status": "healthy", "service": "streamclick-ingestion-api"}


@app.post("/v1/events", status_code=status.HTTP_202_ACCEPTED, tags=["Clickstream"])
async def track_event(event: ClickstreamEvent):
    """
    Stateless Ingestion Endpoint for real-time Clickstream events.
    Pushes valid events into Redpanda / Kafka topic.
    """
    if not publisher:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Message Broker not connected"
        )

    # Use anonymous_id or user_id as partition key to maintain user ordering
    partition_key = event.user_id or event.anonymous_id
    payload = event.to_message_dict()

    success = publisher.publish(
        topic=settings.KAFKA_TOPIC_CLICKSTREAM,
        message=payload,
        key=partition_key
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish event to Message Broker"
        )

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"status": "accepted", "event_id": event.event_id}
    )
