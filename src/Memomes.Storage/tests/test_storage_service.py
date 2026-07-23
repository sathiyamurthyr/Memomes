import pytest
import uuid
from unittest.mock import MagicMock, AsyncMock, patch
from src.services.storage import StorageService
from src.models.file_metadata import FileMetadata


@pytest.mark.asyncio
async def test_get_category_folder(mock_db, mock_minio):
    service = StorageService(mock_db, mock_minio)
    
    # Verify MIME to category folder mappings
    assert service._get_category_folder("image/png", ".png") == "photos"
    assert service._get_category_folder("video/mp4", ".mp4") == "videos"
    assert service._get_category_folder("application/pdf", ".pdf") == "documents"
    assert service._get_category_folder("application/zip", ".zip") == "archives"
    assert service._get_category_folder("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx") == "office"
    assert service._get_category_folder("application/octet-stream", ".bin", is_vault=True) == "vault"


@pytest.mark.asyncio
async def test_upload_file(mock_db, mock_minio):
    service = StorageService(mock_db, mock_minio)
    
    # Mock PreviewService process_preview_pipeline as an AsyncMock
    with patch("src.services.storage.PreviewService") as mock_preview_class:
        mock_preview_svc = mock_preview_class.return_value
        mock_preview_svc.process_preview_pipeline = AsyncMock(return_value=("thumb_key", "preview_key"))
        
        metadata = await service.upload_file(
            tenant_id="tenant_1",
            user_id="user_A",
            folder_id="folder_X",
            original_file_name="test.png",
            encrypted_file_name="enc_test.png",
            file_data=b"dummy-image-bytes",
            mime_type="image/png",
            extension=".png",
            sha256_hash="hash123",
            is_encrypted=True
        )
        
        assert metadata.tenant_id == "tenant_1"
        assert metadata.user_id == "user_A"
        assert metadata.folder_id == "folder_X"
        assert metadata.original_file_name == "test.png"
        assert metadata.mime_type == "image/png"
        assert metadata.sha256_hash == "hash123"
        assert metadata.thumbnail_key == "thumb_key"
        assert metadata.preview_key == "preview_key"
        
        # Verify minio put_object was called
        mock_minio.put_object.assert_called_once()
        mock_db.add.assert_called_once_with(metadata)
        mock_db.flush.assert_called_once()


@pytest.mark.asyncio
async def test_download_file(mock_db, mock_minio):
    service = StorageService(mock_db, mock_minio)
    
    mock_metadata = FileMetadata(
        id=uuid.uuid4(),
        tenant_id="tenant_1",
        user_id="user_A",
        bucket_name="memomes",
        object_key="tenant_1/user_A/photos/test.png",
        original_file_name="test.png",
        encrypted_file_name="enc.png",
        mime_type="image/png",
        extension=".png",
        file_size=100,
        sha256_hash="hash123"
    )
    
    # Mock database retrieval
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_metadata
    
    data, meta = await service.download_file(mock_metadata.id)
    
    assert data == b"mock-encrypted-file-bytes"
    assert meta.id == mock_metadata.id
    mock_minio.get_object.assert_called_once_with("memomes", mock_metadata.object_key)


@pytest.mark.asyncio
async def test_delete_file_soft(mock_db, mock_minio):
    service = StorageService(mock_db, mock_minio)
    
    mock_metadata = FileMetadata(
        id=uuid.uuid4(),
        status="ACTIVE"
    )
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_metadata
    
    success = await service.delete_file(mock_metadata.id, soft_delete=True)
    
    assert success is True
    assert mock_metadata.status == "TRASHED"
    assert mock_metadata.deleted_at is not None
    mock_minio.remove_object.assert_not_called()


@pytest.mark.asyncio
async def test_delete_file_permanent(mock_db, mock_minio):
    service = StorageService(mock_db, mock_minio)
    
    mock_metadata = FileMetadata(
        id=uuid.uuid4(),
        bucket_name="memomes",
        object_key="some-key",
        thumbnail_key="thumb-key",
        preview_key="preview-key",
        status="TRASHED"
    )
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_metadata
    
    success = await service.delete_file(mock_metadata.id, soft_delete=False)
    
    assert success is True
    mock_minio.remove_object.assert_any_call("memomes", "some-key")
    mock_minio.remove_object.assert_any_call("memomes", "thumb-key")
    mock_minio.remove_object.assert_any_call("memomes", "preview-key")
    mock_db.delete.assert_called_once_with(mock_metadata)
