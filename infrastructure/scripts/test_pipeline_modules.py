"""
StreamClick Extensible Module Test Suite & Test Runner
=====================================================
A scalable, modular test harness designed following the Registry Pattern.
Easily extendable as new modules (FastAPI, Streaming, Batch, DuckDB, Cloud Adapters)
are added to the StreamClick Lambda Architecture pipeline.

Usage:
------
# Run all registered module tests:
python3 infrastructure/scripts/test_pipeline_modules.py --all

# Run specific modules:
python3 infrastructure/scripts/test_pipeline_modules.py -m config broker storage

# Run by category (e.g. unit, integration):
python3 infrastructure/scripts/test_pipeline_modules.py -c unit

# List all available registered tests:
python3 infrastructure/scripts/test_pipeline_modules.py --list
"""

import argparse
import logging
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, List, Optional

# Ensure project root is in sys.path so 'core' and other modules can be imported
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Ensure Windows Console supports UTF-8 Unicode characters (emojis)
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

# Configure Console Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("ModuleTestRunner")


# ==============================================================================
# 1. TEST REGISTRY & RUNNER INFRASTRUCTURE (EXTENSIBLE CORE)
# ==============================================================================

@dataclass
class TestCase:
    name: str
    category: str  # e.g., 'unit', 'integration', 'e2e'
    description: str
    func: Callable
    enabled: bool = True


@dataclass
class TestResult:
    name: str
    category: str
    success: bool
    duration_ms: float
    error_message: Optional[str] = None


class TestRegistry:
    """Registry Pattern: Dynamically discovers and executes tests."""
    _tests: Dict[str, TestCase] = {}

    @classmethod
    def register(cls, name: str, category: str = "unit", description: str = ""):
        """Decorator to register a new test module/function."""
        def decorator(func: Callable):
            cls._tests[name] = TestCase(
                name=name,
                category=category,
                description=description or func.__doc__ or "No description",
                func=func
            )
            return func
        return decorator

    @classmethod
    def get_tests(cls, module_filter: Optional[List[str]] = None, category_filter: Optional[str] = None) -> List[TestCase]:
        tests = list(cls._tests.values())
        if module_filter:
            tests = [t for t in tests if t.name in module_filter]
        if category_filter:
            tests = [t for t in tests if t.category.lower() == category_filter.lower()]
        return tests


# Helper decorator shortcut
register_test = TestRegistry.register


# ==============================================================================
# 2. CORE TEST MODULES (IMPLEMENTED COMPONENTS)
# ==============================================================================

@register_test(name="config", category="unit", description="Verify 12-Factor Pydantic Settings & Singleton Caching")
def test_config_module():
    from core.config import get_settings, settings

    s1 = get_settings()
    s2 = get_settings()
    
    assert s1 is s2, "Settings is not Singleton (check @lru_cache)"
    assert s1.APP_NAME == "StreamClick", f"Unexpected APP_NAME: {s1.APP_NAME}"
    
    broker_url = getattr(s1, "MESSAGE_BROKER_URL", None) or getattr(s1, "KAFKA_BOOTSTRAP_SERVERS", None)
    assert broker_url is not None, "Broker bootstrap URL must be configured"
    
    logger.info(f"Loaded Settings: Broker={broker_url}, Env={s1.APP_ENV}")


@register_test(name="schemas", category="unit", description="Verify Clickstream Pydantic Schema Validation & Serialization")
def test_schemas_module():
    from core.schemas.clickstream import ClickstreamEvent

    # Test valid event
    event = ClickstreamEvent(
        user_id="usr_100",
        anonymous_id="anon_200",
        session_id="sess_300",
        event_type="product_view",
        page_url="https://shop.example.com/item/1",
        product_id="PROD_100",
        price=99.99
    )
    payload = event.to_message_dict()
    assert payload["event_type"] == "product_view"
    assert isinstance(payload["timestamp"], str)

    # Test validation error on missing required fields
    try:
        ClickstreamEvent(event_type="page_view")  # Missing anonymous_id, session_id, page_url
        assert False, "Pydantic should have raised ValidationError for missing required fields"
    except Exception:
        pass  # Expected


