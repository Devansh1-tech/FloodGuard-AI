import { describe, expect, it } from 'vitest';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

describe('API Client & Endpoints Suite', () => {
  it('has valid endpoint configurations', () => {
    expect(ENDPOINTS.HEALTH.STATUS).toBe('/api/v1/health');
    expect(ENDPOINTS.SYSTEM.CONFIGURATION).toBe('/api/v1/system/configuration');
    expect(ENDPOINTS.ANALYSIS.SUBMIT).toBe('/api/v1/analysis');
    expect(ENDPOINTS.JOBS.LIST).toBe('/api/v1/jobs');
  });

  it('configures default axios headers', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
