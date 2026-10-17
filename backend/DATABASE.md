# FloodGuard AI — Geospatial Database Architecture & Schema Reference

Enterprise-grade PostgreSQL 16 + PostGIS spatial persistence layer for **FloodGuard AI**.

Built with **SQLAlchemy 2.0 (Async)**, **GeoAlchemy2**, and **Alembic**, this database acts as the single source of truth for user authentication, background job dispatching, pipeline execution telemetry, delineated flood inundation extents, settlement impact assessments, demographic vulnerability statistics, and cartographic deliverables.

---

## 🏛️ Entity Relationship Hierarchy

As specified in the architectural design, **`AnalysisJob`** serves as the processing root entity, establishing clear provenance from users down to localized disaster assets:

```
                       ┌──────────────┐
                       │     User     │
                       └──────┬───────┘
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │ AnalysisJob  │
                       └──────┬───────┘
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │ PipelineRun  │
                       └──────┬───────┘
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │  FloodEvent  │
                       └──────┬───────┘
                              │
       ┌──────────────┬───────┼───────┬──────────────┬──────────────┐
       │ 1:1          │ 1:1   │ 1:N   │ 1:N          │ 1:N          │ 1:N
       ▼              ▼       ▼       ▼              ▼              ▼
┌─────────────┐ ┌──────────┐ ┌─────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────┐
│ Population  │ │ Disaster │ │Bldg │ │Road Segment│ │Critical    │ │Generated Reports│
│ Statistics  │ │Statistics│ │     │ │            │ │Facility    │ │& Artifacts      │
└─────────────┘ └──────────┘ └─────┘ └────────────┘ └────────────┘ └─────────────────┘
```

---

## 📊 Complete Mermaid ER Diagram

```mermaid
erDiagram
    users ||--o{ analysis_jobs : "launches"
    users ||--o{ audit_logs : "triggers"
    analysis_jobs ||--o{ pipeline_runs : "executes"
    pipeline_runs ||--o{ flood_events : "delineates"
    
    flood_events ||--o{ affected_buildings : "inundates"
    flood_events ||--o{ affected_roads : "severs"
    flood_events ||--o{ affected_infrastructure : "submerges"
    flood_events ||--|| population_statistics : "aggregates"
    flood_events ||--|| disaster_statistics : "summarizes"
    flood_events ||--o{ generated_reports : "documents"
    flood_events ||--o{ generated_artifacts : "produces"

    users {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        string role
        string organization
        string phone
        string status
        timestamptz created_at
        timestamptz updated_at
    }

    analysis_jobs {
        uuid id PK
        uuid user_id FK
        string job_name
        string status
        string priority
        timestamptz started_at
        timestamptz completed_at
        float duration
        string created_by
        string pipeline_version
        string current_stage
        int progress
        text error_message
        jsonb parameters
        timestamptz created_at
        timestamptz updated_at
    }

    pipeline_runs {
        uuid id PK
        uuid job_id FK
        string execution_id UK
        string pipeline_version
        string stage2_version
        string stage3_version
        string execution_status
        float execution_time
        jsonb metadata_json
        timestamptz created_at
        timestamptz updated_at
    }

    flood_events {
        uuid id PK
        uuid pipeline_run_id FK
        string name
        string country
        string state
        string district
        string municipality
        date before_date
        date after_date
        float flood_area
        geometry geometry "MULTIPOLYGON (4326)"
        geometry bounding_box "POLYGON (4326)"
        string crs
        string severity
        timestamptz created_at
        timestamptz updated_at
    }

    affected_buildings {
        uuid id PK
        uuid flood_event_id FK
        string building_type
        float building_area
        string damage_level
        float water_depth_estimated_m
        geometry geometry "GEOMETRY (4326)"
        timestamptz created_at
    }

    affected_roads {
        uuid id PK
        uuid flood_event_id FK
        string road_type
        string road_name
        float road_length
        string damage_level
        geometry geometry "MULTILINESTRING (4326)"
        timestamptz created_at
    }

    affected_infrastructure {
        uuid id PK
        uuid flood_event_id FK
        string infrastructure_type
        string name
        boolean hospital
        boolean school
        boolean police
        boolean shelter
        string status
        geometry geometry "POINT (4326)"
        timestamptz created_at
    }

    population_statistics {
        uuid id PK
        uuid flood_event_id FK,UK
        int population
        int households
        int children
        int women
        int elderly
        float density
        jsonb demographic_breakdown
        timestamptz created_at
    }

    disaster_statistics {
        uuid id PK
        uuid flood_event_id FK,UK
        float flood_area
        int affected_buildings
        float affected_roads
        int affected_population
        float disaster_severity_index
        jsonb json_summary
        timestamptz created_at
    }

    generated_reports {
        uuid id PK
        uuid flood_event_id FK
        string report_type
        string report_path
        string format
        timestamptz created_at
    }

    generated_artifacts {
        uuid id PK
        uuid flood_event_id FK
        string artifact_type
        string file_path
        bigint file_size
        string checksum
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string entity
        string entity_id
        timestamptz timestamp
        string ip_address
        string user_agent
        jsonb details
    }

    system_configurations {
        uuid id PK
        string key UK
        text value
        text description
        boolean is_encrypted
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 🗺️ Spatial Indexing & Geospatial Performance Strategy

### 1. Spatial Reference System (SRID)
- All geometries are standardized on **WGS 84 (`EPSG:4326`)** coordinates (longitude, latitude) matching Google Earth Engine, Sentinel-1 SAR orbit tiles, and OpenStreetMap building/road datasets.

### 2. PostGIS GiST Indexing
- **`flood_events.geometry`**: R-Tree over GiST index for fast spatial intersection (`ST_Intersects`, `ST_Contains`) with administrative boundaries and point assets.
- **`flood_events.bounding_box`**: GiST index for fast bounding-box viewport queries (`&&` operator) from interactive web maps (Leaflet / Mapbox / OpenLayers).
- **`affected_buildings.geometry`**: GiST spatial index supporting high-density queries over thousands of submerged footprints.
- **`affected_roads.geometry`**: GiST spatial index over submerged road networks.
- **`affected_infrastructure.geometry`**: GiST point index for rapid nearest-neighbor (`<->`) queries to relief hubs and shelters.

### 3. Composite & Filtering Indexes
- **`ix_flood_events_district_severity`**: `(district, severity)` for administrative dashboard filtering.
- **`ix_flood_events_temporal_window`**: `(before_date, after_date)` for historical monsoon crisis analysis.
- **`ix_affected_infra_event_type`**: `(flood_event_id, infrastructure_type)` and fast boolean flags (`hospital`, `school`, `shelter`).
- **`ix_users_role_status`**: `(role, status)` for security authentication lookups.

---

## 💻 Repository Usage Examples

### 1. Creating and Updating an Analysis Job
```python
from app.models.enums import JobPriority, JobStatus
from app.repositories.job import JobRepository

