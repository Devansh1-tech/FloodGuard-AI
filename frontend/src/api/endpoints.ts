/**
 * endpoints.ts — Centralized REST API endpoint constants.
 */

export const ENDPOINTS = {
  HEALTH: {
    ROOT: '/health',
    LIVE: '/api/v1/health/live',
    READY: '/api/v1/health/ready',
    STATUS: '/api/v1/health',
  },
  SYSTEM: {
    CONFIGURATION: '/api/v1/system/configuration',
    STATISTICS: '/api/v1/system/statistics',
    INFO: '/api/v1/system/info',
    TELEMETRY: '/api/v1/system/telemetry',
  },
  ANALYSIS: {
    SUBMIT: '/api/v1/analysis',
    LEGACY_TRIGGER: '/api/v1/analysis/trigger',
    PRESETS: '/api/v1/analysis/presets',
    SUMMARY: (analysisId: string) => `/api/v1/analysis/${analysisId}`,
  },
  JOBS: {
    LIST: '/api/v1/jobs',
    DETAIL: (jobId: string) => `/api/v1/jobs/${jobId}`,
    STATUS: (jobId: string) => `/api/v1/jobs/${jobId}/status`,
    CANCEL: (jobId: string) => `/api/v1/jobs/${jobId}/cancel`,
    DELETE: (jobId: string) => `/api/v1/jobs/${jobId}`,
  },
  REPORTS: {
    METADATA: (reportId: string) => `/api/v1/reports/${reportId}`,
    DOWNLOAD: (reportId: string) => `/api/v1/reports/${reportId}/download`,
    LIST_BY_RUN: (runId: string) => `/api/v1/reports/run/${runId}`,
  },
  ARTIFACTS: {
    METADATA: (artifactId: string) => `/api/v1/artifacts/${artifactId}`,
    DOWNLOAD: (artifactId: string) => `/api/v1/artifacts/${artifactId}/download`,
  },
  DOWNLOADS: {
    URL: '/api/v1/downloads/url',
    FILE: (filePath: string) => `/api/v1/downloads/file/${filePath}`,
  },
} as const;
