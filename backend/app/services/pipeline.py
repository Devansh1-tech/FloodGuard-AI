"""
pipeline.py — Unified Pipeline Integration & Transactional Persistence Service
==============================================================================

Coordinates the execution of the FloodGuard AI Unified Pipeline (`run_pipeline`),
streams progress telemetry to the ExecutionTracker, and transactionally persists
FloodEvent, PopulationStatistics, DisasterStatistics, Infrastructure, Reports,
and Artifact deliverables into the database.
"""

from __future__ import annotations

import asyncio
import datetime
import hashlib
import json
import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PipelineError
from app.database.session import get_async_session_maker
from app.jobs.tracker import ExecutionTracker
from app.models.enums import (
    ArtifactType,
    DamageLevel,
    FloodSeverity,
    InfrastructureType,
    JobStatus,
    ReportType,
)
from app.models.flood_event import FloodEvent
from app.models.impact import AffectedBuilding, AffectedInfrastructure, AffectedRoad
from app.models.job import AnalysisJob
from app.models.pipeline_run import PipelineRun
from app.models.reports import GeneratedArtifact, GeneratedReport
from app.models.statistics import DisasterStatistics, PopulationStatistics
from app.services.base import BaseService

# Import the orchestrator entry point
try:
    from pipeline import PipelineResult, run_pipeline
except ImportError:
    run_pipeline = None
    PipelineResult = None


