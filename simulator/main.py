"""Entrypoint Simulator CLI."""

import simulator
import argparse
import logging
import sys
from pathlib import Path

from simulator.dataset import download_or_get_dataset
from simulator.runner import SimulationRunner

# Lấy PROJECT_ROOT từ package __init__
from simulator import PROJECT_ROOT

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("streamclick.simulator.main")

def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="StreamClick E-commerce Simulator")
    parser.add_argument("-f", "--file", type=str, default=None, help="Local CSV path")
    parser.add_argument("--dataset", type=str, default="waqi786/e-commerce-clickstream-and-transaction-dataset", help="Kaggle handle")
    parser.add_argument("-u", "--url", type=str, default="http://localhost:8000/track", help="API URL")
    parser.add_argument("-c", "--chunk-size", type=int, default=1000, help="Batch read rows")
    parser.add_argument("-d", "--delay", type=float, default=0.01, help="Pacing (seconds)")
    parser.add_argument("-l", "--limit", type=int, default=100, help="Max events restriction")
    parser.add_argument("-t", "--timeout", type=float, default=5.0, help="HTTP Timeout (s)")
    return parser.parse_args()

def main() -> None:
    args = parse_arguments()
    runner = SimulationRunner(
        api_url=args.url,
        delay_seconds=args.delay,
        request_timeout=args.timeout,
        max_events=args.limit,
    )

    if args.file:
        csv_path = Path(args.file).resolve()
        if not csv_path.is_file():
            logger.error("Local file '%s' could not be found!", csv_path)
            sys.exit(1)
    else:
        logger.info("Fetching dataset via kagglehub...")
        try:
            csv_path = download_or_get_dataset(dataset_handle=args.dataset, project_root=PROJECT_ROOT)
        except Exception as exc:
            logger.error("Failed to acquire dataset: %s", exc)
            sys.exit(1)

    runner.run_from_csv(file_path=csv_path, chunk_size=args.chunk_size)

if __name__ == "__main__":
    main()
