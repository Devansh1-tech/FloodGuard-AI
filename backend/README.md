# FloodGuard AI — Enterprise Backend Foundation (Stage 4.0)

Production-grade, asynchronous backend architecture hosting the FloodGuard AI disaster intelligence pipeline, Sentinel-1 SAR flood extent mapping, and settlement impact assessment engines.

Designed following Clean Architecture, SOLID principles, the Repository Pattern, Dependency Injection, and Decoupled Service Layers.

---

## 🏛️ Architectural Overview

```
                          ┌──────────────────────────┐
                          │   Client Applications    │
                          │ (React Frontend / GIS /  │
                          │   NDRRMA Portal / API)   │
                          └─────────────┬────────────┘
                                        │ HTTP / JSON
                                        ▼
                   ┌────────────────────────────────────────┐
                   │            Middleware Stack            │
                   │  (CORS, GZip, Logging, Timing, Error)  │
                   └────────────────────┬───────────────────┘
                                        │
                                        ▼
                   ┌────────────────────────────────────────┐
                   │           FastAPI API Router           │
                   │  /health, /analysis, /jobs, /reports,  │
                   │         /downloads, /system            │
                   └────────────────────┬───────────────────┘
                                        │ Dependency Injection
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Service Layer                                │
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────────────────────┐  │
│  │ PipelineService │   │   JobService    │   │       ReportService       │  │
│  └────────┬────────┘   └────────┬────────┘   └─────────────┬─────────────┘  │
│           │                     │                          │                │
│  ┌────────┴────────┐   ┌────────┴────────┐   ┌─────────────┴─────────────┐  │
│  │ StorageService  │   │  HealthService  │   │   ConfigurationService    │  │
│  └─────────────────┘   └─────────────────┘   └───────────────────────────┘  │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               │                        │                        │
               ▼                        ▼                        ▼
 ┌───────────────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
 │ Unified Pipeline Engine   │ │  Repository & DB │ │   Storage Subsystem     │
 │ (run_pipeline, GEE, SAR)  │ │ (AsyncPostgreSQL │ │ (Local sandboxed / S3 / │
 │                           │ │  PostGIS, SQLite)│ │  Azure Blob / GCS)      │
 └───────────────────────────┘ └──────────────────┘ └─────────────────────────┘
```

---

## 📁 Folder Structure

```
backend/
├── app/
│   ├── api/                  # Versioned API routes & master router aggregator
│   │   ├── v1/               # Health, Analysis, Jobs, Reports, Downloads, System
│   │   └── router.py         # Master router aggregating /api/v1 prefixes
│   ├── config/               # Centralized Pydantic Settings v2 (.env management)
│   ├── core/                 # Exceptions, logging, and error envelopes
│   │   ├── exceptions.py     # ApplicationError hierarchy
│   │   ├── handlers.py       # Global exception handlers
│   │   └── logging.py        # Structured dual-output rotating logging
│   ├── database/             # Async SQLAlchemy 2.x session & engine management
│   │   ├── base.py           # Model metadata aggregator for Alembic
│   │   └── session.py        # Connection pooling and health checker ('SELECT 1')
│   ├── dependencies/         # FastAPI dependency injection providers
│   │   ├── auth.py           # JWT bearer credential extraction & RBAC checkers
│   │   ├── database.py       # Scoped async database session (get_db)
│   │   └── services.py       # Service layer singleton providers
│   ├── jobs/                 # Decoupled background task execution subsystem
│   │   ├── base.py           # Job, JobStatus, JobPriority, JobResult dataclasses
│   │   ├── manager.py        # Async task orchestrator & cancellation
│   │   ├── repository.py     # Thread-safe job state storage
│   │   └── tracker.py        # Real-time progress and milestone tracking
│   ├── middleware/           # Interceptors: CORS, GZip, timing, logging, errors
│   ├── models/               # SQLAlchemy 2.x declarative models & mixins
│   ├── repositories/         # Generic CRUD async repository base
│   ├── schemas/              # Pydantic v2 validation contracts & API envelopes
│   ├── security/             # Cryptographic hashing, PyJWT tokens, RBAC roles
│   ├── services/             # Clean service layer (business & coordination logic)
│   │   ├── configuration.py  # Spatial presets & telemetry service
│   │   ├── health.py         # Subsystem diagnostics (DB, GEE, Storage, Pipeline)
│   │   ├── job.py            # Background job management service
│   │   ├── pipeline.py       # Wrapper for Unified Pipeline (run_pipeline)
│   │   ├── report.py         # Situation reports & JSON analytic fetcher
│   │   └── storage.py        # Storage backend provider
│   ├── storage/              # Abstract storage engine & local disk provider
│   └── utils/                # ISO time, date validators, AOI polygon validators
├── alembic/                  # Database migration environment
├── scripts/                  # Development and operational runner scripts
├── tests/                    # 100% passing Pytest asynchronous test suite
├── alembic.ini               # Alembic database migration configuration
├── Dockerfile                # Production multi-stage Docker build
├── docker-compose.yml        # Development environment (FastAPI + PostGIS + Redis)
├── requirements.txt          # Production dependencies
├── .env.example              # Environment variables template
└── main.py                   # FastAPI application factory entrypoint
```

