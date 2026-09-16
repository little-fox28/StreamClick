from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import uuid


class ClickstreamEvent(BaseModel):
    """
    Standardized Clickstream Schema for E-commerce user events.
    """
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = Field(default=None, description="Logged-in User ID")
    anonymous_id: str = Field(..., description="Device / Cookie ID")
    session_id: str = Field(..., description="Browsing Session ID")
    
    event_type: str = Field(..., description="e.g. page_view, product_view, add_to_cart, purchase")
    page_url: str = Field(..., description="Full URL of the page")
    referrer_url: Optional[str] = None
    
    # E-commerce context
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    
    # Client Metadata
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary event payload")
    
    # Timestamps
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_message_dict(self) -> Dict[str, Any]:
        """Convert to dict with ISO formatted timestamp for JSON serialization."""
        data = self.model_dump()
        data["timestamp"] = self.timestamp.isoformat()
        return data