job_repo = JobRepository(session)

# Enqueue job
job = await job_repo.create(
    obj_in={
        "job_name": "Monsoon 2024 Koshi Assessment",
        "priority": JobPriority.HIGH,
        "parameters": {"aoi": "nepal_terai_koshi"},
    }
)

# Progress tracking during execution
await job_repo.update_progress(job.id, progress=50, current_stage="STAGE_2_FLOOD_DETECTION")

# Mark completed
await job_repo.mark_completed(job.id, duration=42.5)
```

### 2. Querying Flood Events with Full Impact Details
```python
from app.repositories.flood_event import FloodEventRepository

event_repo = FloodEventRepository(session)

# Fetch complete flood event with all child relationships loaded in a single query
event = await event_repo.get_with_full_details(event_id)

print(f"Disaster Severity Index: {event.disaster_statistics.disaster_severity_index}")
print(f"Submerged Buildings: {len(event.affected_buildings)}")
print(f"Affected Population: {event.population_statistics.population}")
for report in event.reports:
    print(f"Report Deliverable: {report.report_path} ({report.format})")
```

### 3. Querying Events by District and Severity
```python
from app.models.enums import FloodSeverity

# Retrieve critical flood events in Morang District
morang_events = await event_repo.find_by_district("Morang")
critical_events = await event_repo.find_by_severity(FloodSeverity.CRITICAL)
```

### 4. Logging Audit Events
```python
from app.repositories.audit import AuditRepository

audit_repo = AuditRepository(session)

await audit_repo.log_action(
    action="EXPORT_SITUATION_REPORT",
    entity="FloodEvent",
    entity_id=str(event.id),
    user_id=user.id,
    ip_address="192.168.1.15",
    details={"export_format": "PDF"},
)
```

---

## 🔄 Database Migration Workflow

Alembic manages asynchronous database migrations:

```bash
# Verify current migration status
alembic current

# Apply all migrations up to the latest revision
alembic upgrade head

# Rollback one migration step
alembic downgrade -1

# Generate a new autogenerated revision after modifying models
alembic revision --autogenerate -m "add_new_feature"
```
