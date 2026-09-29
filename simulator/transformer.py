"""Module Transformer định hình Data Contract.

Chịu trách nhiệm chuyển đổi dòng dữ liệu thô (.csv) thành chuẩn
Pydantic Schema (ClickstreamEvent) theo mô hình Data Engineering 4W1H.
"""

# Khởi tạo package
import simulator  

import random
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Nhờ simulator/__init__.py ở trên, ta có thể import `core` một cách an toàn
from core.schemas.clickstream import ClickstreamEvent, DeviceContext, EventType

SAMPLE_OS = ["iOS", "Android", "Windows", "macOS", "Linux"]
SAMPLE_BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"]
SAMPLE_REFERRERS = [
    "https://www.google.com/search?q=ecommerce+deals",
    "https://facebook.com/ads",
    "https://streamclick.shop/home",
    None,
]

def map_kaggle_row_to_event(row: Dict[str, str]) -> Optional[ClickstreamEvent]:
    """Chuyển đổi một dòng dữ liệu từ Kaggle CSV thành ClickstreamEvent hợp lệ."""
    def get_val(*keys: str, default: str = "") -> str:
        for k in keys:
            if k in row and row[k] is not None:
                return str(row[k]).strip()
        return default

    # 1. WHAT (Event Type)
    raw_event_type = get_val("EventType", "event_type").lower()
    event_type_mapping = {
        "view": EventType.VIEW_ITEM,
        "product_view": EventType.PRODUCT_VIEW,
        "page_view": EventType.VIEW_ITEM,
        "click": EventType.VIEW_ITEM,
        "cart": EventType.ADD_TO_CART,
        "add_to_cart": EventType.ADD_TO_CART,
        "purchase": EventType.PURCHASE,
        "checkout": EventType.CHECKOUT,
    }
    event_type = event_type_mapping.get(raw_event_type, EventType.VIEW_ITEM)

    # 2. WHEN (Timestamp ISO-8601 UTC)
    raw_time = get_val("Timestamp", "event_time")
    event_timestamp: datetime
    if raw_time:
        clean_time_str = raw_time.replace(" UTC", "").strip()
        try:
            event_timestamp = datetime.fromisoformat(clean_time_str).replace(tzinfo=timezone.utc)
        except Exception:
            try:
                event_timestamp = datetime.strptime(clean_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            except Exception:
                event_timestamp = datetime.now(timezone.utc)
    else:
        event_timestamp = datetime.now(timezone.utc)

    # 3. WHO (Identifiers)
    user_id_raw = get_val("UserID", "user_id")
    user_id = user_id_raw if user_id_raw else None
    session_id_raw = get_val("SessionID", "user_session")
    session_id = session_id_raw if session_id_raw else f"sess_{uuid.uuid4().hex[:12]}"
    anonymous_id = f"anon_{user_id if user_id else session_id}"

    # 4. WHERE & WHAT (Product / Amount)
    product_id_raw = get_val("ProductID", "product_id")
    product_id = product_id_raw if product_id_raw else "PROD_GENERAL"

    raw_amount = get_val("Amount", "price")
    price: Optional[float] = None
    if raw_amount:
        try:
            price = float(raw_amount)
        except (ValueError, TypeError):
            price = None

    page_url = f"https://shop.streamclick.com/products/{product_id}"
    referrer_url = random.choice(SAMPLE_REFERRERS)

    # 5. HOW (Device Context & Properties)
    device = DeviceContext(
        os=random.choice(SAMPLE_OS),
        browser=random.choice(SAMPLE_BROWSERS),
        ip_address=f"192.168.1.{random.randint(10, 250)}",
        user_agent="StreamClick-KaggleSimulator/1.0",
    )

    properties: Dict[str, Any] = {}
    outcome_val = get_val("Outcome", "outcome")
    if outcome_val:
        properties["outcome"] = outcome_val
    for extra_field in ["category_id", "category_code", "brand"]:
        val = row.get(extra_field)
        if val:
            properties[extra_field] = val.strip()

    return ClickstreamEvent(
        event_id=str(uuid.uuid4()),
        timestamp=event_timestamp,
        user_id=user_id,
        anonymous_id=anonymous_id,
        session_id=session_id,
        event_type=event_type,
        page_url=page_url,
        referrer_url=referrer_url,
        device=device,
        price=price,
        product_id=product_id,
        properties=properties,
    )
