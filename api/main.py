from turtledemo.sorting_animate import partition

from fastapi import Depends, FastAPI, HTTPException, Request, status
from contextlib import asynccontextmanager
import logging


from core.config import settings
from core.adapters.broker.redpanda import RedpandaPublisher
from core.schemas.clickstream import ClickstreamEvent
from core.adapters.broker.base import AbstractMessagePublisher

logger = logging.getLogger("streamclick.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời (Lifespan) của ứng dụng FastAPI.
    Hàm này kiểm soát toàn bộ chu kỳ khởi động (Startup) và tắt máy an toàn (Shutdown)
    của hệ thống Ingestion, giúp quản lý tài nguyên mạng và bộ đệm một cách tập trung.
    
    Args:
        app (FastAPI): Instance của ứng dụng FastAPI.
    """
    logger.info("Application startup: Initializing services and resources...")
    publisher = RedpandaPublisher(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
    publisher.connect()

    # Gắn publisher vào state của app để sử dụng tài nguyên độc lập và tái sử dụng thông qua DI
    app.state.publisher = publisher
    yield

    logger.info("Application shutdown: Cleaning up resources and flushing buffers...")
    if hasattr(app.state, "publisher") and app.state.publisher:
        app.state.publisher.close()
        logger.info("Redpanda Publisher connection closed successfully.")

def get_message_publisher(request: Request) -> AbstractMessagePublisher:
    """
    Dependence trích xuất Message Publisher từ Application State,

    Args:
        request (Request): Đối tượng HTTP Request từ client.
    Returns:
        AbstractMessagePublisher: Publisher instance đang hoạt động
    """
    return request.app.state.publisher

# FastAPI Initialization
app = FastAPI(
    title="StreamClick Ingestion API",
    description="High-throughput real-time Clickstream Ingestion Service for E-commerce tracking",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

@app.post("/track",
          tags=["Ingestion"],
          status_code=status.HTTP_202_ACCEPTED,
          summary="Ingest Clickstream Event"
)
async def track_event(
        event: ClickstreamEvent,
        publisher: AbstractMessagePublisher = Depends(get_message_publisher)
):
    # Tiếp nhận event, xác thực data Contract và đẩy bất đồng bộ vào Message Broker.
    partition_key = event.user_id or event.anonymous_id
    payload = event.to_message_dict()

    success = publisher.publish(
        topic=settings.KAFKA_TOPIC_CLICKSTREAM,
        message=payload,
        key=partition_key
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Broker ingestion queue is unavailable."
        )

    return {
        "status": "success",
        "envent_id": event.event_id,
        "timestamp": payload["timestamp"]
    }

# Health check endpoint
@app.get(
    "/health",
    tags=["Monitoring"],
    status_code=status.HTTP_200_OK,
    summary="Health check probe"
)
async def health_check():
    """Endpoint kiểm tra sức khỏe của dịch vụ Ingestion API."""
    return {
        "status": "healthy",
        "service": "streamclick-ingestion-api",
        "broker": settings.BROKER_TYPE
    }