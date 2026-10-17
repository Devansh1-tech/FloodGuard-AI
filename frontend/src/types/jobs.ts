/**
 * jobs.ts — Job model enums and interface definitions.
 */

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIAL_SUCCESS';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface JobStatusDetail {
  job_id: string;
  job_name: string;
  status: JobStatus;
  priority: JobPriority;
  current_stage: string;
  progress: number;
  started_at?: string | null;
  completed_at?: string | null;
  execution_time_seconds?: number | null;
  warnings: string[];
  errors?: string | null;
  parameters?: Record<string, unknown> | null;
  created_at: string;
}

export interface JobFilterParams {
  status?: JobStatus;
  priority?: JobPriority;
  search?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}
