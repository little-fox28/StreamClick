from batch import DataLakeConsumer
import io
import json
from datetime import datetime
import pytest
from unittest.mock import MagicMock, patch
import pyarrow.parquet as pq

# Giả định: File batch/consumer.py (hoặc tương tự) chứa class DataLakeConsumer 
# đang ở trạng thái rỗng hoặc chưa được implement logic.



@pytest.fixture
def mock_kafka_consumer():
    """Mock đối tượng Kafka Consumer (ví dụ: confluent_kafka.Consumer)."""
    return MagicMock()


@pytest.fixture
def mock_storage_client():
    """Mock đối tượng Storage Client (ví dụ: MinIO API client)."""
    return MagicMock()


@pytest.fixture
def batch_consumer(mock_kafka_consumer, mock_storage_client):
    """Khởi tạo DataLakeConsumer với các dependency được giả lập (Injection)."""
    return DataLakeConsumer(
        consumer=mock_kafka_consumer,
        storage=mock_storage_client
    )


@pytest.fixture
def valid_json_messages():
    """Giả lập 100 JSON messages trả về từ Redpanda."""
    return [
        json.dumps({
            "event_id": f"evt_{i}",
            "user_id": f"user_{i}",
            "event_type": "click",
            "timestamp": "2026-10-02T10:00:00Z"
        })
        for i in range(100)
    ]


def test_tdd_batch_transformation_to_parquet(batch_consumer, valid_json_messages):
    # Hành động
    parquet_buffer = batch_consumer.process_messages(valid_json_messages)

    # Kỳ vọng: Trả về một BytesIO object định dạng Parquet
    assert isinstance(parquet_buffer, io.BytesIO)
    
    # Kiểm tra tính hợp lệ của file Parquet
    parquet_buffer.seek(0)
    table = pq.read_table(parquet_buffer)
    
    assert table.num_rows == 100
    assert "event_id" in table.column_names
    assert "event_type" in table.column_names


@patch("batch.consumer.datetime")
def test_tdd_minio_partitioned_path_generation(mock_datetime, batch_consumer):
    # Bối cảnh: Giả lập thời gian hiện tại
    mock_now = datetime(2026, 10, 2, 18, 30, 0)
    mock_datetime.now.return_value = mock_now
    
    dummy_parquet_buffer = io.BytesIO(b"dummy_parquet_data")
    
    # Hành động
    batch_consumer.upload_to_datalake(dummy_parquet_buffer)
    
    # Kỳ vọng: Hàm upload của Storage Client phải được gọi
    assert batch_consumer.storage.upload.called
    
    # Kỳ vọng: Phải gọi với object key chứa đường dẫn phân vùng (YYYY/MM/DD/)
    call_args, call_kwargs = batch_consumer.storage.upload.call_args
    # Lấy destination_path từ kwargs hoặc args (phụ thuộc vào chữ ký thiết kế của upload)
    destination_path = call_kwargs.get("destination_path") if "destination_path" in call_kwargs else call_args[1]
    
    assert "2026/10/02/" in destination_path


def test_tdd_safe_offset_commit_on_success(batch_consumer, valid_json_messages):
    # Bối cảnh: Giả lập luồng read -> transform -> upload thành công
    batch_consumer.consumer.poll.return_value = valid_json_messages
    batch_consumer.process_messages = MagicMock(return_value=io.BytesIO(b"dummy"))
    batch_consumer.upload_to_datalake = MagicMock(return_value=True) # Success
    
    # Hành động
    batch_consumer.run_once()
    
    # Kỳ vọng: commit() bắt buộc phải được gọi 1 lần
    batch_consumer.upload_to_datalake.assert_called_once()
    batch_consumer.consumer.commit.assert_called_once()


def test_tdd_no_commit_on_minio_failure(batch_consumer, valid_json_messages):
    # Bối cảnh: Giả lập MinIO trả về ConnectionError
    batch_consumer.consumer.poll.return_value = valid_json_messages
    batch_consumer.process_messages = MagicMock(return_value=io.BytesIO(b"dummy"))
    
    batch_consumer.upload_to_datalake.side_effect = ConnectionError("MinIO is down")
    
    # Hành động
    try:
        batch_consumer.run_once()
    except Exception as e:
        pytest.fail(f"Hàm run_once() không được văng Exception làm crash worker. Đã văng: {e}")
        
    # Kỳ vọng: upload có được gọi, nhưng commit() BẮT BUỘC KHÔNG được gọi
    batch_consumer.upload_to_datalake.assert_called_once()
    batch_consumer.consumer.commit.assert_not_called()
