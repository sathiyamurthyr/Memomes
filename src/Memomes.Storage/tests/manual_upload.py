import asyncio
import os
import hashlib
from src.services.storage import StorageService
from src.db import SessionLocal
from src.client import minio_client
from sqlalchemy import text


async def run_manual_upload():
    # Target image file to upload
    image_path = os.path.abspath("../../Memomes.Client/src/assets/hero.png")
    
    if not os.path.exists(image_path):
        print(f"Error: Target file not found at: {image_path}")
        return

    print(f"Reading target file: {image_path}")
    with open(image_path, "rb") as f:
        file_bytes = f.read()

    file_size = len(file_bytes)
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    print(f"File size: {file_size} bytes")
    print(f"SHA-256 Checksum: {sha256_hash}")

    # Validate S3 connection
    try:
        minio_client.list_buckets()
        print("Connected to MinIO successfully.")
    except Exception as e:
        print("\n[ERROR] MinIO S3 is not running. Please start your Docker Compose stack first using:")
        print("docker compose up --build -d")
        return

    # Run upload using storage service
    async with SessionLocal() as db:
        storage_svc = StorageService(db)
        
        # Verify db connection
        try:
            await db.execute(text("SELECT 1"))
        except Exception:
            print("\n[ERROR] PostgreSQL is not running. Please start your Docker Compose stack first.")
            return

        try:
            print("Uploading encrypted logo payload to MinIO...")
            metadata = await storage_svc.upload_file(
                tenant_id="tenant_default",
                user_id="user_manual_test",
                folder_id=None,
                original_file_name="hero.png",
                encrypted_file_name="enc_hero.png",
                file_data=file_bytes,
                mime_type="image/png",
                extension=".png",
                sha256_hash=sha256_hash,
                is_encrypted=True
            )
            
            await db.commit()
            print("\n[SUCCESS] File uploaded successfully!")
            print(f"File ID: {metadata.id}")
            print(f"S3 Object Key: {metadata.object_key}")
            print(f"Thumbnail S3 Key: {metadata.thumbnail_key}")
            print(f"Preview S3 Key: {metadata.preview_key}")
            
        except Exception as e:
            print(f"Upload execution failed: {e}")


if __name__ == "__main__":
    asyncio.run(run_manual_upload())
