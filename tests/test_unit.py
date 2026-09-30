"""
=============================================================================
StreamClick – Phase 1 Unit Test Suite
=============================================================================
Senior QA / SDET – Pure Unit Tests for independent modules.
Focus: Pydantic Schema Validation & Redpanda Adapter Isolation.

Test Coverage:
  FN  – Functional Requirements (Schema Instantiation, Enum Validation, Publisher logic)
  NFN – Non-Functional Requirements (PII Stripping, Adapter Error Handling)

Run:
    uv run pytest tests/test_unit.py -v
=============================================================================
"""

import sys
import json
import uuid
from datetime import datetime
import pytest
from unittest.mock import MagicMock, patch
from pydantic import ValidationError

# Layer 0 Isolation: Stub out confluent_kafka before importing local modules
# to ensure zero native dependencies are required to run this suite.
sys.modules.setdefault("confluent_kafka", MagicMock())

from core.schemas.clickstream import ClickstreamEvent
from core.adapters.broker.redpanda import RedpandaPublisher


# ===========================================================================
# ── Fixtures & Constants ───────────────────────────────────────────────────
# ===========================================================================

VALID_PAYLOAD_DICT = {
    "anonymous_id": "anon-uuid-555",
    "session_id": "sess-uuid-999",
    "event_type": "view_item",
    "page_url": "https://shop.example.com/item/1"
}

@pytest.fixture(autouse=True)
def reset_singleton():
    """Ensure RedpandaPublisher singleton is clean for every test."""
    RedpandaPublisher._instance = None
    yield
    RedpandaPublisher._instance = None

@pytest.fixture
def mock_producer():
    """Returns a mock that acts like confluent_kafka.Producer."""
    return MagicMock()


# ===========================================================================
# ── FN: Functional Requirements Unit Tests ─────────────────────────────────
# ===========================================================================

class TestFunctionalUnit:
    
    def test_fn_schema_valid_instantiation(self):
        """
        FN-01: Khởi tạo ClickstreamEvent với payload hợp lệ.
        - Object tạo thành công.
        - timestamp được tự động gán và là kiểu datetime.
        - event_id được tự động gán và là một UUID string hợp lệ.
        """
        event = ClickstreamEvent(**VALID_PAYLOAD_DICT)
        
        # Verify automatic default fields
        assert isinstance(event.timestamp, datetime), "timestamp must be a datetime object"
        
        # Verify UUID generation (should not raise ValueError)
        assert isinstance(event.event_id, str)
        uuid_obj = uuid.UUID(event.event_id)
        assert uuid_obj.version == 4, "event_id must be a UUIDv4 string"
        
        # Verify provided fields
        assert event.anonymous_id == "anon-uuid-555"
        assert event.event_type == "view_item"

    def test_fn_schema_invalid_enum_validation(self):
        """
        FN-02: Cố tình gán event_type không nằm trong EventType enum.
        - Pydantic phải raise ValidationError.
        """
        invalid_payload = {
            **VALID_PAYLOAD_DICT,
            "event_type": "invalid_action"  # Not in view_item, add_to_cart, etc.
        }
        
        with pytest.raises(ValidationError) as exc_info:
            ClickstreamEvent(**invalid_payload)
            
        assert "event_type" in str(exc_info.value)

    @patch("core.adapters.broker.redpanda.Producer")
    def test_fn_publisher_send_message_logic(self, mock_producer_class, mock_producer):
        """
        FN-03: Khởi tạo RedpandaPublisher và gọi publish().
        - Mock Producer.produce() phải được gọi với topic và payload (JSON bytes) chính xác.
        """
        # Inject the mock producer instance into the mock class
        mock_producer_class.return_value = mock_producer
        
        publisher = RedpandaPublisher(bootstrap_servers="mock:9092")
        
        test_topic = "test.events"
        test_message = {"key": "value", "user_id": 123}
        test_key = "partition-key-1"
        
        result = publisher.publish(topic=test_topic, message=test_message, key=test_key)
        
        assert result is True, "publish() should return True on success"
        
        # Verify the underlying confluent_kafka.Producer.produce() was called correctly
        mock_producer.produce.assert_called_once()
        
        call_kwargs = mock_producer.produce.call_args.kwargs
        assert call_kwargs["topic"] == test_topic
        
        # Verify payload was serialized to JSON and encoded to bytes
        expected_bytes = json.dumps(test_message).encode("utf-8")
        assert call_kwargs["value"] == expected_bytes
        assert call_kwargs["key"] == b"partition-key-1"
        assert "on_delivery" in call_kwargs


# ===========================================================================
# ── NFN: Non-Functional Requirements Unit Tests ────────────────────────────
# ===========================================================================

class TestNonFunctionalUnit:
    
    def test_nfn_schema_pii_strip_extra_fields(self):
        """
        NFN-01: Khởi tạo schema với các trường rác/PII.
        - model_dump() trả về dictionary hoàn toàn không chứa các extra fields này.
        """
        pii_payload = {
            **VALID_PAYLOAD_DICT,
            "credit_card_number": "1234-5678-9012-3456",
            "social_security": "999-99-9999",
            "internal_secret": "hack_me"
        }
        
        # Instantiate (Pydantic will use extra='ignore' to silently drop them)
        event = ClickstreamEvent(**pii_payload)
        dumped_data = event.model_dump()
        
        # Assert none of the PII fields exist in the dumped data
        assert "credit_card_number" not in dumped_data
        assert "social_security" not in dumped_data
        assert "internal_secret" not in dumped_data
        
        # Assert valid fields still exist
        assert dumped_data["anonymous_id"] == "anon-uuid-555"

    @patch("core.adapters.broker.redpanda.Producer")
    def test_nfn_publisher_error_handling(self, mock_producer_class, mock_producer):
        """
        NFN-02: Giả lập Broker ném lỗi Exception.
        - Adapter phải bao bọc lỗi an toàn (catch), không để lọt lỗi ra ngoài làm crash app.
        - Theo implementation hiện tại, RedpandaPublisher catch lỗi và trả về False.
        """
        mock_producer_class.return_value = mock_producer
        publisher = RedpandaPublisher(bootstrap_servers="mock:9092")
        
        # Force the underlying produce() method to raise an arbitrary exception
        mock_producer.produce.side_effect = Exception("Simulated Kafka fatal error")
        
        # Attempt to publish
        # Instead of crashing the test (or the app), the publisher should catch it
        # and gracefully return False.
        result = publisher.publish(
            topic="test.topic", 
            message={"event": "test"}, 
            key="test-key"
        )
        
        # Confirm the adapter handled the failure safely
        assert result is False, "Adapter should gracefully return False on fatal error"
