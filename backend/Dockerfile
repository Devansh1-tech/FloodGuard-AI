# =============================================================================
# FloodGuard AI — Backend Production Dockerfile
# Multi-stage container build for Python 3.12 + FastAPI + GDAL/GEOS dependencies
# =============================================================================

FROM python:3.12-slim AS builder

WORKDIR /build

# Install compilation essentials and C-libraries for asyncpg / geospatial extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runner

WORKDIR /app

# Install minimal runtime shared libraries (libpq for postgres, curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python wheels from builder
COPY --from=builder /install /usr/local

# Copy application codebase
COPY . /app

# Create unprivileged application user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/outputs /app/logs && \
    chown -R appuser:appuser /app

USER appuser

# Set runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    STORAGE_LOCAL_ROOT=/app/outputs \
    LOG_FILE_PATH=/app/logs/backend.log

EXPOSE 8000

# Container health probe
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["sh", "-c", "python scripts/init_db.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
