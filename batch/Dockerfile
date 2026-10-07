FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system build dependencies (required for confluent-kafka and some data libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    libc-dev \
    librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

COPY batch/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy common core logic and batch module
COPY core/ /app/core/
COPY batch/ /app/batch/

# Chạy script bằng module flag để tránh lỗi ModuleNotFoundError
CMD ["python", "-m", "batch.datalake_consumer"]
