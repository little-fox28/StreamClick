"""Module Dataset Handler.

Chịu trách nhiệm quản lý I/O: tải bộ dataset thực tế từ Kaggle Hub, lưu cục bộ
chuẩn Idempotent, và cung cấp Generator để đọc file theo lô (Memory Efficiency).
"""

import csv
import itertools
import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Generator, List, Optional

from dotenv import load_dotenv

logger = logging.getLogger("streamclick.simulator.dataset")

def _ensure_kaggle_auth() -> None:
    """Đảm bảo quá trình xác thực Kaggle thành công trước khi download."""
    try:
        import kagglehub
    except ImportError:
        logger.error("Library 'kagglehub' is not installed! Run: pip install kagglehub")
        raise

    # 1. Thử load credentials từ file .env ở thư mục gốc nếu tồn tại
    project_root = Path(__file__).resolve().parent.parent
    env_file = project_root / ".env"
    if env_file.is_file():
        load_dotenv(dotenv_path=env_file)

    # 2. Xử lý xác thực qua Token gom nhất: KAGGLE_API_TOKEN
    import kagglehub.config
    token = os.getenv("KAGGLE_API_TOKEN")
    
    # Nếu hệ thống đã nạp trực tiếp qua Token JWT/Bearer:
    if token:
        logger.info("Kaggle credentials detected via KAGGLE_API_TOKEN in .env.")
        try:
            # Inject token vào config nội bộ của Kagglehub để bypass cơ chế đăng nhập truyền thống
            os.environ["KAGGLE_API_TOKEN"] = token
            return 
        except Exception as e:
            logger.debug("Tự động gán token thất bại. Giao nhiệm vụ lại cho kagglehub xử lý: %s", e)

    # Cách dự phòng: Nếu KAGGLE_USERNAME và KAGGLE_KEY đã có:
    if os.getenv("KAGGLE_USERNAME") and os.getenv("KAGGLE_KEY"):
        logger.info("Kaggle credentials detected via username/key environment variables.")
        return

    # Cách dự phòng: Nếu có file kaggle.json mặc định trên máy thì API tự nhận diện.
    kaggle_json_path = Path.home() / ".kaggle" / "kaggle.json"
    if kaggle_json_path.is_file():
        logger.info("Kaggle credentials detected via ~/.kaggle/kaggle.json.")
        return

    # Nếu tất cả thất bại, kích hoạt cơ chế đăng nhập tương tác (Interactive Login) qua CLI
    logger.warning("No Kaggle credentials found. Prompting for interactive login...")
    try:
        kagglehub.login()
    except Exception as exc:
        logger.error("Kaggle interactive login failed: %s", exc)
        raise PermissionError(
            "Authentication required! Please provide KAGGLE_API_TOKEN in your .env file."
        ) from exc


def download_or_get_dataset(
    dataset_handle: str = "waqi786/e-commerce-clickstream-and-transaction-dataset",
    target_dir: Optional[Path] = None,
    project_root: Optional[Path] = None,
) -> Path:
    """Tải dataset từ Kaggle Hub và lưu trữ trực tiếp vào thư mục data/raw của dự án."""
    try:
        import kagglehub
    except ImportError:
        logger.error("Library 'kagglehub' is not installed! Run: pip install kagglehub")
        raise

    if target_dir is None and project_root is not None:
        target_dir = project_root / "data" / "raw"
    elif target_dir is None:
        target_dir = Path.cwd() / "data" / "raw"

    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Idempotency check: Kiểm tra xem đã có dataset chưa.
    existing_csvs = list(target_dir.glob("*.csv"))
    if existing_csvs:
        selected_csv = existing_csvs[0]
        logger.info(
            "Found existing dataset in project: %s (Size: %.2f MB)",
            selected_csv.name,
            selected_csv.stat().st_size / (1024 * 1024),
        )
        return selected_csv

    # 2. Xử lý ủy quyền Auth
    _ensure_kaggle_auth()

    # 3. Tiến hành tải
    logger.info("Fetching '%s' via Kaggle Hub...", dataset_handle)
    
    # Hỗ trợ bypass credential check của kagglehub nếu có
    downloaded_dir = Path(kagglehub.dataset_download(dataset_handle))
    
    downloaded_csvs = list(downloaded_dir.glob("*.csv"))
    if not downloaded_csvs:
        raise FileNotFoundError(f"No CSV file found in downloaded path: {downloaded_dir}")

    source_csv = downloaded_csvs[0]
    dest_csv = target_dir / source_csv.name

    logger.info("Staging dataset to project repository: %s", dest_csv)
    shutil.copy2(source_csv, dest_csv)
    return dest_csv


def stream_csv_chunks(
    file_path: Path,
    chunk_size: int = 1000,
) -> Generator[List[Dict[str, str]], None, None]:
    """Đọc tệp CSV dung lượng lớn theo từng lô nhỏ (chunks) dưới dạng Generator O(1) RAM."""
    logger.info("Opening dataset file '%s' with chunk size %d...", file_path, chunk_size)
    with open(file_path, mode="r", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        while True:
            chunk = list(itertools.islice(reader, chunk_size))
            if not chunk:
                break
            yield chunk
