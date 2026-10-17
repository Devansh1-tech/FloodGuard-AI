/**
 * systemService.ts — System health, telemetry, and platform configuration API client.
 */

import { fetchApi } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { HealthCheckResponse, SystemConfigurationResponse, SystemStatisticsResponse } from '@/types/system';

export const systemService = {
  getHealthStatus: async (): Promise<HealthCheckResponse> => {
    return fetchApi<HealthCheckResponse>(ENDPOINTS.HEALTH.STATUS);
  },

  getSystemConfiguration: async (): Promise<SystemConfigurationResponse> => {
    return fetchApi<SystemConfigurationResponse>(ENDPOINTS.SYSTEM.CONFIGURATION);
  },

  getSystemStatistics: async (): Promise<SystemStatisticsResponse> => {
    return fetchApi<SystemStatisticsResponse>(ENDPOINTS.SYSTEM.STATISTICS);
  },

  getSystemTelemetry: async (): Promise<Record<string, unknown>> => {
    return fetchApi<Record<string, unknown>>(ENDPOINTS.SYSTEM.TELEMETRY);
  },

  getSystemInfo: async (): Promise<Record<string, unknown>> => {
    return fetchApi<Record<string, unknown>>(ENDPOINTS.SYSTEM.INFO);
  },
};
