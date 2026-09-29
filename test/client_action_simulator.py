"""StreamClick E-commerce Data Simulator.

Module này đóng vai trò là Client Simulator mô phỏng lưu lượng truy cập của người dùng
trên nền tảng thương mại điện tử:
1. Tự động tải dataset thực tế từ Kaggle Hub và lưu trữ vào thư mục 'data/raw/'.
2. Đọc file CSV theo từng lô nhỏ (chunks) tối ưu bộ nhớ RAM O(1).
3. Chuyển đổi dữ liệu thô sang Data Contract 4W1H (Pydantic V2 ClickstreamEvent).
4. Gửi liên tục HTTP POST requests đến Ingestion API (/track) qua Connection Pooling.
5. Kiểm soát tốc độ phát (Rate Limiting) và phòng thủ lỗi mạng (Fault Tolerance).
"""

import argparse
import csv
from datetime import datetime, timezone
import gc
import itertools
import logging
import os
from pathlib import Path
import random
import shutil
import sys
import time
from typing import Any, Dict, Generator, List, Optional
import uuid

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Đảm bảo Python nhận diện được package 'core' từ thư mục gốc của dự án
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from core.schemas.clickstream import ClickstreamEvent, DeviceContext, EventType

# Cấu hình technical logging chuẩn
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("streamclick.simulator")

# Danh mục dữ liệu giả lập ngữ cảnh client (Context Enrichment)
SAMPLE_OS = ["iOS", "Android", "Windows", "macOS", "Linux"]
SAMPLE_BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"]
SAMPLE_REFERRERS = [
    "https://www.google.com/search?q=ecommerce+deals",
    "https://facebook.com/ads",
    "https://instagram.com/feed",
    "https://streamclick.shop/home",
    None,
]

def download_dataset(
        dataset_handle: str = "waqi786/e-commerce-clickstream-and-transaction-dataset",
        target_dir: Optional[Path] = None,
) -> Path:
    """Tải dataset từ Kaggle Hub và lưu trữ trực tiếp vào thư mục data/raw của dự án.

    Hàm kiểm tra tính sẵn sàng của dữ liệu cục bộ:
    - Nếu trong thư mục đích đã tồn tại file CSV, sử dụng lại ngay (Idempotent).
    - Nếu chưa có, tự động tải qua kagglehub và sao chép vào data/raw.

    Args:
        dataset_handle: Định danh Kaggle Dataset (owner/dataset-name).
        target_dir: Thư mục lưu trữ cục bộ trong dự án (mặc định là data/raw).

    Returns:
        Path: Đường dẫn tuyệt đối tới tệp CSV dữ liệu nguồn.

    Raises:
        ImportError: Nếu thư viện kagglehub chưa được cài đặt.
        FileNotFoundError: Nếu không tìm thấy file CSV sau khi tải.
    """
    try:
        import kagglehub
    except ImportError:
        logger.error("Library 'kagglehub' is not installed! Run: pip install kagglehub")
        raise

    # Kiểm tra sự tồn tại của thư mục
    if target_dir is None:
        target_dir = PROJECT_ROOT / "data" / "raw"
    target_dir.mkdir(parents=True, exist_ok=True)

    # Kiểm tra sự tồn tại của dataset
    existing_csvs = list(target_dir.glob("*.csv"))
    if existing_csvs:
        selected_csv = existing_csvs[0] # chọn dataset mới nhất
        logger.info(
            "Found existing dataset in project: %s (Size: %.2f MB)",
            selected_csv.name,
            selected_csv.stat().st_size / (1024 * 1024),
        )
        return selected_csv

    # Nếu dataset chưa tồn tại
    logger.info("Dataset not found in '%s'. Fetching '%s' via Kaggle Hub...", target_dir, dataset_handle)
    downloaded_dir = Path(kagglehub.dataset_download(dataset_handle))
    logger.info("KaggleHub cache directory: %s", downloaded_dir)

    downloaded_csvs = list(downloaded_dir.glob("*.csv"))
    if not downloaded_csvs:
        raise FileNotFoundError(f"No CSV file found in downloaded path: {downloaded_dir}")

    source_csv = downloaded_csvs[0]
    dest_csv = target_dir / source_csv.name

    # 3. Sao chép file CSV vào thư mục data/raw của dự án
    logger.info("Staging dataset to project repository: %s", dest_csv)
    shutil.copy2(source_csv, dest_csv)
    logger.info("Dataset staging completed successfully (Size: %.2f MB).", dest_csv.stat().st_size / (1024 * 1024))
    return dest_csv

