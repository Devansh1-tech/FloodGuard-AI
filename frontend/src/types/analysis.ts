/**
 * analysis.ts — Disaster Analysis Request, Response, and Consolidated Summary types.
 */

import { JobPriority, JobStatus } from './jobs';

export interface AnalysisTriggerRequest {
  aoi: string | number[][];
  before_start: string;
  before_end: string;
  after_start: string;
  after_end: string;
  project_name: string;
  priority: JobPriority;
}

export interface AnalysisSubmissionResponse {
  job_id: string;
  status: string;
  estimated_queue_position: number;
  project_name: string;
  aoi: string | number[][];
  created_at: string;
  priority: JobPriority;
}

export interface PipelineSummary {
  execution_id: string;
  pipeline_version: string;
  stage2_version: string;
  stage3_version: string;
  execution_status: string;
  execution_time?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface FloodEventSummary {
  id: string;
  name: string;
  country: string;
  state?: string | null;
  district?: string | null;
  municipality?: string | null;
  before_date: string;
  after_date: string;
  flood_area_km2: number;
  severity: string;
  crs: string;
  geometry?: string | null;
  bounding_box?: string | null;
}

export interface PopulationSummary {
  total_affected_population: number;
  estimated_displaced_households: number;
  children_count: number;
  women_count: number;
  elderly_count: number;
  population_density_per_km2: number;
  demographics_breakdown?: Record<string, unknown> | null;
}

export interface DisasterStatisticsSummary {
  flood_area_km2: number;
  affected_buildings_count: number;
  affected_roads_km: number;
  affected_population: number;
  disaster_severity_index: number;
  json_summary?: Record<string, unknown> | null;
}

export interface FacilityItem {
  id: string;
  name: string;
  infrastructure_type: string;
  hospital: boolean;
  school: boolean;
  police: boolean;
  shelter: boolean;
  status: string;
}

export interface InfrastructureSummary {
  total_submerged_facilities: number;
  hospitals_count: number;
  schools_count: number;
  police_stations_count: number;
  shelters_count: number;
  facilities: FacilityItem[];
}

export interface ReportMetadata {
  id: string;
  report_type: string;
  format: string;
  report_path: string;
  download_url: string;
  created_at: string;
}

export interface ArtifactMetadata {
  id: string;
  artifact_type: string;
  file_path: string;
  file_size_bytes?: number | null;
  checksum?: string | null;
  download_url: string;
  created_at: string;
}

export interface AnalysisDetailResponse {
  analysis_id: string;
  job_id: string;
  job_name: string;
  status: JobStatus | string;
  progress: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  pipeline?: PipelineSummary | null;
  flood_event?: FloodEventSummary | null;
  statistics?: DisasterStatisticsSummary | null;
  population?: PopulationSummary | null;
  infrastructure?: InfrastructureSummary | null;
  reports: ReportMetadata[];
  artifacts: ArtifactMetadata[];
}

export interface AoiPreset {
  id: string;
  name: string;
  description: string;
  country: string;
  region: string;
  coordinates: [number, number][];
  default_before_start: string;
  default_before_end: string;
  default_after_start: string;
  default_after_end: string;
}