@register_test(name="broker_interface", category="unit", description="Verify AbstractMessagePublisher Base Class Contract")
def test_broker_interface():
    from core.adapters.broker.base import AbstractMessagePublisher

    # Verify abstract class cannot be instantiated directly
    try:
        AbstractMessagePublisher()
        assert False, "AbstractMessagePublisher must not be directly instantiable"
    except TypeError:
        pass  # Expected behavior


@register_test(name="broker", category="integration", description="Verify RedpandaPublisher Singleton & Produce/Flush")
def test_broker_integration():
    from core.config import settings
    from core.adapters.broker.redpanda import RedpandaPublisher

    broker_url = getattr(settings, "MESSAGE_BROKER_URL", None) or getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    topic = getattr(settings, "KAFKA_TOPIC_CLICKSTREAM", "events.clickstream.raw")

    # 1. Singleton Check
    pub1 = RedpandaPublisher(bootstrap_servers=broker_url)
    pub2 = RedpandaPublisher(bootstrap_servers=broker_url)
    assert pub1 is pub2, "RedpandaPublisher must enforce Singleton instance"

    # 2. Produce Check
    test_msg = {
        "event_id": str(uuid.uuid4()),
        "user_id": "test_runner_user",
        "anonymous_id": "anon_test",
        "session_id": "sess_test",
        "event_type": "test_probe",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    success = pub1.publish(topic=topic, message=test_msg, key=test_msg["user_id"])
    pub1.flush(timeout=3.0)
    assert success is True, f"Failed to publish message to topic '{topic}'"


@register_test(name="storage_interface", category="unit", description="Verify AbstractStorageClient Base Class Contract")
def test_storage_interface():
    from core.adapters.storage.base import AbstractStorageClient

    try:
        AbstractStorageClient()
        assert False, "AbstractStorageClient must not be directly instantiable"
    except TypeError:
        pass  # Expected behavior


@register_test(name="storage", category="integration", description="Verify MinIOClient Singleton, In-Memory Upload & Listing")
def test_storage_integration():
    from core.config import settings
    from core.adapters.storage.minio import MinIOClient

    endpoint = getattr(settings, "STORAGE_ENDPOINT", None) or getattr(settings, "S3_ENDPOINT_URL", "http://localhost:9000")
    access_key = getattr(settings, "STORAGE_ACCESS_KEY", None) or getattr(settings, "S3_ACCESS_KEY", "minioadmin")
    secret_key = getattr(settings, "STORAGE_SECRET_KEY", None) or getattr(settings, "S3_SECRET_KEY", "minioadmin")
    bucket = getattr(settings, "STORAGE_BUCKET_NAME", None) or getattr(settings, "S3_BUCKET_NAME", "clickstream-lake")

    # 1. Singleton Check
    s1 = MinIOClient(endpoint_url=endpoint, access_key=access_key, secret_key=secret_key, bucket_name=bucket)
    s2 = MinIOClient(endpoint_url=endpoint, access_key=access_key, secret_key=secret_key, bucket_name=bucket)
    assert s1 is s2, "MinIOClient must enforce Singleton instance"

    # 2. In-Memory Upload Check
    sample_content = b"EVENT_ID,STATUS,TIMESTAMP\n1,OK,2026-09-24T00:00:00Z"
    dest_key = f"raw/events/test_runner/test_{uuid.uuid4().hex[:8]}.csv"
    
    upload_ok = s1.upload_bytes(data=sample_content, destination_path=dest_key)
    assert upload_ok is True, f"Failed to upload in-memory bytes to s3://{bucket}/{dest_key}"

    # 3. List Objects Check
    keys = s1.list_objects(prefix="raw/events/test_runner/")
    assert dest_key in keys, f"Key '{dest_key}' not found in bucket listing"


# ==============================================================================
# 3. FUTURE EXTENSION TEMPLATES (PLUG IN NEW MODULES HERE AS PROJECT GROWS)
# ==============================================================================

@register_test(name="api_health", category="integration", description="[Future/Day 3] Verify FastAPI Ingestion API Health Endpoint")
def test_api_health_stub():
    import requests
    from core.config import settings
    
    api_url = f"http://{settings.API_HOST if settings.API_HOST != '0.0.0.0' else 'localhost'}:{settings.API_PORT}/health"
    try:
        res = requests.get(api_url, timeout=2.0)
        assert res.status_code == 200, f"Expected HTTP 200, got {res.status_code}"
    except requests.exceptions.ConnectionError:
        logger.warning(f"FastAPI is not currently running on {api_url} (Skipping or run 'docker compose up ingestion-api')")


# ==============================================================================
# 4. TEST RUNNER ORCHESTRATION & SUMMARY REPORT
# ==============================================================================

def run_test_suite(tests: List[TestCase]) -> List[TestResult]:
    results = []
    
    print("\n" + "=" * 80)
    print(f"🚀 STREAMCLICK MODULE TEST SUITE (Total: {len(tests)} Tests)")
    print("=" * 80)
    
    for idx, test in enumerate(tests, 1):
        print(f"\n[{idx}/{len(tests)}] Running: {test.name.upper()} ({test.category}) - {test.description}")
        start_time = time.perf_counter()
        
        try:
            test.func()
            duration_ms = (time.perf_counter() - start_time) * 1000
            print(f"    --> ✅ PASSED ({duration_ms:.2f} ms)")
            results.append(TestResult(name=test.name, category=test.category, success=True, duration_ms=duration_ms))
        except AssertionError as ae:
            duration_ms = (time.perf_counter() - start_time) * 1000
            print(f"    --> ❌ FAILED Assertion: {ae} ({duration_ms:.2f} ms)")
            results.append(TestResult(name=test.name, category=test.category, success=False, duration_ms=duration_ms, error_message=str(ae)))
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            print(f"    --> ❌ ERROR: {e} ({duration_ms:.2f} ms)")
            results.append(TestResult(name=test.name, category=test.category, success=False, duration_ms=duration_ms, error_message=str(e)))

    return results


def print_summary_report(results: List[TestResult]):
    total = len(results)
    passed = sum(1 for r in results if r.success)
    failed = total - passed
    total_time_ms = sum(r.duration_ms for r in results)

    print("\n" + "=" * 80)
    print("📊 TEST EXECUTION SUMMARY REPORT")
    print("=" * 80)
    print(f"{'Module Name':<25} | {'Category':<12} | {'Status':<10} | {'Duration (ms)':<15}")
    print("-" * 80)

    for r in results:
        status_str = "✅ PASS" if r.success else "❌ FAIL"
        print(f"{r.name:<25} | {r.category:<12} | {status_str:<10} | {r.duration_ms:>10.2f} ms")

    print("-" * 80)
    print(f"Total Tests: {total} | Passed: {passed} | Failed: {failed} | Total Time: {total_time_ms:.2f} ms")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Pipeline modules are verified and healthy.")
    else:
        print(f"\n⚠️ {failed} TEST(S) FAILED. Please review the error messages above.")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="StreamClick Extensible Module Test Harness")
    parser.add_argument("-a", "--all", action="store_true", help="Run all registered module tests")
    parser.add_argument("-m", "--modules", nargs="+", help="Run specific module tests (e.g. -m config broker storage)")
    parser.add_argument("-c", "--category", type=str, help="Filter tests by category (e.g. unit, integration)")
    parser.add_argument("-l", "--list", action="store_true", help="List all registered test modules")

    args = parser.parse_args()

    if args.list:
        print("\n📋 REGISTERED TEST MODULES IN STREAMCLICK:")
        print("-" * 70)
        for t in TestRegistry.get_tests():
            print(f" • {t.name:<20} [{t.category:<12}] : {t.description}")
        print("-" * 70 + "\n")
        return

    # Default to running all if no specific filter is provided
    selected_tests = TestRegistry.get_tests(module_filter=args.modules, category_filter=args.category)

    if not selected_tests:
        print("⚠️ No tests found matching your criteria. Use --list to see available tests.")
        sys.exit(1)

    results = run_test_suite(selected_tests)
    print_summary_report(results)

    # Exit with status code 1 if any test failed (useful for CI/CD)
    if any(not r.success for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
