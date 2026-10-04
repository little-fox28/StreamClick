"""Batch processing module for StreamClick."""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from batch.datalake_consumer import DataLakeConsumer

__all__ = ["DataLakeConsumer"]
