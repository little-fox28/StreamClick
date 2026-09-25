"""Clickstream schema definitions for StreamClick Ingestion pipeline.

Module này định nghĩa các cấu trúc dữ liệu Pydantic và Enum đóng vai trò là
Data Contract cốt lõi cho hệ thống Ingestion E-commerce.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class EventType(str, Enum):
    """Tập hợp các loại sự kiện hợp lệ trong phễu E-commerce.

    Lớp này định nghĩa danh sách đóng các hành vi người dùng được hệ thống chấp nhận
    nhằm phục vụ việc phân tích luồng chuyển đổi và ngăn chặn dữ liệu rác ngay từ cổng Ingestion.
    Kế thừa `str` để tự động tuần tự hóa sang JSON và hiển thị trực quan trên Swagger UI.

    Attributes:
        VIEW_ITEM: Sự kiện xem chi tiết sản phẩm.
        ADD_TO_CART: Sự kiện thêm sản phẩm vào giỏ hàng.
        CHECKOUT: Sự kiện bắt đầu tiến trình thanh toán.
        PURCHASE: Sự kiện hoàn tất thanh toán và đặt hàng thành công.
        PRODUCT_VIEW: Bí danh (alias) tương thích ngược cho hành vi xem sản phẩm.
    """
    VIEW_ITEM = "view_item"
    ADD_TO_CART = "add_to_cart"
    CHECKOUT = "checkout"
    PURCHASE = "purchase"
    PRODUCT_VIEW = "product_view"


class DeviceContext(BaseModel):
    """Mô hình dữ liệu ngữ cảnh thiết bị và môi trường của người dùng.

    Lớp này nhóm các thuộc tính kỹ thuật liên quan đến phần cứng, trình duyệt
    và mạng của client, được nhúng (embed) trực tiếp vào schema sự kiện chính.

    Attributes:
        os (Optional[str]): Hệ điều hành của thiết bị người dùng (ví dụ: iOS, Android, Windows, macOS).
        browser (Optional[str]): Trình duyệt web được sử dụng (ví dụ: Chrome, Safari, Firefox).
        ip_address (Optional[str]): Địa chỉ IP của client gửi sự kiện.
        user_agent (Optional[str]): Chuỗi User-Agent đầy đủ trích xuất từ HTTP request header.
    """
    model_config = ConfigDict(extra="ignore")

    os: Optional[str] = Field(
        default=None,
        description="Client operating system (e.g., iOS, Android, Windows, macOS)"
    )
    browser: Optional[str] = Field(
        default=None,
        description="Client web browser (e.g., Chrome, Safari, Firefox)"
    )
    ip_address: Optional[str] = Field(
        default=None,
        description="Client IP address"
    )
    user_agent: Optional[str] = Field(
        default=None,
        description="Full client User-Agent header string"
    )


class ClickstreamEvent(BaseModel):
    """Data Contract cốt lõi cho events Clickstream E-commerce.

    Lớp này đóng vai trò là Data Contract trung tâm của toàn bộ hệ thống Ingestion,
    áp dụng mô hình 4W1H (Who, When, What, Where) để chuẩn hóa mọi hành vi của khách hàng.
    Đồng thời tích hợp cơ chế bảo vệ PII (Whitelist) và tối ưu hóa hiệu năng xử lý với Pydantic V2.

    Attributes:
        event_id (str): Mã định danh duy nhất toàn cầu UUIDv4 phục vụ chống trùng lặp (Deduplication).
        timestamp (datetime): Thời điểm phát sinh sự kiện theo chuẩn ISO 8601 múi giờ UTC.
        user_id (Optional[str]): Định danh người dùng đã đăng nhập (WHO - tùy chọn).
        anonymous_id (str): Định danh thiết bị/cookie ẩn danh để bám vết người dùng (WHO - bắt buộc).
        session_id (str): Mã phiên duyệt web của người dùng (WHO - bắt buộc).
        event_type (EventType): Loại hành vi mua sắm hợp lệ theo chuẩn EventType (WHAT - bắt buộc).
        page_url (str): Đường dẫn URL trang đích nơi sự kiện xảy ra (WHERE - bắt buộc).
        referrer_url (Optional[str]): URL nguồn điều hướng tới trang hiện tại (WHERE - tùy chọn).
        device (Optional[DeviceContext]): Ngữ cảnh phần cứng, trình duyệt và mạng của client.
        price (Optional[float]): Đơn giá sản phẩm, hỗ trợ ép kiểu an toàn từ chuỗi sang số thực.
        product_id (Optional[str]): Mã định danh sản phẩm gắn liền với sự kiện tương tác.
        properties (Dict[str, Any]): Dữ liệu nghiệp vụ động bổ sung tùy theo loại sự kiện.
    """
    # NFN: PII Protection & Schema Evolution (Automatically strip undeclared fields)
    model_config = ConfigDict(
        extra="ignore",                 # Whitelist mode: Strip undeclared fields & PII
        str_strip_whitespace=True,      # Automatically trim leading/trailing whitespace
        populate_by_name=True
    )

    # --- 1. CORE IDENTIFIERS (WHO, WHEN, WHAT) ---
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Global unique UUIDv4 identifier for event deduplication"
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Event generation timestamp in UTC ISO 8601 format"
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Unique identifier of logged-in user (WHO - Optional)"
    )
    anonymous_id: str = Field(
        ...,
        description="Anonymous device or cookie identifier for user tracking (WHO - Mandatory)"
    )
    session_id: str = Field(
        ...,
        description="Browsing session identifier (WHO - Mandatory)"
    )
    event_type: EventType = Field(
        ...,
        description="Valid shopping action type constrained by EventType enum (WHAT - Mandatory)"
    )

    # --- 2. NAVIGATION CONTEXT (WHERE) ---
    page_url: str = Field(
        ...,
        description="Full target page URL where the event occurred (WHERE - Mandatory)"
    )
    referrer_url: Optional[str] = Field(
        default=None,
        description="Referrer URL that directed to the current page (WHERE - Optional)"
    )

    # --- 3. NESTED ENVIRONMENT CONTEXT ---
    device: Optional[DeviceContext] = Field(
        default=None,
        description="Nested client hardware, browser, and network context"
    )

    # --- 4. TYPE COERCION DEMONSTRATION ---
    price: Optional[float] = Field(
        default=None,
        description="Product unit price with safe automatic coercion from string to float"
    )
    product_id: Optional[str] = Field(
        default=None,
        description="Unique product identifier associated with the event"
    )

    # --- 5. DYNAMIC PAYLOAD ---
    properties: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dynamic business payload attributes varying by event type (e.g., order_value, quantity)"
    )

    def to_message_dict(self) -> Dict[str, Any]:
        """Chuyển đổi schema thành dictionary tương thích JSON để xuất bản lên Message Broker.

        Returns:
            Dict[str, Any]: Dữ liệu sự kiện đã tuần tự hóa với timestamp chuẩn ISO 8601.
        """
        data = self.model_dump(mode="json")
        data["timestamp"] = self.timestamp.isoformat()
        return data
