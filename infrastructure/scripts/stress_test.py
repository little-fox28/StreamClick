import argparse
import concurrent.futures
import json
import os
import random
import time
import uuid
import requests

API_URL = "http://localhost:8000/v1/events"


def generate_mock_event():
    event_types = ["page_view", "product_view", "add_to_cart", "purchase"]
    event_type = random.choice(event_types)
    product_id = f"PROD_{random.randint(1, 100):03d}" if event_type in ["product_view", "add_to_cart", "purchase"] else None

    return {
        "event_id": str(uuid.uuid4()),
        "user_id": f"user_{random.randint(1, 1000)}",
        "anonymous_id": f"anon_{random.randint(1000, 9999)}",
        "session_id": f"sess_{random.randint(10000, 99999)}",
        "event_type": event_type,
        "page_url": f"https://shop.example.com/products/{product_id}" if product_id else "https://shop.example.com/home",
        "product_id": product_id,
        "price": round(random.uniform(5.0, 300.0), 2) if product_id else None,
        "currency": "USD"
    }


def send_request(session, payload):
    start = time.perf_counter()
    try:
        res = session.post(API_URL, json=payload, timeout=5)
        duration = time.perf_counter() - start
        return res.status_code == 202, duration, res.status_code
    except Exception as e:
        duration = time.perf_counter() - start
        return False, duration, str(e)


def run_stress_test(total_requests: int = 5000, concurrency: int = 50, dataset_path: str = None):
    events_pool = []
    if dataset_path and os.path.exists(dataset_path):
        print(f"📂 Loading dataset from {dataset_path}...")
        with open(dataset_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    events_pool.append(json.loads(line.strip()))
        print(f"✅ Loaded {len(events_pool)} events from dataset file.")
    else:
        print(f"⚡ Generating events dynamically in-memory...")

    print(f"\n🚀 Starting Stress Test:")
    print(f"   - Target URL: {API_URL}")
    print(f"   - Total Requests: {total_requests}")
    print(f"   - Concurrency (Workers): {concurrency}\n")

    latencies = []
    success_count = 0
    fail_count = 0

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(pool_connections=concurrency, pool_maxsize=concurrency * 2)
    session.mount('http://', adapter)

    start_time = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(total_requests):
            payload = events_pool[i % len(events_pool)] if events_pool else generate_mock_event()
            futures.append(executor.submit(send_request, session, payload))

        for future in concurrent.futures.as_completed(futures):
            success, duration, status = future.result()
            latencies.append(duration)
            if success:
                success_count += 1
            else:
                fail_count += 1

    total_time = time.perf_counter() - start_time
    rps = total_requests / total_time

    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.50)] * 1000
    p95 = latencies[int(len(latencies) * 0.95)] * 1000
    p99 = latencies[int(len(latencies) * 0.99)] * 1000

    print("=" * 50)
    print("📊 STRESS TEST RESULTS")
    print("=" * 50)
    print(f"Total Time:         {total_time:.2f} s")
    print(f"Throughput (RPS):   {rps:.2f} requests/sec")
    print(f"Success Count:      {success_count} ({success_count / total_requests * 100:.1f}%)")
    print(f"Failure Count:      {fail_count}")
    print(f"Latency p50:        {p50:.2f} ms")
    print(f"Latency p95:        {p95:.2f} ms")
    print(f"Latency p99:        {p99:.2f} ms")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stress test StreamClick Ingestion API")
    parser.add_argument("--requests", type=int, default=5000, help="Total number of requests")
    parser.add_argument("--concurrency", type=int, default=50, help="Number of concurrent workers")
    parser.add_argument("--data", type=str, default=None, help="Path to custom dataset JSON/JSONL file")
    args = parser.parse_args()

    run_stress_test(total_requests=args.requests, concurrency=args.concurrency, dataset_path=args.data)
