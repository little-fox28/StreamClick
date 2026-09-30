"""
=============================================================================
StreamClick – Phase 1 Integration Test Suite
=============================================================================
Senior QA / SDET – Integration Test (API Router <-> Pydantic <-> Adapter)

Test Coverage:
  FN  – Functional Requirements Integration (Standard flow, Lifespan, Validation rejection)
  NFN – Non-Functional Requirements Integration (Adapter failure, PII filtering)

Run:
    uv run pytest tests/test_integration.py -v
=============================================================================
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Import the FastAPI application
from api.main import app
from core.adapters.broker.redpanda import RedpandaPublisher

# ===========================================================================
# ── Helpers / Constants ─────────────────────────────────────────────────────
# ===========================================================================

TRACK_URL = "/track"

VALID_PAYLOAD: dict = {
    "anonymous_id": "anon-integration-001",
    "session_id": "sess-integration-001",
    "event_type": "view_item",
    "page_url": "https://shop.example.com/products/100",
}

# ===========================================================================
# ── Fixtures ─────────────────────────────────────────────────────────────────
# ===========================================================================

@pytest.fixture
def mock_redpanda_publisher():
    """
    Mock directly at the RedpandaPublisher class level to intercept 
    how the API instantiates and interacts with the adapter.
    """
    with patch("api.main.RedpandaPublisher", autospec=True) as MockPublisherClass:
        # Configure the instance that will be returned when RedpandaPublisher() is called
        mock_instance = MockPublisherClass.return_value
        mock_instance.connect.return_value = None
        mock_instance.close.return_value = None
        mock_instance.publish.return_value = True
        yield mock_instance

@pytest.fixture
def client(mock_redpanda_publisher):
    """
    FastAPI TestClient that triggers the lifespan events (startup/shutdown).
    Because we patched RedpandaPublisher in the fixture above, the lifespan
    will instantiate our mock instead of the real broker connection.
    """
    # Using `with TestClient(app, raise_server_exceptions=False)` invokes the lifespan manager
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

# ===========================================================================
# ── FN: Functional Requirements Integration Tests ────────────────────────────
# ===========================================================================

class TestFunctionalIntegration:
    
    def test_integration_valid_flow(self, client: TestClient, mock_redpanda_publisher: MagicMock):
        """
        FN-01: Bắn request hợp lệ vào POST /track.
        - Xác nhận API chấp nhận (HTTP 202).
        - Mock publish bắt buộc được gọi 1 lần.
        - Dữ liệu truyền vào publish đã đi qua schema Pydantic (parse/serialize chuẩn).
        """
        response = client.post(TRACK_URL, json=VALID_PAYLOAD)
        
        # API returns 202 Accepted in implementation (matching prompt intent for success)
        assert response.status_code == 202
        
        # Verify Adapter interaction
        mock_redpanda_publisher.publish.assert_called_once()
        
        # Extract args passed to adapter layer
        call_kwargs = mock_redpanda_publisher.publish.call_args.kwargs
        published_message = call_kwargs.get("message")
        
        # Verify data flowed correctly through Pydantic to Adapter
        assert published_message is not None
        assert published_message["anonymous_id"] == VALID_PAYLOAD["anonymous_id"]
        assert published_message["event_type"] == VALID_PAYLOAD["event_type"]
        # Ensure timestamp was generated and serialized to string by to_message_dict()
        assert "timestamp" in published_message
        assert isinstance(published_message["timestamp"], str)
        # Ensure UUID was generated
        assert "event_id" in published_message

    def test_integration_lifespan_startup(self, mock_redpanda_publisher: MagicMock):
        """
        FN-02: Giả lập quá trình startup của FastAPI.
        - Xác nhận app.state.publisher được khởi tạo và chứa instance RedpandaPublisher.
        """
        with TestClient(app) as test_client:
            # Check if publisher is attached to app state during lifespan startup
            assert hasattr(app.state, "publisher")
            assert app.state.publisher is mock_redpanda_publisher
            
            # Verify connect() was called during startup
            mock_redpanda_publisher.connect.assert_called_once()
            
        # Verify close() was called during shutdown (after context manager exits)
        mock_redpanda_publisher.close.assert_called_once()

    def test_integration_validation_rejection(self, client: TestClient, mock_redpanda_publisher: MagicMock):
        """
        FN-03: Bắn request thiếu trường bắt buộc.
        - Xác nhận API trả về 422.
        - Mock publish KHÔNG được gọi (bị chặn tại tầng Schema).
        """
        invalid_payload = {
            "event_type": "view_item",
            # Missing anonymous_id, session_id, page_url
        }
        
        response = client.post(TRACK_URL, json=invalid_payload)
        
        assert response.status_code == 422
        mock_redpanda_publisher.publish.assert_not_called()


# ===========================================================================
# ── NFN: Non-Functional Requirements Integration Tests ───────────────────────
# ===========================================================================

class TestNonFunctionalIntegration:
    
    def test_integration_adapter_failure_handling(self, client: TestClient, mock_redpanda_publisher: MagicMock):
        """
        NFN-01: Cấu hình mock ném lỗi ConnectionError.
        - Xác nhận API bắt được lỗi, không crash, trả về HTTP 500 (Starlette default handler).
        """
        # Inject Chaos into the Adapter layer
        mock_redpanda_publisher.publish.side_effect = ConnectionError("Broker down!")
        
        response = client.post(TRACK_URL, json=VALID_PAYLOAD)
        
        # The unhandled exception in the route handler will be caught by 
        # Starlette's top-level exception handler, returning a 500 error 
        # and preventing the worker process from crashing.
        assert response.status_code >= 500
        # Assert the adapter was actually invoked before the error bubbled up
        mock_redpanda_publisher.publish.assert_called_once()

    def test_integration_pii_filtering_handoff(self, client: TestClient, mock_redpanda_publisher: MagicMock):
        """
        NFN-02: Bắn request chứa thông tin nhạy cảm.
        - Xác nhận API trả về 202 OK.
        - Dữ liệu nhạy cảm đã bị Pydantic loại bỏ trước khi truyền cho Adapter.
        """
        pii_payload = {
            **VALID_PAYLOAD,
            "password": "super_secret_password",
            "credit_card": "1234-5678-9012-3456"
        }
        
        response = client.post(TRACK_URL, json=pii_payload)
        
        assert response.status_code == 202
        
        mock_redpanda_publisher.publish.assert_called_once()
        call_kwargs = mock_redpanda_publisher.publish.call_args.kwargs
        published_message = call_kwargs.get("message")
        
        # Verify PII fields were stripped by Pydantic before reaching the adapter
        assert "password" not in published_message
        assert "credit_card" not in published_message
        
        # Verify valid fields made it through
        assert published_message["anonymous_id"] == VALID_PAYLOAD["anonymous_id"]
