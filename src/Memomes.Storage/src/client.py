import urllib3
from minio import Minio
from src.config import settings


def get_minio_client() -> Minio:
    """
    Initializes and returns a thread-safe MinIO client client using configurations from settings.
    """
    # Configure custom urllib3 PoolManager to optimize connections
    http_client = urllib3.PoolManager(
        maxsize=32,
        retries=urllib3.util.Retry(
            total=3,
            backoff_factor=0.2,
            status_forcelist=[500, 502, 503, 504]
        )
    )

    client = Minio(
        endpoint=settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
        http_client=http_client
    )

    # Automatically create the bucket if it does not exist
    try:
        if not client.bucket_exists(settings.MINIO_BUCKET):
            client.make_bucket(settings.MINIO_BUCKET)
    except Exception as e:
        # Log error or raise in production startup
        print(f"Error checking/creating MinIO bucket '{settings.MINIO_BUCKET}': {e}")

    return client


# Shared instance of the MinIO client
minio_client = get_minio_client()
