import asyncio
import io
import uuid
import os
from datetime import datetime, timedelta
from typing import Optional, Tuple
from minio import Minio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.client import minio_client
from src.config import settings
from src.models.file_metadata import FileMetadata
from src.services.preview import PreviewService


class StorageService:
    def __init__(self, db: AsyncSession, minio: Optional[Minio] = None):
        self.db = db
        from src.client import minio_client
        self.minio = minio or minio_client
        self.bucket = settings.MINIO_BUCKET

    def _get_category_folder(self, mime_type: str, extension: str, is_vault: bool = False) -> str:
        """
        Maps MIME type, extension, and vault flag to S3 prefix paths.
        """
        if is_vault:
            return "vault"
        
        ext = extension.lower().strip(".")
        mt = mime_type.lower()

        if mt.startswith("image/"):
            return "photos"
        elif mt.startswith("video/"):
            return "videos"
        elif mt.startswith("audio/"):
            return "audio"
        elif mt == "application/pdf" or ext == "pdf":
            return "documents"
        elif ext in ["zip", "tar", "gz", "rar", "7z"]:
            return "archives"
        elif ext in ["docx", "pptx", "xlsx", "doc", "ppt", "xls"]:
            return "office"
        else:
            return "documents"

    async def create_bucket(self, bucket_name: str) -> None:
        """
        Asynchronously checks if a bucket exists, creating it if not.
        """
        def _sync():
            if not self.minio.bucket_exists(bucket_name):
                self.minio.make_bucket(bucket_name)
        await asyncio.to_thread(_sync)

    async def upload_file(
        self,
        tenant_id: str,
        user_id: str,
        folder_id: Optional[str],
        original_file_name: str,
        encrypted_file_name: str,
        file_data: bytes,
        mime_type: str,
        extension: str,
        sha256_hash: str,
        is_encrypted: bool = True,
        is_vault: bool = False
    ) -> FileMetadata:
        """
        Uploads encrypted payload to MinIO and registers metadata in PostgreSQL.
        Runs blocking MinIO uploads in thread-pool to keep loop unblocked.
        """
        category = self._get_category_folder(mime_type, extension, is_vault)
        # S3 Object Key format: tenant_id/user_id/category/uuid_encrypted_filename
        unique_id = uuid.uuid4()
        object_key = f"{tenant_id}/{user_id}/{category}/{unique_id}_{encrypted_file_name}"
        file_size = len(file_data)

        # Upload binary blob to MinIO
        data_stream = io.BytesIO(file_data)
        
        def _sync_upload():
            self.minio.put_object(
                bucket_name=self.bucket,
                object_name=object_key,
                data=data_stream,
                length=file_size,
                content_type=mime_type
            )
        await asyncio.to_thread(_sync_upload)

        # Trigger client-safe async preview pipeline
        preview_svc = PreviewService(self.minio)
        thumb_key, preview_key = await preview_svc.process_preview_pipeline(
            object_key=object_key,
            data=file_data,
            mime_type=mime_type,
            extension=extension
        )

        # Create PostgreSQL Metadata Record
        metadata = FileMetadata(
            id=unique_id,
            tenant_id=tenant_id,
            user_id=user_id,
            folder_id=folder_id,
            bucket_name=self.bucket,
            object_key=object_key,
            original_file_name=original_file_name,
            encrypted_file_name=encrypted_file_name,
            mime_type=mime_type,
            extension=extension,
            file_size=file_size,
            sha256_hash=sha256_hash,
            thumbnail_key=thumb_key,
            preview_key=preview_key,
            storage_provider="MinIO",
            encryption_version="v1",
            is_encrypted=is_encrypted,
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(metadata)
        await self.db.flush()
        return metadata

    async def download_file(self, file_id: uuid.UUID) -> Tuple[bytes, FileMetadata]:
        """
        Downloads encrypted file blob from MinIO using metadata lookup.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata or metadata.status == "PURGED":
            raise FileNotFoundError("File metadata not found or purged.")

        def _sync_download() -> bytes:
            response = self.minio.get_object(self.bucket, metadata.object_key)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()

        data = await asyncio.to_thread(_sync_download)
        return data, metadata

    async def delete_file(self, file_id: uuid.UUID, soft_delete: bool = True) -> bool:
        """
        Handles soft deletion (to Trash) or permanent deletion.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata:
            return False

        if soft_delete:
            metadata.status = "TRASHED"
            metadata.deleted_at = datetime.utcnow()
            await self.db.flush()
            return True
        else:
            # Permanent delete from MinIO and Database
            def _sync_delete():
                self.minio.remove_object(self.bucket, metadata.object_key)
                if metadata.thumbnail_key:
                    self.minio.remove_object(self.bucket, metadata.thumbnail_key)
                if metadata.preview_key:
                    self.minio.remove_object(self.bucket, metadata.preview_key)
            await asyncio.to_thread(_sync_delete)

            await self.db.delete(metadata)
            await self.db.flush()
            return True

    async def restore_file(self, file_id: uuid.UUID) -> bool:
        """
        Restores a soft-deleted file from Trash back to active.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata or metadata.status != "TRASHED":
            return False

        metadata.status = "ACTIVE"
        metadata.deleted_at = None
        await self.db.flush()
        return True

    async def move_file(self, file_id: uuid.UUID, new_folder_id: Optional[str]) -> bool:
        """
        Moves metadata association to a new folder.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata:
            return False

        metadata.folder_id = new_folder_id
        await self.db.flush()
        return True

    async def rename_file(self, file_id: uuid.UUID, new_encrypted_name: str) -> bool:
        """
        Renames the encrypted file name in PostgreSQL metadata records.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata:
            return False

        metadata.encrypted_file_name = new_encrypted_name
        await self.db.flush()
        return True

    async def copy_file(self, file_id: uuid.UUID, new_folder_id: Optional[str]) -> FileMetadata:
        """
        Copies MinIO object and registers new PostgreSQL metadata.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata:
            raise FileNotFoundError("Source metadata not found.")

        unique_id = uuid.uuid4()
        # Build new S3 key
        base_dir = os.path.dirname(metadata.object_key)
        new_key = f"{base_dir}/{unique_id}_{metadata.encrypted_file_name}"

        # Copy object within S3
        def _sync_copy():
            from minio.commonconfig import CopySource
            self.minio.copy_object(
                bucket_name=self.bucket,
                object_name=new_key,
                source=CopySource(self.bucket, metadata.object_key)
            )
        await asyncio.to_thread(_sync_copy)

        new_metadata = FileMetadata(
            id=unique_id,
            tenant_id=metadata.tenant_id,
            user_id=metadata.user_id,
            folder_id=new_folder_id,
            bucket_name=self.bucket,
            object_key=new_key,
            original_file_name=metadata.original_file_name,
            encrypted_file_name=metadata.encrypted_file_name,
            mime_type=metadata.mime_type,
            extension=metadata.extension,
            file_size=metadata.file_size,
            sha256_hash=metadata.sha256_hash,
            storage_provider=metadata.storage_provider,
            encryption_version=metadata.encryption_version,
            is_encrypted=metadata.is_encrypted,
            status="ACTIVE",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(new_metadata)
        await self.db.flush()
        return new_metadata

    async def generate_presigned_url(self, file_id: uuid.UUID, expires: timedelta = timedelta(seconds=60)) -> str:
        """
        Generates temporary presigned GET url directly pointing to S3 payload.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata:
            raise FileNotFoundError("Metadata not found.")

        def _sync_url() -> str:
            return self.minio.presigned_get_object(
                bucket_name=self.bucket,
                object_name=metadata.object_key,
                expires=expires
            )
        return await asyncio.to_thread(_sync_url)

    async def get_file_metadata(self, file_id: uuid.UUID) -> Optional[FileMetadata]:
        """
        Retrieves file metadata record by ID.
        """
        result = await self.db.execute(select(FileMetadata).where(FileMetadata.id == file_id))
        return result.scalar_one_or_none()

    async def generate_thumbnail(self, file_id: uuid.UUID) -> Optional[bytes]:
        """
        Retrieves the thumbnail from MinIO if it exists.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata or not metadata.thumbnail_key:
            return None

        def _sync_download() -> bytes:
            response = self.minio.get_object(self.bucket, metadata.thumbnail_key)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()

        try:
            return await asyncio.to_thread(_sync_download)
        except Exception as e:
            print(f"Error fetching thumbnail from S3: {e}")
            return None

    async def generate_preview(self, file_id: uuid.UUID) -> Optional[bytes]:
        """
        Retrieves the preview image from MinIO if it exists.
        """
        metadata = await self.get_file_metadata(file_id)
        if not metadata or not metadata.preview_key:
            return None

        def _sync_download() -> bytes:
            response = self.minio.get_object(self.bucket, metadata.preview_key)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()

        try:
            return await asyncio.to_thread(_sync_download)
        except Exception as e:
            print(f"Error fetching preview from S3: {e}")
            return None

