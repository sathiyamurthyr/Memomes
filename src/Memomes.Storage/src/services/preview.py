import asyncio
import io
import os
import tempfile
from typing import Optional, Tuple
from PIL import Image
import fitz  # PyMuPDF
from minio import Minio
from src.client import minio_client
from src.config import settings


class PreviewService:
    def __init__(self, minio: Minio = minio_client):
        self.minio = minio
        self.bucket = settings.MINIO_BUCKET

    async def generate_image_thumbnail(self, data: bytes) -> Optional[bytes]:
        """
        Generates a 256x256 thumbnail from image bytes.
        """
        def _sync() -> Optional[bytes]:
            try:
                img = Image.open(io.BytesIO(data))
                img.thumbnail((256, 256))
                output = io.BytesIO()
                # Save as PNG to support transparency
                img.save(output, format="PNG")
                return output.getvalue()
            except Exception as e:
                print(f"Error generating image thumbnail: {e}")
                return None
        return await asyncio.to_thread(_sync)

    async def generate_video_frame(self, data: bytes) -> Optional[bytes]:
        """
        Invokes FFmpeg asynchronously as a sub-process to extract the first keyframe of a video payload.
        """
        # Create temp files for input/output to feed FFmpeg
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_in:
            temp_in.write(data)
            temp_in_path = temp_in.name

        temp_out_path = temp_in_path + ".png"

        try:
            # Run headless FFmpeg: extract 1 frame at 1s mark
            process = await asyncio.create_subprocess_exec(
                "ffmpeg",
                "-y",
                "-i", temp_in_path,
                "-ss", "00:00:01",
                "-vframes", "1",
                "-f", "image2",
                temp_out_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()

            if os.path.exists(temp_out_path):
                with open(temp_out_path, "rb") as f:
                    frame_bytes = f.read()
                return frame_bytes
        except Exception as e:
            print(f"FFmpeg frame extraction failed: {e}")
        finally:
            # Clean up temporary storage files
            for p in [temp_in_path, temp_out_path]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except OSError:
                        pass
        return None

    async def generate_pdf_preview(self, data: bytes) -> Optional[bytes]:
        """
        Uses PyMuPDF (fitz) to extract and render the first page of a PDF document as PNG.
        """
        def _sync() -> Optional[bytes]:
            try:
                doc = fitz.open(stream=data, filetype="pdf")
                if len(doc) == 0:
                    return None
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=150)
                return pix.tobytes("png")
            except Exception as e:
                print(f"PyMuPDF PDF preview rendering failed: {e}")
                return None
        return await asyncio.to_thread(_sync)

    async def generate_office_preview(self, data: bytes, extension: str) -> Optional[bytes]:
        """
        Converts Office documents (docx, xlsx, pptx) to PDF using headless LibreOffice,
        then renders page 1 as PNG using PyMuPDF.
        """
        temp_dir = tempfile.mkdtemp()
        temp_in_path = os.path.join(temp_dir, f"document.{extension.strip('.')}")
        
        with open(temp_in_path, "wb") as f:
            f.write(data)

        try:
            # Run LibreOffice conversion: docx/pptx/xlsx -> pdf
            process = await asyncio.create_subprocess_exec(
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", temp_dir,
                temp_in_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.communicate()

            pdf_path = os.path.join(temp_dir, "document.pdf")
            if os.path.exists(pdf_path):
                with open(pdf_path, "rb") as f:
                    pdf_bytes = f.read()
                # Use our PDF rendering pipeline to extract Page 1 image
                return await self.generate_pdf_preview(pdf_bytes)
        except Exception as e:
            print(f"LibreOffice conversion failed: {e}")
        finally:
            # Cleanup temp directory
            if os.path.exists(temp_in_path):
                os.remove(temp_in_path)
            pdf_path = os.path.join(temp_dir, "document.pdf")
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass
        return None

    async def process_preview_pipeline(
        self,
        object_key: str,
        data: bytes,
        mime_type: str,
        extension: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Saves thumbnails & previews directly to MinIO and returns S3 object keys.
        """
        thumb_bytes = None
        preview_bytes = None
        mt = mime_type.lower()
        ext = extension.lower().strip(".")

        # 1. Generate Thumbnail / Preview bytes
        if mt.startswith("image/"):
            thumb_bytes = await self.generate_image_thumbnail(data)
            preview_bytes = thumb_bytes # Same for images
        elif mt.startswith("video/"):
            thumb_bytes = await self.generate_video_frame(data)
            preview_bytes = thumb_bytes
        elif mt == "application/pdf" or ext == "pdf":
            preview_bytes = await self.generate_pdf_preview(data)
            if preview_bytes:
                thumb_bytes = await self.generate_image_thumbnail(preview_bytes)
        elif ext in ["docx", "pptx", "xlsx", "doc", "ppt", "xls"]:
            preview_bytes = await self.generate_office_preview(data, ext)
            if preview_bytes:
                thumb_bytes = await self.generate_image_thumbnail(preview_bytes)

        # 2. Upload generated thumbs/previews to MinIO if present
        thumb_key = None
        preview_key = None

        base_key = os.path.dirname(object_key)
        filename = os.path.basename(object_key)

        if thumb_bytes:
            thumb_key = f"{base_key}/thumbnails/thumb_{filename}.png"
            def _upload_thumb():
                self.minio.put_object(
                    self.bucket,
                    thumb_key,
                    io.BytesIO(thumb_bytes),
                    len(thumb_bytes),
                    "image/png"
                )
            await asyncio.to_thread(_upload_thumb)

        if preview_bytes:
            preview_key = f"{base_key}/previews/preview_{filename}.png"
            def _upload_preview():
                self.minio.put_object(
                    self.bucket,
                    preview_key,
                    io.BytesIO(preview_bytes),
                    len(preview_bytes),
                    "image/png"
                )
            await asyncio.to_thread(_upload_preview)

        return thumb_key, preview_key
