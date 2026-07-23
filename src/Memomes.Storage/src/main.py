from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.client import minio_client
from src.routes.storage import router as storage_router
from src.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Verifies S3 connection and database availability on startup.
    """
    # Verify MinIO access
    try:
        minio_client.list_buckets()
        print(f"Successfully connected to MinIO endpoint: {settings.MINIO_ENDPOINT}")
    except Exception as e:
        print(f"WARNING: MinIO connection verification failed during startup: {e}")

    # Verify Database connectivity
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("Successfully verified PostgreSQL connection connectivity.")
    except Exception as e:
        print(f"WARNING: Database connection verification failed during startup: {e}")

    yield

    # Cleanup actions on shutdown
    await engine.dispose()
    print("Database connection pools closed.")


app = FastAPI(
    title="Memomes Cloud Storage API",
    version="2.0.0",
    description="Production-grade secure ZK file storage coordinator using MinIO.",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to trusted web client domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router Endpoint Groupings
app.include_router(storage_router)


@app.exception_handler(FileNotFoundError)
async def file_not_found_handler(request: Request, exc: FileNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)}
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )


@app.get("/health")
async def health_check():
    """
    App health status ping check
    """
    return {"status": "healthy", "service": "memomes-storage-api"}
