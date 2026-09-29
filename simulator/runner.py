"""Module Simulation Runner.

Điều phối quá trình đọc dữ liệu, quản lý Connection Pooling HTTP, gửi Request
tới API, áp dụng tính năng Rate Limiting và Phòng thủ (Fault Tolerance).
"""

import gc
import logging
import time
from pathlib import Path
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Inject package
import simulator
from core.schemas.clickstream import ClickstreamEvent
from simulator.dataset import stream_csv_chunks
from simulator.transformer import map_kaggle_row_to_event

logger = logging.getLogger("streamclick.simulator.runner")

def create_http_session(
    pool_connections: int = 20,
    pool_maxsize: int = 50,
    max_retries: int = 3,
    backoff_factor: float = 0.3,
) -> requests.Session:
    """Khởi tạo HTTP Client Session với Connection Pooling siêu việt."""
    session = requests.Session()
    retry_strategy = Retry(
        total=max_retries,
        backoff_factor=backoff_factor,
        status_forcelist=[502, 503, 504],
        allowed_methods=["POST"],
    )
    adapter = HTTPAdapter(
        pool_connections=pool_connections,
        pool_maxsize=pool_maxsize,
        max_retries=retry_strategy,
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


class SimulationRunner:
    def __init__(
        self,
        api_url: str,
        delay_seconds: float = 0.01,
        request_timeout: float = 5.0,
        max_events: Optional[int] = None,
    ) -> None:
        self.api_url = api_url
        self.delay_seconds = delay_seconds
        self.request_timeout = request_timeout
        self.max_events = max_events

        self.session = create_http_session()
        self.total_processed: int = 0
        self.success_count: int = 0
        self.client_error_count: int = 0
        self.server_error_count: int = 0
        self.network_error_count: int = 0
        self.start_time: float = 0.0

    def send_event(self, event: ClickstreamEvent) -> bool:
        payload = event.to_message_dict()
        try:
            response = self.session.post(
                url=self.api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.request_timeout,
            )
            if response.status_code in [200, 201, 202]:
                self.success_count += 1
                return True
            elif 400 <= response.status_code < 500:
                self.client_error_count += 1
                logger.warning("Client error [%d]: %s", response.status_code, response.text[:100])
                return False
            else:
                self.server_error_count += 1
                logger.warning("Server error [%d]: %s", response.status_code, response.text[:100])
                return False
        except requests.exceptions.Timeout:
            self.network_error_count += 1
            return False
        except requests.exceptions.ConnectionError:
            self.network_error_count += 1
            return False
        except Exception:
            self.network_error_count += 1
            return False

    def run_from_csv(self, file_path: Path, chunk_size: int = 1000) -> None:
        self.start_time = time.perf_counter()
        logger.info("Starting simulation from CSV file '%s'...", file_path)

        try:
            for chunk_idx, chunk in enumerate(stream_csv_chunks(file_path, chunk_size=chunk_size), 1):
                logger.info("Processing chunk #%d (%d records)...", chunk_idx, len(chunk))

                for row in chunk:
                    try:
                        event = map_kaggle_row_to_event(row)
                        if event is None:
                            continue
                        self.send_event(event)
                        self.total_processed += 1
                        
                        if self.delay_seconds > 0:
                            time.sleep(self.delay_seconds)
                        if self.max_events and self.total_processed >= self.max_events:
                            return

                    except Exception as e:
                        logger.debug("Row processing skipped: %s", e)
                        continue

                # Trả RAM ngay lập tức
                del chunk
                gc.collect()
        except KeyboardInterrupt:
            logger.warning("Nhận tín hiệu dừng từ người vận hành (Ctrl+C).")
        finally:
            self.print_summary()

    def print_summary(self) -> None:
        elapsed = max(time.perf_counter() - self.start_time, 0.001)
        throughput = self.total_processed / elapsed
        success_rate = (self.success_count / self.total_processed * 100) if self.total_processed > 0 else 0.0

        print(f"\nTarget API Endpoint    : {self.api_url}")
        print(f"Total Events Processed : {self.total_processed:,}")
        print(f"Successful (HTTP 202)  : {self.success_count:,} ({success_rate:.1f}%)")
        print(f"Client Errors (4xx)    : {self.client_error_count:,}")
        print(f"Server Errors (5xx)    : {self.server_error_count:,}")
        print(f"Network / Timeouts     : {self.network_error_count:,}")
        print(f"Execution Duration     : {elapsed:.2f} seconds")
        print(f"Average Throughput     : {throughput:.1f} events/second\n")
