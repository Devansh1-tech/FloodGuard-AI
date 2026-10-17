/**
 * system.ts — System configuration, platform statistics, and health models.
 */

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details: Record<string, unknown>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  application: string;
  version: string;
  environment: string;
  components: Record<string, ComponentHealth>;
  timestamp: string;
}

export interface SystemConfigurationResponse {
  platform_version: string;
  pipeline_version: string;
  earth_engine_project?: string | null;
  storage_backend: string;
  database: Record<string, unknown>;
  environment: string;
}

export interface SystemStatisticsResponse {
  users_count: number;
  jobs_count: number;
  flood_events_count: number;
  generated_reports_count: number;
  generated_artifacts_count: number;
  storage_usage_bytes: number;
  average_execution_time_seconds: number;
}
