import random
import time
import uuid
import requests

API_URL = "http://localhost:8000/v1/events"
EVENT_TYPES = ["page_view", "product_view", "add_to_cart", "purchase", "search"]
PRODUCTS = [f"PROD_{i:03d}" for i in range(1, 20)]


def generate_mock_event():
    user_id = f"user_{random.randint(1, 50)}"
    anonymous_id = f"anon_{random.randint(100, 999)}"
    session_id = f"sess_{random.randint(1000, 9999)}"
    event_type = random.choice(EVENT_TYPES)
    product_id = random.choice(PRODUCTS) if event_type in ["product_view", "add_to_cart", "purchase"] else None

    return {
        "event_id": str(uuid.uuid4()),
        "user_id": user_id,
        "anonymous_id": anonymous_id,
        "session_id": session_id,
        "event_type": event_type,
        "page_url": f"https://shop.example.com/products/{product_id}" if product_id else "https://shop.example.com/home",
        "product_id": product_id,
        "price": round(random.uniform(10.0, 500.0), 2) if product_id else None,
        "currency": "USD"
    }


def main(total_events=50, interval_sec=0.2):
    print(f"🚀 Sending {total_events} mock clickstream events to {API_URL}...")
    for i in range(total_events):
        event = generate_mock_event()
        try:
            res = requests.post(API_URL, json=event)
            if res.status_code == 202:
                print(f"[{i+1}/{total_events}] Sent {event['event_type']} ({event.get('product_id')}) -> HTTP {res.status_code}")
            else:
                print(f"Failed: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"Connection error: {e}")
        time.sleep(interval_sec)


if __name__ == "__main__":
    main()
