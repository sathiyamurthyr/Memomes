import pytest
from unittest.mock import MagicMock, AsyncMock
from minio import Minio
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def mock_minio() -> MagicMock:
    """
    Mock MinIO client to avoid network S3 requests during testing.
    """
    mock_client = MagicMock(spec=Minio)
    mock_client.bucket_exists.return_value = True
    
    # Mock presigned URL generation
    mock_client.presigned_get_object.return_value = "https://mock-minio/memomes/tenant/file?signature=mock"
    
    # Mock get_object to return a dummy file reader
    mock_response = MagicMock()
    mock_response.read.return_value = b"mock-encrypted-file-bytes"
    mock_response.close = MagicMock()
    mock_response.release_conn = MagicMock()
    mock_client.get_object.return_value = mock_response
    
    return mock_client


@pytest.fixture
def mock_db() -> AsyncMock:
    """
    Mock SQLAlchemy AsyncSession for mock database transactions.
    """
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    
    # Mock execute queries
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_result
    
    return session
