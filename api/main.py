from fastapi import status
from fastapi import responses
from core.adapters.broker.base import AbstractMessagePublisher
from fastapi import Request
from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging


from core.config import settings
from core.adapters.broker.redpanda import RedpandaPublisher


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