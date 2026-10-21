"""
job.py — Operational Background Job Management Service
======================================================

Enterprise service coordinating AnalysisJob database persistence, asynchronous
disaster pipeline execution via PipelineService and JobManager, live progress telemetry
streaming through ExecutionTracker, and consolidated spatial analysis summaries.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple, Union
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.database.session import get_async_session_maker
from app.jobs.base import Job, JobPriority as JobDomainPriority, JobStatus as JobDomainStatus
from app.jobs.manager import JobManager
from app.jobs.tracker import ExecutionTracker
from app.models.enums import JobPriority, JobStatus
from app.models.flood_event import FloodEvent
from app.models.job import AnalysisJob
from app.repositories.flood_event import FloodEventRepository
from app.repositories.job import JobRepository
from app.schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisSubmissionResponse,
    AnalysisTriggerRequest,
    ArtifactMetadataSchema,
    DisasterStatisticsSummarySchema,
    FacilityItemSchema,
    FloodEventSummarySchema,
    InfrastructureSummarySchema,
    PipelineSummarySchema,
    PopulationSummarySchema,
    ReportMetadataSchema,
)
from app.schemas.jobs import JobCreateRequest, JobResponse, JobStatusDetailResponse, JobStatusResponse
from app.services.base import BaseService
from app.services.pipeline import PipelineService


class JobService(BaseService):
    """
    Coordinates asynchronous task dispatching, inspection, and cancellation.
    """

    def __init__(
        self,
        job_repository: Optional[JobRepository] = None,
        job_manager: Optional[JobManager] = None,
        pipeline_service: Optional[PipelineService] = None,
        session: Optional[AsyncSession] = None,
    ) -> None:
        super().__init__()
        self.session = session
        self.job_repository = job_repository
        self.job_manager = job_manager or JobManager()
        self.pipeline_service = pipeline_service or PipelineService()
        self.session_maker = get_async_session_maker()

    def _get_job_repo(self, session: AsyncSession) -> JobRepository:
        """Helper to create JobRepository with active session."""
        return JobRepository(session)

    @asynccontextmanager
    async def _get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Provide scoped session: caller-injected session or a fresh session."""
        if self.session is not None:
            yield self.session
        else:
            async with self.session_maker() as s:
                yield s

    # --------------------------------------------------------------------------
    # 1. Start New Flood Analysis Workflow
    # --------------------------------------------------------------------------
    async def submit_analysis_job(
        self,
        request: AnalysisTriggerRequest,
        user_id: Optional[str] = None,
    ) -> AnalysisSubmissionResponse:
        """
        Execute the complete business workflow for submitting a flood disaster analysis:
        1. Validate request (already validated by Pydantic model).
        2. Detect duplicate active jobs.
        3. Create AnalysisJob entity and persist to DB via JobRepository.
        4. Calculate estimated queue position.
        5. Dispatch background pipeline execution (run_pipeline) in worker thread.
        6. Return submission response containing Job ID, Status, and Queue Position.
        """
        job_id = uuid.uuid4()
        now = datetime.datetime.now(datetime.timezone.utc)
        user_uuid = None
        if user_id:
            try:
                user_uuid = uuid.UUID(str(user_id))
            except (ValueError, TypeError):
                pass

        async with self._get_session() as session:
            job_repo = self._get_job_repo(session)

            # Check for active duplicate jobs
            aoi_str = request.aoi if isinstance(request.aoi, str) else "custom_polygon"
            duplicate = await job_repo.find_active_duplicate(
                aoi=aoi_str,
                before_dates=(request.before_start, request.before_end),
                after_dates=(request.after_start, request.after_end),
            )
            if duplicate:
                self.logger.warning(
                    "Identical analysis job [%s] already active in state '%s'",
                    duplicate.id,
                    duplicate.status.value,
                )
                queue_pos = await job_repo.count_active_ahead(duplicate.created_at)
                return AnalysisSubmissionResponse(
                    job_id=str(duplicate.id),
                    status=duplicate.status.value,
                    estimated_queue_position=queue_pos,
                    project_name=duplicate.job_name,
                    aoi=request.aoi,
                    created_at=duplicate.created_at.isoformat(),
                    priority=request.priority,
                )

            # Create AnalysisJob model
            job_entity = AnalysisJob(
                id=job_id,
                job_name=request.project_name,
                status=JobStatus.PENDING,
                priority=request.priority,
                started_at=None,
                completed_at=None,
                duration=None,
                created_by=str(user_id) if user_id else "system_analyst",
                user_id=user_uuid,
                pipeline_version="1.0.0",
                current_stage="QUEUED",
                progress=0,
                error_message=None,
                parameters=request.model_dump(),
            )
            session.add(job_entity)
            await session.commit()
            await session.refresh(job_entity)

            # Compute queue position
            queue_position = await job_repo.count_active_ahead(job_entity.created_at)

        # Register with in-memory execution tracker
        self.job_manager.tracker.start_tracking(str(job_id), "pipeline_analysis")
        self.job_manager.tracker.update_progress(str(job_id), 0, "Job enqueued in background", "QUEUED")

        # Dispatch background pipeline execution task
        self.logger.info("Dispatching background pipeline execution for Job [%s]", job_id)
        asyncio.create_task(
            self._run_pipeline_background(
                job_id=job_id,
                request=request,
            )
        )

        return AnalysisSubmissionResponse(
            job_id=str(job_id),
            status=JobStatus.PENDING.value,
            estimated_queue_position=queue_position,
            project_name=request.project_name,
            aoi=request.aoi,
            created_at=now.isoformat(),
            priority=request.priority,
        )

    async def _run_pipeline_background(
        self,
        job_id: uuid.UUID,
        request: AnalysisTriggerRequest,
    ) -> None:
        """
        Background worker invoking PipelineService and handling unexpected exceptions.
        """
        try:
            await self.pipeline_service.execute_and_persist_analysis(
                job_id=job_id,
                aoi=request.aoi,
                before_date=(request.before_start, request.before_end),
                after_date=(request.after_start, request.after_end),
                project_name=request.project_name,
                tracker=self.job_manager.tracker,
                sensor_type=getattr(request, "sensor_type", "optical"),
                spectral_index=getattr(request, "spectral_index", "mndwi"),
            )
        except Exception as exc:
            self.logger.exception("Background execution failed for Job [%s]: %s", job_id, exc)

    # --------------------------------------------------------------------------
    # 2. Complete Analysis Summary Query
    # --------------------------------------------------------------------------
    async def get_analysis_summary(self, analysis_id: str) -> AnalysisDetailResponse:
        """
        Retrieve complete consolidated analysis summary by job_id or flood_event_id:
        Includes flood statistics, population demographics, infrastructure,
        reports, artifacts, and pipeline telemetry.
        """
        try:
            target_uuid = uuid.UUID(analysis_id)
        except (ValueError, TypeError):
            raise NotFoundError("Analysis", analysis_id)

        async with self._get_session() as session:
            job_repo = self._get_job_repo(session)
            flood_repo = FloodEventRepository(session)

            # 1. Try finding by AnalysisJob ID
            job = await job_repo.get_with_runs(target_uuid)
            flood_event = None

            if job:
                # Find flood event attached to its pipeline runs
                if job.pipeline_runs:
                    latest_run = job.pipeline_runs[-1]
                    stmt = FloodEventRepository(session).model
                    # Query flood event for this run
                    events = await flood_repo.get_multi()
                    for fe in events:
                        if fe.pipeline_run_id == latest_run.id:
                            flood_event = await flood_repo.get_with_full_details(fe.id)
                            break
            else:
                # 2. Try finding by FloodEvent ID directly
                flood_event = await flood_repo.get_with_full_details(target_uuid)
                if flood_event and flood_event.pipeline_run:
                    job = await job_repo.get(flood_event.pipeline_run.job_id)

            if not job and not flood_event:
                raise NotFoundError("Analysis", analysis_id)

            # If job exists but hasn't completed or has no flood event yet:
            if not flood_event:
                return AnalysisDetailResponse(
                    analysis_id=str(job.id),
                    job_id=str(job.id),
                    job_name=job.job_name,
                    status=job.status.value,
                    progress=job.progress,
                    created_at=job.created_at.isoformat(),
                    started_at=job.started_at.isoformat() if job.started_at else None,
                    completed_at=job.completed_at.isoformat() if job.completed_at else None,
                    duration_seconds=job.duration,
                    pipeline=None,
                    flood_event=None,
                    statistics=None,
                    population=None,
                    infrastructure=None,
                    reports=[],
                    artifacts=[],
                )

            # Assemble full child components
            p_run = flood_event.pipeline_run
            pipeline_summary = None
            if p_run:
                pipeline_summary = PipelineSummarySchema(
                    execution_id=p_run.execution_id,
                    pipeline_version=p_run.pipeline_version,
                    stage2_version=p_run.stage2_version,
                    stage3_version=p_run.stage3_version,
                    execution_status=p_run.execution_status,
                    execution_time=p_run.execution_time,
                    metadata=p_run.metadata_json,
                )

            fe_summary = FloodEventSummarySchema(
                id=str(flood_event.id),
                name=flood_event.name,
                country=flood_event.country,
                state=flood_event.state,
                district=flood_event.district,
                municipality=flood_event.municipality,
                before_date=flood_event.before_date.isoformat(),
                after_date=flood_event.after_date.isoformat(),
                flood_area_km2=flood_event.flood_area,
                severity=flood_event.severity.value,
                crs=flood_event.crs,
                geometry=flood_event.geometry,
                bounding_box=flood_event.bounding_box,
            )

            stats_summary = None
            if flood_event.disaster_statistics:
                ds = flood_event.disaster_statistics
                stats_summary = DisasterStatisticsSummarySchema(
                    flood_area_km2=ds.flood_area,
                    affected_buildings_count=ds.affected_buildings,
                    affected_roads_km=ds.affected_roads,
                    affected_population=ds.affected_population,
                    disaster_severity_index=ds.disaster_severity_index,
                    json_summary=ds.json_summary,
                )

            pop_summary = None
            if flood_event.population_statistics:
                ps = flood_event.population_statistics
                pop_summary = PopulationSummarySchema(
                    total_affected_population=ps.population,
                    estimated_displaced_households=ps.households,
                    children_count=ps.children,
                    women_count=ps.women,
                    elderly_count=ps.elderly,
                    population_density_per_km2=ps.density,
                    demographics_breakdown=ps.demographic_breakdown,
                )

            facilities_list = []
            hospitals_cnt = 0
            schools_cnt = 0
            police_cnt = 0
            shelters_cnt = 0
            for inf in flood_event.affected_infrastructure:
                if inf.hospital:
                    hospitals_cnt += 1
                if inf.school:
                    schools_cnt += 1
                if inf.police:
                    police_cnt += 1
                if inf.shelter:
                    shelters_cnt += 1
                facilities_list.append(
                    FacilityItemSchema(
                        id=str(inf.id),
                        name=inf.name,
                        infrastructure_type=inf.infrastructure_type.value,
                        hospital=inf.hospital,
                        school=inf.school,
                        police=inf.police,
                        shelter=inf.shelter,
                        status=inf.status,
                    )
                )

            infra_summary = InfrastructureSummarySchema(
                total_submerged_facilities=len(facilities_list),
                hospitals_count=hospitals_cnt,
                schools_count=schools_cnt,
                police_stations_count=police_cnt,
                shelters_count=shelters_cnt,
                facilities=facilities_list,
            )

            reports_meta = [
                ReportMetadataSchema(
                    id=str(r.id),
                    report_type=r.report_type.value,
                    format=r.format,
                    report_path=r.report_path,
                    download_url=f"/api/v1/reports/{r.id}/download",
                    created_at=r.created_at.isoformat(),
                )
                for r in flood_event.reports
            ]

            artifacts_meta = [
                ArtifactMetadataSchema(
                    id=str(a.id),
                    artifact_type=a.artifact_type.value,
                    file_path=a.file_path,
                    file_size_bytes=a.file_size,
                    checksum=a.checksum,
                    download_url=f"/api/v1/artifacts/{a.id}/download",
                    created_at=a.created_at.isoformat(),
                )
                for a in flood_event.artifacts
            ]

            job_id_val = str(job.id) if job else str(flood_event.id)
            job_name_val = job.job_name if job else flood_event.name
            job_status_val = job.status.value if job else JobStatus.COMPLETED.value
            job_progress_val = job.progress if job else 100
            job_created_at_val = job.created_at.isoformat() if job else flood_event.created_at.isoformat()
            job_started_at_val = job.started_at.isoformat() if (job and job.started_at) else None
            job_completed_at_val = job.completed_at.isoformat() if (job and job.completed_at) else None
            job_duration_val = job.duration if job else None

            return AnalysisDetailResponse(
                analysis_id=str(analysis_id),
                job_id=job_id_val,
                job_name=job_name_val,
                status=job_status_val,
                progress=job_progress_val,
                created_at=job_created_at_val,
                started_at=job_started_at_val,
                completed_at=job_completed_at_val,
                duration_seconds=job_duration_val,
                pipeline=pipeline_summary,
                flood_event=fe_summary,
                statistics=stats_summary,
                population=pop_summary,
                infrastructure=infra_summary,
                reports=reports_meta,
                artifacts=artifacts_meta,
            )

    # --------------------------------------------------------------------------
    # 3. List Jobs with Filtering, Sorting, Searching, and Pagination
    # --------------------------------------------------------------------------
    async def list_jobs_operational(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
        priority: Optional[JobPriority] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> Tuple[List[JobStatusDetailResponse], int]:
        """
        Query all jobs from database with multi-dimensional filtering and sorting.
        """
        async with self._get_session() as session:
            job_repo = self._get_job_repo(session)
            jobs, total = await job_repo.filter_jobs(
                skip=skip,
                limit=limit,
                status=status,
                priority=priority,
                search=search,
                sort_by=sort_by,
                order=order,
            )

            result = []
            for j in jobs:
                # Merge with live in-memory telemetry if active
                live_info = self.job_manager.tracker.get_progress(str(j.id))
                stage = live_info.get("stage", j.current_stage) if live_info else j.current_stage
                pct = live_info.get("progress_percent", j.progress) if live_info else j.progress
                warnings = live_info.get("warnings", []) if live_info else []

                result.append(
                    JobStatusDetailResponse(
                        job_id=str(j.id),
                        job_name=j.job_name,
                        status=j.status,
                        priority=j.priority,
                        current_stage=stage,
                        progress=pct,
                        started_at=j.started_at.isoformat() if j.started_at else None,
                        completed_at=j.completed_at.isoformat() if j.completed_at else None,
                        execution_time_seconds=j.duration,
                        warnings=warnings,
                        errors=j.error_message,
                        parameters=j.parameters,
                        created_at=j.created_at.isoformat(),
                    )
                )

            return result, total

    # --------------------------------------------------------------------------
    # 4. Get Live Job Status
    # --------------------------------------------------------------------------
    async def get_job_detail(self, job_id: str) -> JobStatusDetailResponse:
        """
        Retrieve live job status, current stage, progress %, execution time,
        warnings, and errors.
        """
        try:
            target_uuid = uuid.UUID(job_id)
        except (ValueError, TypeError):
            raise NotFoundError("Job", job_id)

        async with self._get_session() as session:
            job_repo = self._get_job_repo(session)
            job = await job_repo.get(target_uuid)
            if not job:
                raise NotFoundError("Job", job_id)

            live_info = self.job_manager.tracker.get_progress(str(job.id))
            stage = live_info.get("stage", job.current_stage) if live_info else job.current_stage
            pct = live_info.get("progress_percent", job.progress) if live_info else job.progress
            warnings = live_info.get("warnings", []) if live_info else []

            return JobStatusDetailResponse(
                job_id=str(job.id),
                job_name=job.job_name,
                status=job.status,
                priority=job.priority,
                current_stage=stage,
                progress=pct,
                started_at=job.started_at.isoformat() if job.started_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
                execution_time_seconds=job.duration,
                warnings=warnings,
                errors=job.error_message,
                parameters=job.parameters,
                created_at=job.created_at.isoformat(),
            )

    # --------------------------------------------------------------------------
    # 5. Cancel Running Job OR Delete Completed Job
    # --------------------------------------------------------------------------
    async def cancel_or_delete_job(self, job_id: str) -> Tuple[bool, str, Optional[JobStatusDetailResponse]]:
        """
        Cancel running job or delete completed job depending on its current lifecycle state.

        Returns:
            (is_cancelled, message, job_response)
        """
        try:
            target_uuid = uuid.UUID(job_id)
        except (ValueError, TypeError):
            raise NotFoundError("Job", job_id)

        async with self._get_session() as session:
            job_repo = self._get_job_repo(session)
            job = await job_repo.get(target_uuid)
            if not job:
                raise NotFoundError("Job", job_id)

            if job.status in [JobStatus.PENDING, JobStatus.RUNNING]:
                # Cancel running job
                try:
                    await self.job_manager.cancel_job(str(target_uuid))
                except NotFoundError:
                    pass
                self.job_manager.tracker.stop_tracking(str(target_uuid))
                cancelled_job = await job_repo.cancel(target_uuid)
                resp = JobStatusDetailResponse(
                    job_id=str(cancelled_job.id),
                    job_name=cancelled_job.job_name,
                    status=cancelled_job.status,
                    priority=cancelled_job.priority,
                    current_stage="CANCELLED",
                    progress=cancelled_job.progress,
                    started_at=cancelled_job.started_at.isoformat() if cancelled_job.started_at else None,
                    completed_at=cancelled_job.completed_at.isoformat() if cancelled_job.completed_at else None,
                    execution_time_seconds=cancelled_job.duration,
                    warnings=["Execution cancelled by administrative user"],
                    errors=cancelled_job.error_message,
                    parameters=cancelled_job.parameters,
                    created_at=cancelled_job.created_at.isoformat(),
                )
                return True, "Running job cancelled successfully", resp
            else:
                # Delete completed / failed / cancelled job record
                await job_repo.delete(id=target_uuid)
                return False, "Job record deleted successfully", None

    # --------------------------------------------------------------------------
    # Legacy compatibility methods
    # --------------------------------------------------------------------------
    @staticmethod
    def _to_job_response(job: Job) -> JobResponse:
        return JobResponse(
            job_id=job.job_id,
            job_type=job.job_type,
            status=job.status,
            priority=job.priority,
            progress_percent=job.progress_percent,
            message=job.message,
            created_at=job.created_at.isoformat(),
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            result=job.result.data if job.result else None,
            error=job.error,
        )

    async def create_job(self, request: JobCreateRequest) -> JobResponse:
        job = await self.job_manager.submit_job(
            job_type=request.job_type,
            parameters=request.parameters,
            priority=request.priority,
        )
        return self._to_job_response(job)

    async def get_job(self, job_id: str) -> JobResponse:
        try:
            job = await self.job_manager.get_job(job_id)
            return self._to_job_response(job)
        except NotFoundError:
            detail = await self.get_job_detail(job_id)
            return JobResponse(
                job_id=detail.job_id,
                job_type="pipeline_analysis",
                status=detail.status,
                priority=detail.priority,
                progress_percent=detail.progress,
                message=f"Stage: {detail.current_stage}",
                created_at=detail.created_at,
                started_at=detail.started_at,
                completed_at=detail.completed_at,
                result=detail.parameters,
                error=detail.errors,
            )

    async def get_job_status(self, job_id: str) -> JobStatusResponse:
        detail = await self.get_job_detail(job_id)
        return JobStatusResponse(
            job_id=detail.job_id,
            status=detail.status,
            progress_percent=detail.progress,
            message=f"Milestone: {detail.current_stage}",
        )

    async def cancel_job(self, job_id: str) -> JobResponse:
        _, msg, detail = await self.cancel_or_delete_job(job_id)
        if detail:
            return JobResponse(
                job_id=detail.job_id,
                job_type="pipeline_analysis",
                status=detail.status,
                priority=detail.priority,
                progress_percent=detail.progress,
                message=msg,
                created_at=detail.created_at,
                started_at=detail.started_at,
                completed_at=detail.completed_at,
                result=detail.parameters,
                error=detail.errors,
            )
        return JobResponse(
            job_id=job_id,
            job_type="pipeline_analysis",
            status=JobStatus.CANCELLED,
            priority=JobPriority.NORMAL,
            progress_percent=0,
            message=msg,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )

    async def list_jobs(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[JobStatus] = None,
    ) -> List[JobResponse]:
        details, _ = await self.list_jobs_operational(skip=skip, limit=limit, status=status)
        return [
            JobResponse(
                job_id=d.job_id,
                job_type="pipeline_analysis",
                status=d.status,
                priority=d.priority,
                progress_percent=d.progress,
                message=f"Stage: {d.current_stage}",
                created_at=d.created_at,
                started_at=d.started_at,
                completed_at=d.completed_at,
                result=d.parameters,
                error=d.errors,
            )
            for d in details
        ]