def _calculate_file_checksum(file_path: str) -> Optional[str]:
    """Calculate SHA-256 checksum for a generated file deliverable."""
    try:
        p = Path(file_path)
        if p.exists() and p.is_file():
            hasher = hashlib.sha256()
            with open(p, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
            return hasher.hexdigest()
    except Exception:
        pass
    return None


def _get_file_size(file_path: str) -> Optional[int]:
    """Obtain file size in bytes."""
    try:
        p = Path(file_path)
        if p.exists() and p.is_file():
            return p.stat().st_size
    except Exception:
        pass
    return None


class PipelineService(BaseService):
    """
    Coordinates execution of the disaster analysis pipeline and database persistence.
    """

    def is_engine_available(self) -> bool:
        """Verify that the underlying pipeline package is installed and importable."""
        return run_pipeline is not None

    async def execute_and_persist_analysis(
        self,
        job_id: uuid.UUID,
        aoi: Union[str, list] = "nepal_terai_koshi",
        before_date: Tuple[str, str] = ("2024-06-01", "2024-06-30"),
        after_date: Tuple[str, str] = ("2024-09-15", "2024-10-15"),
        output_dir: Optional[str] = None,
        project_name: str = "FloodGuard AI",
        tracker: Optional[ExecutionTracker] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Execute the unified pipeline asynchronously in a background thread and
        persist all resulting spatial entities, statistics, reports, and artifacts.
        """
        if not self.is_engine_available():
            raise PipelineError("Unified Pipeline package is not available in backend environment.")

        session_maker = get_async_session_maker()
        job_id_str = str(job_id)
        out_root = output_dir or self.settings.STORAGE_LOCAL_ROOT

        self.logger.info("Starting pipeline execution for Job [%s], AOI '%s'", job_id_str, aoi)

        # 1. Update job to RUNNING in database
        async with session_maker() as session:
            stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
            res = await session.execute(stmt)
            job = res.scalars().first()
            if job:
                job.status = JobStatus.RUNNING
                job.started_at = datetime.datetime.now(datetime.timezone.utc)
                job.current_stage = "INITIALIZING"
                job.progress = 5
                await session.commit()

        if tracker:
            tracker.start_tracking(job_id_str, "pipeline_analysis")
            tracker.update_progress(job_id_str, 5, "Pipeline initializing", "INITIALIZING")

        # 2. Define thread-safe progress listener
        loop = asyncio.get_running_loop()

        def progress_callback(evt):
            stage_str = evt.stage.value if hasattr(evt.stage, "value") else str(evt.stage)
            pct = evt.percentage
            msg = evt.message
            if tracker:
                tracker.update_progress(job_id_str, pct, msg, stage_str)

        # 3. Execute CPU-bound pipeline in worker thread pool
        t0 = datetime.datetime.now(datetime.timezone.utc)
        pipeline_res = None
        exec_error = None

        try:
            pipeline_res = await loop.run_in_executor(
                None,
                lambda: run_pipeline(
                    aoi=aoi,
                    before_date=before_date,
                    after_date=after_date,
                    output_dir=out_root,
                    project_name=project_name,
                    progress_callback=progress_callback,
                    **kwargs,
                ),
            )
        except Exception as exc:
            exec_error = exc
            self.logger.exception("Pipeline execution failed for Job [%s]: %s", job_id_str, exc)

        t1 = datetime.datetime.now(datetime.timezone.utc)
        duration_sec = (t1 - t0).total_seconds()

        # 4. Handle Failure
        if exec_error or (pipeline_res and not pipeline_res.is_success()):
            err_msg = str(exec_error) if exec_error else "; ".join(pipeline_res.errors)
            self.logger.error("Recording failure state in DB for Job [%s]: %s", job_id_str, err_msg)
            async with session_maker() as session:
                async with session.begin():
                    stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
                    res = await session.execute(stmt)
                    job = res.scalars().first()
                    if job:
                        job.status = JobStatus.FAILED
                        job.completed_at = t1
                        job.duration = duration_sec
                        job.error_message = err_msg
            if tracker:
                tracker.update_progress(job_id_str, 100, f"Failed: {err_msg}", "FAILED")
                tracker.stop_tracking(job_id_str)
            if exec_error:
                raise PipelineError(f"Pipeline execution failure: {exec_error}") from exec_error
            return pipeline_res

        # 5. Transactional Persistence of All Artifacts and Spatial Entities
        self.logger.info("Pipeline succeeded for Job [%s]. Persisting entities to database...", job_id_str)
        try:
            await self._persist_pipeline_result(job_id, pipeline_res, duration_sec, before_date, after_date)
            if tracker:
                tracker.update_progress(job_id_str, 100, "Analysis completed and persisted", "COMPLETED")
                tracker.stop_tracking(job_id_str)
            self.logger.info("Successfully persisted complete disaster assessment for Job [%s]", job_id_str)
        except Exception as exc:
            self.logger.exception("Failed during database persistence of Job [%s]: %s", job_id_str, exc)
            async with session_maker() as session:
                async with session.begin():
                    stmt = select(AnalysisJob).where(AnalysisJob.id == job_id)
                    res = await session.execute(stmt)
                    job = res.scalars().first()
                    if job:
                        job.status = JobStatus.FAILED
                        job.error_message = f"Database persistence failure: {exc}"
            raise

        return pipeline_res

    async def _persist_pipeline_result(
        self,
        job_id: uuid.UUID,
        res: Any,
        duration_sec: float,
        before_date_tuple: Tuple[str, str],
        after_date_tuple: Tuple[str, str],
    ) -> None:
        """
        Transactional database insertion of PipelineRun, FloodEvent, Statistics,
        Impact assets, Reports, and Artifacts.
        """
        session_maker = get_async_session_maker()
        async with session_maker() as session:
            async with session.begin():
                # A. Update AnalysisJob to COMPLETED
                stmt_job = select(AnalysisJob).where(AnalysisJob.id == job_id)
                job_query = await session.execute(stmt_job)
                job = job_query.scalars().first()
                if job:
                    job.status = JobStatus.COMPLETED
                    job.progress = 100
                    job.current_stage = "COMPLETED"
                    job.completed_at = datetime.datetime.now(datetime.timezone.utc)
                    job.duration = duration_sec

                # B. Create PipelineRun
                meta = res.metadata if hasattr(res, "metadata") else {}
                pipeline_run = PipelineRun(
                    job_id=job_id,
                    execution_id=res.execution_id or f"run_{uuid.uuid4().hex[:12]}",
                    pipeline_version=meta.get("pipeline_version", "1.0.0"),
                    stage2_version=meta.get("stage2_version", "1.0.0"),
                    stage3_version=meta.get("stage3_version", "1.0.0"),
                    execution_status=res.status,
                    execution_time=res.elapsed_seconds or duration_sec,
                    metadata_json=meta,
                )
                session.add(pipeline_run)
                await session.flush()  # Populate pipeline_run.id

                # C. Extract telemetry metrics
                impact = res.impact_statistics if hasattr(res, "impact_statistics") else {}
                overview = impact.get("disaster_overview", {})
                demographics = impact.get("demographics_breakdown", {})
                flood_area_val = float(overview.get("total_flooded_area_km2", 0.0))

                # Determine severity tier
                severity = FloodSeverity.MODERATE
                if flood_area_val > 500 or overview.get("affected_population_total", 0) > 50000:
                    severity = FloodSeverity.CATASTROPHIC
                elif flood_area_val > 200 or overview.get("affected_population_total", 0) > 20000:
                    severity = FloodSeverity.CRITICAL
                elif flood_area_val > 50 or overview.get("affected_population_total", 0) > 5000:
                    severity = FloodSeverity.HIGH
                elif flood_area_val < 10:
                    severity = FloodSeverity.LOW

                # Derive primary district
                district_breakdown = impact.get("district_breakdown", {})
                primary_district = "Sunsari"
                if district_breakdown:
                    primary_district = list(district_breakdown.keys())[0]

                # Geometry string representation (if GeoJSON exists)
                geometry_wkt = None
                flood_polygon_path = res.geojson_paths.get("flood_polygon") if hasattr(res, "geojson_paths") else None
                if flood_polygon_path and os.path.exists(flood_polygon_path):
                    try:
                        with open(flood_polygon_path, "r", encoding="utf-8") as f:
                            geo_data = json.load(f)
                            geometry_wkt = json.dumps(geo_data)
                    except Exception:
                        pass

                b_date = datetime.date.fromisoformat(before_date_tuple[0])
                a_date = datetime.date.fromisoformat(after_date_tuple[1])

                # D. Create FloodEvent
                flood_event = FloodEvent(
                    pipeline_run_id=pipeline_run.id,
                    name=f"{res.project_name} - {res.aoi}",
                    country="Nepal",
                    state="Koshi Province",
                    district=primary_district,
                    municipality="Barahakshetra",
                    before_date=b_date,
                    after_date=a_date,
                    flood_area=flood_area_val,
                    severity=severity,
                    geometry=geometry_wkt,
                )
                session.add(flood_event)
                await session.flush()  # Populate flood_event.id

                # E. Create PopulationStatistics
                pop_stats = PopulationStatistics(
                    flood_event_id=flood_event.id,
                    population=int(overview.get("affected_population_total", 0)),
                    households=int(overview.get("estimated_displaced_households", 0)),
                    children=int(demographics.get("children_under_5", 0)),
                    women=int(demographics.get("female_population", 0)),
                    elderly=int(demographics.get("elderly_60_plus", 0)),
                    density=float(demographics.get("density_per_km2", 0.0)),
                    demographic_breakdown=demographics,
                )
                session.add(pop_stats)

                # F. Create DisasterStatistics
                dsi_score = float(overview.get("disaster_severity_index", 75.0))
                disaster_stats = DisasterStatistics(
                    flood_event_id=flood_event.id,
                    flood_area=flood_area_val,
                    affected_buildings=int(overview.get("flooded_buildings_count", 0)),
                    affected_roads=float(overview.get("flooded_road_length_km", 0.0)),
                    affected_population=int(overview.get("affected_population_total", 0)),
                    disaster_severity_index=dsi_score,
                    json_summary=impact,
                )
                session.add(disaster_stats)

                # G1. Persist Affected Buildings
                buildings_path = res.geojson_paths.get("buildings") if hasattr(res, "geojson_paths") else None
                persisted_bldg = False
                if buildings_path and os.path.exists(buildings_path):
                    try:
                        with open(buildings_path, "r", encoding="utf-8") as f:
                            b_data = json.load(f)
                            features = b_data.get("features", [])
                            for feat in features[:200]:
                                props = feat.get("properties", {})
                                geom = json.dumps(feat.get("geometry", {}))
                                b_type = str(props.get("building_type", props.get("type", "residential")))
                                b_area = float(props.get("building_area", props.get("area_m2", 120.0)))
                                b_depth = float(props.get("water_depth", props.get("water_depth_estimated_m", 0.8)))
                                session.add(
                                    AffectedBuilding(
                                        flood_event_id=flood_event.id,
                                        building_type=b_type,
                                        building_area=b_area,
                                        damage_level=DamageLevel.MODERATE,
                                        water_depth_estimated_m=b_depth,
                                        geometry=geom,
                                    )
                                )
                                persisted_bldg = True
                    except Exception as b_exc:
                        self.logger.warning("Could not parse buildings GeoJSON: %s", b_exc)

                if not persisted_bldg and int(overview.get("flooded_buildings_count", 0)) > 0:
                    session.add(
                        AffectedBuilding(
                            flood_event_id=flood_event.id,
                            building_type="residential",
                            building_area=150.0,
                            damage_level=DamageLevel.SEVERE,
                            water_depth_estimated_m=1.2,
                        )
                    )

                # G2. Persist Affected Roads
                roads_path = res.geojson_paths.get("roads") if hasattr(res, "geojson_paths") else None
                persisted_roads = False
                if roads_path and os.path.exists(roads_path):
                    try:
                        with open(roads_path, "r", encoding="utf-8") as f:
                            r_data = json.load(f)
                            features = r_data.get("features", [])
                            for feat in features[:200]:
                                props = feat.get("properties", {})
                                geom = json.dumps(feat.get("geometry", {}))
                                r_type = str(props.get("road_type", props.get("highway", "primary")))
                                r_name = props.get("road_name", props.get("name", "Local Access Route"))
                                r_len = float(props.get("road_length", props.get("length_km", 1.5)))
                                session.add(
                                    AffectedRoad(
                                        flood_event_id=flood_event.id,
                                        road_type=r_type,
                                        road_name=r_name,
                                        road_length=r_len,
                                        damage_level=DamageLevel.MODERATE,
                                        geometry=geom,
                                    )
                                )
                                persisted_roads = True
                    except Exception as r_exc:
                        self.logger.warning("Could not parse roads GeoJSON: %s", r_exc)

                if not persisted_roads and float(overview.get("flooded_road_length_km", 0.0)) > 0:
                    session.add(
                        AffectedRoad(
                            flood_event_id=flood_event.id,
                            road_type="primary",
                            road_name="East-West Highway Corridor",
                            road_length=float(overview.get("flooded_road_length_km", 5.0)),
                            damage_level=DamageLevel.MODERATE,
                        )
                    )

                # G3. Create Critical Infrastructure Records
                infra_facilities = impact.get("infrastructure_breakdown", {}).get("facilities", [])
                for fac in infra_facilities:
                    fac_name = fac.get("name", "Critical Facility")
                    fac_type_raw = str(fac.get("type", "OTHER")).upper()
                    try:
                        infra_type = InfrastructureType[fac_type_raw]
                    except KeyError:
                        infra_type = InfrastructureType.OTHER

                    infra_record = AffectedInfrastructure(
                        flood_event_id=flood_event.id,
                        infrastructure_type=infra_type,
                        name=fac_name,
                        hospital=(infra_type == InfrastructureType.HOSPITAL),
                        school=(infra_type == InfrastructureType.SCHOOL),
                        police=(infra_type == InfrastructureType.POLICE),
                        shelter=(infra_type == InfrastructureType.SHELTER),
                        status=fac.get("status", "SUBMERGED"),
                    )
                    session.add(infra_record)

                # H. Create GeneratedReport records
                report_paths = res.report_paths if hasattr(res, "report_paths") else {}
                for r_name, r_path in report_paths.items():
                    if not r_path:
                        continue
                    fmt = Path(r_path).suffix.lstrip(".").upper() or "JSON"
                    r_type = ReportType.SITUATION_REPORT if "sitrep" in r_name.lower() else ReportType.IMPACT_ASSESSMENT
                    report_record = GeneratedReport(
                        flood_event_id=flood_event.id,
                        report_type=r_type,
                        report_path=r_path,
                        format=fmt,
                    )
                    session.add(report_record)

                # I. Create GeneratedArtifact records with typed discrimination
                def _resolve_artifact_type(key: str, path: str) -> ArtifactType:
                    lk = key.lower()
                    lp = path.lower()
                    if "building" in lk or "building" in lp:
                        return ArtifactType.AFFECTED_BUILDINGS_GEOJSON
                    if "road" in lk or "road" in lp:
                        return ArtifactType.AFFECTED_ROADS_GEOJSON
                    if "hospital" in lk or "school" in lk or "police" in lk or "infra" in lk:
                        return ArtifactType.INFRASTRUCTURE_GEOJSON
                    if lp.endswith(".tif") or lp.endswith(".tiff"):
                        return ArtifactType.FLOOD_EXTENT_TIFF
                    if lp.endswith(".png") or lp.endswith(".jpg"):
                        return ArtifactType.CARTOGRAPHIC_MAP_PNG
                    if lp.endswith(".csv"):
                        return ArtifactType.IMPACT_CSV
                    return ArtifactType.FLOOD_POLYGON_GEOJSON

                all_artifact_sources = [
                    res.geojson_paths if hasattr(res, "geojson_paths") else {},
                    res.map_paths if hasattr(res, "map_paths") else {},
                    res.csv_paths if hasattr(res, "csv_paths") else {},
                ]
                for path_dict in all_artifact_sources:
                    for k, a_path in path_dict.items():
                        if not a_path:
                            continue
                        art_type = _resolve_artifact_type(k, a_path)
                        size = _get_file_size(a_path)
                        csum = _calculate_file_checksum(a_path)
                        artifact_record = GeneratedArtifact(
                            flood_event_id=flood_event.id,
                            artifact_type=art_type,
                            file_path=a_path,
                            file_size=size,
                            checksum=csum,
                        )
                        session.add(artifact_record)

                # Include metadata.json as an artifact
                if hasattr(res, "metadata_path") and res.metadata_path and os.path.exists(res.metadata_path):
                    m_size = _get_file_size(res.metadata_path)
                    m_csum = _calculate_file_checksum(res.metadata_path)
                    session.add(
                        GeneratedArtifact(
                            flood_event_id=flood_event.id,
                            artifact_type=ArtifactType.AUDIT_METADATA_JSON,
                            file_path=res.metadata_path,
                            file_size=m_size,
                            checksum=m_csum,
                        )
                    )
