from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional


class FileMetadataDTO(BaseModel):
    id: UUID
    tenant_id: str
    user_id: str
    folder_id: Optional[str] = None
    bucket_name: str
    object_key: str
    original_file_name: str
    encrypted_file_name: str
    mime_type: str
    extension: str
    file_size: int
    sha256_hash: str
    thumbnail_key: Optional[str] = None
    preview_key: Optional[str] = None
    storage_provider: str
    encryption_version: str
    is_encrypted: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
