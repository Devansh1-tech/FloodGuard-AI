"""
test_jobs.py — Background Job Architecture & Manager Unit Tests
================================================================
"""

import asyncio
import pytest

from app.jobs.base import Job, JobPriority, JobResult, JobStatus
from app.jobs.manager import JobManager
from app.jobs.repository import JobRepository
from app.jobs.tracker import ExecutionTracker


def test_job_lifecycle_transitions():
    """Verify Job status mutations and timestamps."""
    job = Job(job_type="test_task", parameters={"k": "v"})
    assert job.status == JobStatus.PENDING
    assert job.started_at is None

    # Start
    job.mark_started()
    assert job.status == JobStatus.RUNNING
    assert job.started_at is not None

    # Complete
    res = JobResult(success=True, data={"features_detected": 142})
    job.mark_completed(res)
    assert job.status == JobStatus.COMPLETED
    assert job.progress_percent == 100
    assert job.result.data["features_detected"] == 142

    # Fail
    job.mark_failed("Network timeout")
    assert job.status == JobStatus.FAILED
    assert job.error == "Network timeout"

    # Cancel
    job.mark_cancelled()
    assert job.status == JobStatus.CANCELLED


def test_execution_tracker():
    """Verify execution tracking and active task counters."""
    tracker = ExecutionTracker()
    assert tracker.get_active_count() == 0

    tracker.start_tracking("job-101", "analysis")
    assert tracker.get_active_count() == 1
    assert tracker.is_active("job-101") is True

    tracker.update_progress("job-101", 50, "Processing Sentinel-1 tile 2 of 4")
    stats = tracker.get_job_stats("job-101")
    assert stats["progress"] == 50
    assert stats["message"] == "Processing Sentinel-1 tile 2 of 4"

    tracker.stop_tracking("job-101")
    assert tracker.get_active_count() == 0
    assert tracker.is_active("job-101") is False


@pytest.mark.asyncio
async def test_job_repository_operations():
    """Verify in-memory JobRepository save and query capabilities."""
    repo = JobRepository()

    job1 = Job(job_type="analysis", priority=JobPriority.HIGH)
    job2 = Job(job_type="reporting", priority=JobPriority.LOW)
    job2.status = JobStatus.COMPLETED

    await repo.save(job1)
    await repo.save(job2)

    # Get by ID
    found = await repo.get_by_id(job1.job_id)
    assert found is not None
    assert found.job_type == "analysis"

    # List all
    all_jobs = await repo.list_jobs()
    assert len(all_jobs) == 2

    # Filter by status
    completed = await repo.list_jobs(status=JobStatus.COMPLETED)
    assert len(completed) == 1
    assert completed[0].job_id == job2.job_id


@pytest.mark.asyncio
async def test_job_manager_async_execution():
    """Verify JobManager executes background coroutine and records results."""
    repo = JobRepository()
    tracker = ExecutionTracker()
    manager = JobManager(repository=repo, tracker=tracker)

    async def mock_task(job: Job, trk: ExecutionTracker) -> JobResult:
        trk.update_progress(job.job_id, 50, "Running step 1")
        await asyncio.sleep(0.01)
        return JobResult(success=True, data={"inundated_area_sqkm": 245.8})

    job = await manager.submit_job(
        job_type="mock_analysis",
        parameters={"aoi": "nepal_terai_koshi"},
        task_coroutine=mock_task,
    )
    assert job.job_id is not None

    # Wait briefly for background execution to complete
    await asyncio.sleep(0.05)

    final_job = await manager.get_job(job.job_id)
    assert final_job.status == JobStatus.COMPLETED
    assert final_job.result is not None
    assert final_job.result.data["inundated_area_sqkm"] == 245.8
