FROM python:3.12-alpine

# Install system dependencies including FFmpeg for video keyframe extraction and LibreOffice for Office previews
RUN apk add --no-cache \
    curl \
    ffmpeg \
    libreoffice \
    msttcorefonts-installer \
    fontconfig \
    build-base \
    libffi-dev \
    postgresql-dev \
    musl-dev \
    gcc \
    python3-dev \
    && update-ms-fonts \
    && fc-cache -f

WORKDIR /app

COPY src/Memomes.Storage/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/Memomes.Storage/ /app/

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
