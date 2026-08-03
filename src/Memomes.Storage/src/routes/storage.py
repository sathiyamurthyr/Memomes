import uuid
import hashlib
import io
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from src.db import get_db
from src.auth import get_current_user
from src.services.storage import StorageService
from src.schemas.file import FileMetadataDTO

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])


@router.post("/upload", response_model=FileMetadataDTO, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    original_file_name: str = Form(...),
    encrypted_file_name: str = Form(...),
    sha256_hash: str = Form(...),
    folder_id: Optional[str] = Form(None),
    is_encrypted: bool = Form(True),
    is_vault: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    POST /api/v1/storage/upload
    Validates JWT, verifies file integrity (SHA-256), uploads payload to MinIO, and saves metadata.
    """
    file_bytes = await file.read()
    
    # Calculate SHA-256 on server to verify integrity
    sha256 = hashlib.sha256(file_bytes).hexdigest()
    if sha256.lower() != sha256_hash.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SHA-256 checksum mismatch. File payload may be corrupted."
        )

    # Resolve file extension and MIME type
    filename_parts = original_file_name.split(".")
    extension = filename_parts[-1] if len(filename_parts) > 1 else "bin"
    mime_type = file.content_type or "application/octet-stream"

    # Initialize storage service
    storage_svc = StorageService(db)
    
    try:
        metadata = await storage_svc.upload_file(
            tenant_id=current_user["tenant_id"],
            user_id=current_user["user_id"],
            folder_id=folder_id,
            original_file_name=original_file_name,
            encrypted_file_name=encrypted_file_name,
            file_data=file_bytes,
            mime_type=mime_type,
            extension=extension,
            sha256_hash=sha256,
            is_encrypted=is_encrypted,
            is_vault=is_vault
        )
        return metadata
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.get("/{id}", response_model=None)
async def download_file(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    GET /api/v1/storage/{id}
    Validates owner ownership, downloads file from S3, and streams it back to client.
    """
    storage_svc = StorageService(db)
    
    # Retrieve metadata first to validate ownership
    metadata = await storage_svc.get_file_metadata(id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File metadata record not found."
        )

    # Validate tenant and ownership
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this file payload."
        )

    try:
        # Fetch stream from storage layer
        data, _ = await storage_svc.download_file(id)
        
        original_name = getattr(metadata, 'original_file_name', None) or metadata.encrypted_file_name
        return StreamingResponse(
            io.BytesIO(data),
            media_type=metadata.mime_type,
            headers={
                "Content-Disposition": f'attachment; filename="{original_name}"',
                "Content-Length": str(metadata.file_size)
            }
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encrypted binary blob not found in MinIO bucket."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download streaming failed: {str(e)}"
        )


@router.get("/{id}/preview", response_class=StreamingResponse)
async def get_file_preview(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    GET /api/v1/storage/{id}/preview
    Retrieves and streams the generated preview image for the file.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    preview_bytes = await storage_svc.generate_preview(id)
    if not preview_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview not available for this file type.")

    return StreamingResponse(io.BytesIO(preview_bytes), media_type="image/png")


@router.get("/{id}/thumbnail", response_class=StreamingResponse)
async def get_file_thumbnail(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    GET /api/v1/storage/{id}/thumbnail
    Retrieves and streams the generated thumbnail image.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    thumb_bytes = await storage_svc.generate_thumbnail(id)
    if not thumb_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thumbnail not available.")

    return StreamingResponse(io.BytesIO(thumb_bytes), media_type="image/png")


@router.delete("/{id}", response_model=Dict[str, Any])
async def delete_file(
    id: uuid.UUID,
    permanent: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    DELETE /api/v1/storage/{id}
    Soft-deletes (moves to trash) or permanently purges a file from S3 and database.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    success = await storage_svc.delete_file(id, soft_delete=not permanent)
    return {"success": success, "message": "File soft-deleted." if not permanent else "File permanently purged."}


@router.post("/{id}/restore", response_model=Dict[str, Any])
async def restore_file(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    POST /api/v1/storage/{id}/restore
    Restores a soft-deleted file back to active status.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    success = await storage_svc.restore_file(id)
    return {"success": success, "message": "File restored successfully."}


@router.patch("/{id}/move", response_model=Dict[str, Any])
async def move_file(
    id: uuid.UUID,
    folder_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    PATCH /api/v1/storage/{id}/move
    Moves a file to a different folder ID.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    success = await storage_svc.move_file(id, folder_id)
    return {"success": success, "message": f"File moved to folder {folder_id}."}


@router.patch("/{id}/rename", response_model=Dict[str, Any])
async def rename_file(
    id: uuid.UUID,
    new_encrypted_name: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    PATCH /api/v1/storage/{id}/rename
    Renames the encrypted file name.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    success = await storage_svc.rename_file(id, new_encrypted_name)
    return {"success": success, "message": "File renamed successfully."}


@router.post("/{id}/copy", response_model=FileMetadataDTO)
async def copy_file(
    id: uuid.UUID,
    folder_id: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    POST /api/v1/storage/{id}/copy
    Copies the file inside MinIO S3 and creates new database metadata.
    """
    storage_svc = StorageService(db)
    metadata = await storage_svc.get_file_metadata(id)
    
    if not metadata:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadata not found.")
        
    if metadata.tenant_id != current_user["tenant_id"] or metadata.user_id != current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    copied_metadata = await storage_svc.copy_file(id, folder_id)
    return copied_metadata

