import pytest
import uuid
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from src.main import app
from src.db import get_db
from src.auth import get_current_user
from src.models.file_metadata import FileMetadata

client = TestClient(app)


# Mock user details
MOCK_USER = {
    "user_id": "user_123",
    "tenant_id": "tenant_abc",
    "email": "test@example.com",
    "role": "user"
}


@pytest.fixture(autouse=True)
def override_dependencies(mock_db, mock_minio):
    """
    Overrides db session and JWT verification dependencies for route testing.
    Also mocks global minio_client instances.
    """
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    
    with patch("src.services.storage.minio_client", mock_minio), \
         patch("src.client.minio_client", mock_minio), \
         patch("src.main.minio_client", mock_minio):
        yield
        
    app.dependency_overrides.clear()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_upload_api_success(mock_db):
    # Mock PreviewService process_preview_pipeline as an AsyncMock
    with patch("src.services.storage.PreviewService") as mock_preview_class:
        mock_preview_svc = mock_preview_class.return_value
        mock_preview_svc.process_preview_pipeline = AsyncMock(return_value=("thumb_key", "preview_key"))
        
        file_payload = {"file": ("test.png", b"dummy-image-data", "image/png")}
        form_data = {
            "original_file_name": "test.png",
            "encrypted_file_name": "enc_test.png",
            # SHA-256 for b"dummy-image-data"
            "sha256_hash": "3c218715443d6d176053ec0980452cba5bf5250a7f8bbf5ae9e392eee575bde8",
            "folder_id": "folder_123",
            "is_encrypted": "true",
            "is_vault": "false"
        }
        
        response = client.post("/api/v1/storage/upload", files=file_payload, data=form_data)
        
        assert response.status_code == 201
        res_data = response.json()
        assert res_data["original_file_name"] == "test.png"
        assert res_data["sha256_hash"] == "3c218715443d6d176053ec0980452cba5bf5250a7f8bbf5ae9e392eee575bde8"
        assert res_data["thumbnail_key"] == "thumb_key"
        assert res_data["preview_key"] == "preview_key"


def test_upload_api_hash_mismatch():
    file_payload = {"file": ("test.png", b"dummy-image-data", "image/png")}
    form_data = {
        "original_file_name": "test.png",
        "encrypted_file_name": "enc_test.png",
        "sha256_hash": "wrong-hash",
        "is_encrypted": "true",
        "is_vault": "false"
    }
    
    response = client.post("/api/v1/storage/upload", files=file_payload, data=form_data)
    assert response.status_code == 400
    assert "checksum mismatch" in response.json()["detail"]


def test_download_api_success(mock_db, mock_minio):
    file_id = uuid.uuid4()
    mock_metadata = FileMetadata(
        id=file_id,
        tenant_id="tenant_abc",
        user_id="user_123",
        bucket_name="memomes",
        object_key="tenant_abc/user_123/photos/test.png",
        original_file_name="test.png",
        encrypted_file_name="enc.png",
        mime_type="image/png",
        extension=".png",
        file_size=100,
        sha256_hash="hash123",
        status="ACTIVE"
    )
    
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_metadata
    
    response = client.get(f"/api/v1/storage/{file_id}")
    
    assert response.status_code == 200
    assert response.content == b"mock-encrypted-file-bytes"
    assert "attachment; filename=\"enc.png\"" in response.headers["Content-Disposition"]


def test_download_api_forbidden(mock_db):
    file_id = uuid.uuid4()
    mock_metadata = FileMetadata(
        id=file_id,
        tenant_id="other_tenant",
        user_id="other_user",
        status="ACTIVE"
    )
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_metadata
    
    response = client.get(f"/api/v1/storage/{file_id}")
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]
