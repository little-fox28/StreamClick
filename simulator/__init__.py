"""Simulator Package Initialization."""

import sys
from pathlib import Path

# Cấp độ: simulator/ -> root (lùi 1 cấp)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