def create_http_session(
    pool_connections: int = 20,
    pool_maxsize: int = 50,
    max_retries: int = 3,
    backoff_factor: float = 0.3,
) -> requests.Session:
    """Khởi tạo HTTP Client Session với Connection Pooling và Retry tự động.

    Tái sử dụng TCP connection thông qua HTTP Keep-Alive, giúp giảm thiểu độ trễ
    và tối ưu thông lượng khi gửi hàng nghìn requests liên tục tới Ingestion API.

    Args:
        pool_connections: Số lượng connection pools được lưu trữ trong cache.
        pool_maxsize: Số lượng kết nối tối đa được duy trì trong pool.
        max_retries: Số lần tự động thử lại khi gặp sự cố mạng tầng transport.
        backoff_factor: Hệ số tính thời gian chờ giữa các lần retry.

    Returns:
        requests.Session: Đối tượng Session đã được cấu hình adapter tối ưu.
    """
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

def chunk_process(
    file_path: Path,
    chunk_size: int = 1000,
) -> Generator[List[Dict[str, str]], None, None]:
    """Đọc tệp CSV dung lượng lớn theo từng lô nhỏ (chunks) dưới dạng Generator.
        Hàm này đảm bảo tính hiệu quả bộ nhớ (Memory Efficiency - O(1) RAM Footprint),
        chỉ nạp một lượng cố định các dòng vào bộ nhớ trong mỗi chu kỳ,
        giúp xử lý an toàn các tệp dataset lớn mà không gây lỗi Out-Of-Memory (OOM).
        Args:
            file_path: Đường dẫn tệp CSV nguồn.
            chunk_size: Số lượng dòng dữ liệu tối đa trong mỗi chunk.
        Yields:
            List[Dict[str, str]]: Danh sách các bản ghi thô dưới dạng dictionary.
        """
    logger.info("Opening dataset file '%s' with chunk size %d...", file_path, chunk_size)
    with open(file_path, mode="r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        while True:
            chunk = list(itertools.islice(reader, chunk_size))
            if not chunk:
                break
            yield chunk

def map_kaggle_row_to_event(row: Dict[str, str]) -> Optional[ClickstreamEvent]:
    """Chuyển đổi một dòng dữ liệu từ Kaggle CSV thành ClickstreamEvent hợp lệ.

    Áp dụng mô hình 4W1H:
    - Who: UserID, SessionID được ánh xạ sang user_id, session_id, anonymous_id.
    - When: Chuyển đổi chuỗi Timestamp Kaggle sang UTC datetime ISO 8601.
    - What: Ánh xạ EventType sang EventType Enum của hệ thống.
    - Where: Sinh URL trang page_url dựa trên ProductID.
    - How: Nhúng thông tin thiết bị (DeviceContext) và thuộc tính mở rộng (Outcome).

    Args:
        row: Bản ghi dữ liệu thô từ CSV.

    Returns:
        Optional[ClickstreamEvent]: Schema Pydantic đã xác thực, hoặc None nếu lỗi.
    """
    def get_val(*keys: str, default: str = "") -> str:
        for k in keys:
            if k in row and row[k] is not None:
                return str(row[k]).strip()
        return default

    # 1. Parse Event Type (WHAT)
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

    # 2. Parse Timestamp (WHEN)
    raw_time = get_val("Timestamp", "event_time")
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

    # 3. Parse Identifiers (WHO)
    user_id_raw = get_val("UserID", "user_id")
    user_id = user_id_raw if user_id_raw else None

    session_id_raw = get_val("SessionID", "user_session")
    session_id = session_id_raw if session_id_raw else f"sess_{uuid.uuid4().hex[:12]}"
    anonymous_id = f"anon_{user_id if user_id else session_id}"

    # 4. Product & Amount/Price (WHERE & WHAT)
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

    # 5. Device & Properties (HOW)
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