---

## ⚙️ Environment Configuration

Configuration is managed via **Pydantic Settings v2**, loaded from `.env` in the current working directory or parent directory:

```bash
# Copy example configuration
cp .env.example .env
```

Key environment parameters:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime mode: `development`, `testing`, `production` | `development` |
| `DEBUG` | Verbose logging & OpenAPI interactive docs | `True` |
| `SERVER_HOST` | Host to bind FastAPI | `0.0.0.0` |
| `SERVER_PORT` | HTTP port | `8000` |
| `USE_SQLITE` | Use local async SQLite for quick startup without Postgres | `True` |
| `POSTGRES_SERVER` | PostgreSQL/PostGIS server host | `localhost` |
| `EE_PROJECT_ID` | Google Cloud project enabled for Earth Engine | `home-credit-505106` |
| `STORAGE_BACKEND` | Storage driver (`local`, `s3`, `azure`, `gcs`) | `local` |
| `STORAGE_LOCAL_ROOT`| Target output directory for rasters and reports | `outputs` |

---

## 🚀 Development Workflow

### 1. Local Python Environment (Python 3.12+)

```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database schema
python scripts/init_db.py

# Launch development server with hot reload
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# (Or on Windows: run scripts\run_dev.bat / on Linux: ./scripts/run_dev.sh)
```

Interactive documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🐳 Docker Deployment

To launch the full production stack with PostGIS and Redis:

```bash
# Launch container stack in background
docker compose up -d --build

# Verify container health
docker compose ps

# View backend logs
docker compose logs -f backend
```

---

## 🩺 System Health Monitoring

The top-level `/health` endpoint executes live probes across all 7 mandatory platform components:

```bash
curl -s http://127.0.0.1:8000/health | jq
```

Sample output:
```json
{
  "status": "healthy",
  "application": "FloodGuard AI API",
  "version": "1.0.0",
  "environment": "development",
  "components": {
    "database": {
      "status": "healthy",
      "message": "Connected (1.2ms)",
      "details": { "url_type": "sqlite" }
    },
    "pipeline_engine": {
      "status": "healthy",
      "message": "Unified Pipeline Orchestrator available",
      "details": { "version": "1.0.0" }
    },
    "earth_engine": {
      "status": "healthy",
      "message": "Project configured: home-credit-505106",
      "details": { "project_id": "home-credit-505106" }
    },
    "storage": {
      "status": "healthy",
      "message": "Local Storage Active (outputs)",
      "details": { "backend": "local", "root": "outputs" }
    }
  },
  "timestamp": "2026-10-17T15:30:00Z"
}
```

---

## 🧪 Testing

The backend includes a comprehensive asynchronous test suite:

```bash
# Run backend tests
pytest backend/tests/ -v

# Run entire platform test suite (Stage 2 + Stage 3 + Stage 3.5 + Stage 4.0)
pytest tests/ backend/tests/ -v
```

---

## 📏 Coding Standards & Architecture Rules

1. **No business logic in API routes**: Routes only accept requests, validate schemas, and delegate to services.
2. **Service Layer orchestration**: Services coordinate business transactions, repositories, storage, and pipeline execution.
3. **Repository Pattern for persistence**: Direct database interactions are encapsulated behind `BaseRepository`.
4. **Decoupled execution**: Synchronous/CPU-heavy SAR and GIS operations are executed in worker threads or background tasks via `run_in_executor` to avoid blocking the async event loop.
5. **Standardized Envelopes**: All successful responses return `ApiResponse[T]`; all errors return standard JSON error envelopes with correlation IDs and timestamps.
