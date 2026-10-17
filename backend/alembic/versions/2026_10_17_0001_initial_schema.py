"""Initial enterprise geospatial database schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-10-17 15:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # 1. Enable PostGIS Extension if PostgreSQL
    if is_postgres:
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    json_type = postgresql.JSONB(astext_type=sa.Text()) if is_postgres else sa.JSON()

    # 2. Users Table
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("organization", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role_status", "users", ["role", "status"])

    # 3. Analysis Jobs Table
    op.create_table(
        "analysis_jobs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("job_name", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("priority", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.Column("created_by", sa.String(length=255), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("pipeline_version", sa.String(length=50), nullable=False),
        sa.Column("current_stage", sa.String(length=50), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("parameters", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analysis_jobs_id", "analysis_jobs", ["id"])
    op.create_index("ix_analysis_jobs_status_priority", "analysis_jobs", ["status", "priority"])
    op.create_index("ix_analysis_jobs_created_at", "analysis_jobs", ["created_at"])

    # 4. Pipeline Runs Table
    op.create_table(
        "pipeline_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("job_id", sa.Uuid(), nullable=False),
        sa.Column("execution_id", sa.String(length=100), nullable=False),
        sa.Column("pipeline_version", sa.String(length=50), nullable=False),
        sa.Column("stage2_version", sa.String(length=50), nullable=False),
        sa.Column("stage3_version", sa.String(length=50), nullable=False),
        sa.Column("execution_status", sa.String(length=50), nullable=False),
        sa.Column("execution_time", sa.Float(), nullable=True),
        sa.Column("metadata_json", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["analysis_jobs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("execution_id"),
    )
    op.create_index("ix_pipeline_runs_id", "pipeline_runs", ["id"])
    op.create_index("ix_pipeline_runs_job_id", "pipeline_runs", ["job_id"])
    op.create_index("ix_pipeline_runs_execution_status", "pipeline_runs", ["execution_status"])

    # 5. Flood Events Table
    geom_multipoly = Geometry(geometry_type="MULTIPOLYGON", srid=4326) if is_postgres else sa.Text()
    geom_poly = Geometry(geometry_type="POLYGON", srid=4326) if is_postgres else sa.Text()
    geom_geom = Geometry(geometry_type="GEOMETRY", srid=4326) if is_postgres else sa.Text()
    geom_multiline = Geometry(geometry_type="MULTILINESTRING", srid=4326) if is_postgres else sa.Text()
    geom_point = Geometry(geometry_type="POINT", srid=4326) if is_postgres else sa.Text()

    op.create_table(
        "flood_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("pipeline_run_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("municipality", sa.String(length=100), nullable=True),
        sa.Column("before_date", sa.Date(), nullable=False),
        sa.Column("after_date", sa.Date(), nullable=False),
        sa.Column("flood_area", sa.Float(), nullable=False),
        sa.Column("geometry", geom_multipoly, nullable=True),
        sa.Column("bounding_box", geom_poly, nullable=True),
        sa.Column("crs", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["pipeline_run_id"], ["pipeline_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_flood_events_id", "flood_events", ["id"])
    op.create_index("ix_flood_events_district_severity", "flood_events", ["district", "severity"])
    op.create_index("ix_flood_events_temporal_window", "flood_events", ["before_date", "after_date"])

    # 6. Affected Buildings Table
    op.create_table(
        "affected_buildings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("building_type", sa.String(length=100), nullable=False),
        sa.Column("building_area", sa.Float(), nullable=True),
        sa.Column("damage_level", sa.String(length=50), nullable=False),
        sa.Column("water_depth_estimated_m", sa.Float(), nullable=True),
        sa.Column("geometry", geom_geom, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affected_buildings_id", "affected_buildings", ["id"])
    op.create_index("ix_affected_buildings_event_type", "affected_buildings", ["flood_event_id", "building_type"])
    op.create_index("ix_affected_buildings_damage", "affected_buildings", ["flood_event_id", "damage_level"])

    # 7. Affected Roads Table
    op.create_table(
        "affected_roads",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("road_type", sa.String(length=100), nullable=False),
        sa.Column("road_name", sa.String(length=255), nullable=True),
        sa.Column("road_length", sa.Float(), nullable=False),
        sa.Column("damage_level", sa.String(length=50), nullable=False),
        sa.Column("geometry", geom_multiline, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affected_roads_id", "affected_roads", ["id"])
    op.create_index("ix_affected_roads_event_type", "affected_roads", ["flood_event_id", "road_type"])

    # 8. Affected Infrastructure Table
    op.create_table(
        "affected_infrastructure",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("infrastructure_type", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("hospital", sa.Boolean(), nullable=False),
        sa.Column("school", sa.Boolean(), nullable=False),
        sa.Column("police", sa.Boolean(), nullable=False),
        sa.Column("shelter", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("geometry", geom_point, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_affected_infra_id", "affected_infrastructure", ["id"])
    op.create_index("ix_affected_infra_event_type", "affected_infrastructure", ["flood_event_id", "infrastructure_type"])
    op.create_index("ix_affected_infra_status", "affected_infrastructure", ["flood_event_id", "status"])

    # 9. Population Statistics Table
    op.create_table(
        "population_statistics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("population", sa.Integer(), nullable=False),
        sa.Column("households", sa.Integer(), nullable=False),
        sa.Column("children", sa.Integer(), nullable=False),
        sa.Column("women", sa.Integer(), nullable=False),
        sa.Column("elderly", sa.Integer(), nullable=False),
        sa.Column("density", sa.Float(), nullable=False),
        sa.Column("demographic_breakdown", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("flood_event_id"),
    )
    op.create_index("ix_population_statistics_id", "population_statistics", ["id"])

    # 10. Disaster Statistics Table
    op.create_table(
        "disaster_statistics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("flood_area", sa.Float(), nullable=False),
        sa.Column("affected_buildings", sa.Integer(), nullable=False),
        sa.Column("affected_roads", sa.Float(), nullable=False),
        sa.Column("affected_population", sa.Integer(), nullable=False),
        sa.Column("disaster_severity_index", sa.Float(), nullable=False),
        sa.Column("json_summary", json_type, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("flood_event_id"),
    )
    op.create_index("ix_disaster_statistics_id", "disaster_statistics", ["id"])

    # 11. Generated Reports Table
    op.create_table(
        "generated_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("report_path", sa.String(length=512), nullable=False),
        sa.Column("format", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generated_reports_id", "generated_reports", ["id"])
    op.create_index("ix_reports_event_type", "generated_reports", ["flood_event_id", "report_type"])

    # 12. Generated Artifacts Table
    op.create_table(
        "generated_artifacts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("flood_event_id", sa.Uuid(), nullable=False),
        sa.Column("artifact_type", sa.String(length=50), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("checksum", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["flood_event_id"], ["flood_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_generated_artifacts_id", "generated_artifacts", ["id"])
    op.create_index("ix_artifacts_event_type", "generated_artifacts", ["flood_event_id", "artifact_type"])
    op.create_index("ix_artifacts_checksum", "generated_artifacts", ["checksum"])

    # 13. Audit Logs Table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity", sa.String(length=100), nullable=False),
        sa.Column("entity_id", sa.String(length=100), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("details", json_type, nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_id", "audit_logs", ["id"])
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"])
    op.create_index("ix_audit_logs_user_action", "audit_logs", ["user_id", "action"])
    op.create_index("ix_audit_logs_entity_action", "audit_logs", ["entity", "action"])

    # 14. System Configurations Table
    op.create_table(
        "system_configurations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_encrypted", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index("ix_system_configurations_id", "system_configurations", ["id"])
    op.create_index("ix_system_configurations_key", "system_configurations", ["key"])


def downgrade() -> None:
    op.drop_table("system_configurations")
    op.drop_table("audit_logs")
    op.drop_table("generated_artifacts")
    op.drop_table("generated_reports")
    op.drop_table("disaster_statistics")
    op.drop_table("population_statistics")
    op.drop_table("affected_infrastructure")
    op.drop_table("affected_roads")
    op.drop_table("affected_buildings")
    op.drop_table("flood_events")
    op.drop_table("pipeline_runs")
    op.drop_table("analysis_jobs")
    op.drop_table("users")
