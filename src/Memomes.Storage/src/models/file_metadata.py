import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, BigInteger, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base


class FileMetadata(Base):
    __tablename__ = "file_metadata"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    folder_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    
    bucket_name: Mapped[str] = mapped_column(String(100), nullable=False)
    object_key: Mapped[str] = mapped_column(String(1024), nullable=False, unique=True, index=True)
    original_file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    encrypted_file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    extension: Mapped[str] = mapped_column(String(20), nullable=False)
    
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    thumbnail_key: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    preview_key: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    
    storage_provider: Mapped[str] = mapped_column(String(50), default="MinIO")
    encryption_version: Mapped[str] = mapped_column(String(10), default="v1")
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True)
    
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE") # ACTIVE, COLD, TRASHED, PURGED
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
