/**
 * useSystemHealth.ts — TanStack Query hooks for system health, telemetry, and platform stats.
 */

import { useQuery } from '@tanstack/react-query';
import { systemService } from '@/services/systemService';
import { HealthCheckResponse, SystemConfigurationResponse, SystemStatisticsResponse } from '@/types/system';

export function useSystemHealth(refetchInterval: number = 10000) {
  return useQuery<HealthCheckResponse>({
    queryKey: ['system', 'health'],
    queryFn: systemService.getHealthStatus,
    refetchInterval,
    retry: 2,
  });
}

export function useSystemConfig() {
  return useQuery<SystemConfigurationResponse>({
    queryKey: ['system', 'config'],
    queryFn: systemService.getSystemConfiguration,
    staleTime: 60000,
  });
}

export function useSystemStats(refetchInterval: number = 15000) {
  return useQuery<SystemStatisticsResponse>({
    queryKey: ['system', 'stats'],
    queryFn: systemService.getSystemStatistics,
    refetchInterval,
  });
}

export function useSystemTelemetry() {
  return useQuery<Record<string, unknown>>({
    queryKey: ['system', 'telemetry'],
    queryFn: systemService.getSystemTelemetry,
    refetchInterval: 10000,
  });
}
