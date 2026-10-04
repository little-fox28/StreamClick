"""Batch Consumer module alias and re-export."""

import sys
from batch import datalake_consumer
from batch.datalake_consumer import DataLakeConsumer, datetime

# Map batch.consumer directly to datalake_consumer module in sys.modules
sys.modules["batch.consumer"] = datalake_consumer

__all__ = ["DataLakeConsumer", "datetime"]
