/**
 * jobsService.ts — Background job execution management, polling, and status API client.
 */

import { deleteApi, fetchApi, postApi } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { JobFilterParams, JobStatusDetail } from '@/types/jobs';

export const jobsService = {
  listJobs: async (params?: JobFilterParams): Promise<JobStatusDetail[]> => {
    return fetchApi<JobStatusDetail[]>(ENDPOINTS.JOBS.LIST, params as Record<string, unknown>);
  },

  getJobDetail: async (jobId: string): Promise<JobStatusDetail> => {
    return fetchApi<JobStatusDetail>(ENDPOINTS.JOBS.DETAIL(jobId));
  },

  cancelJob: async (jobId: string): Promise<Record<string, unknown>> => {
    return postApi<Record<string, unknown>>(ENDPOINTS.JOBS.CANCEL(jobId), {});
  },

  deleteJob: async (jobId: string): Promise<Record<string, unknown>> => {
    return deleteApi<Record<string, unknown>>(ENDPOINTS.JOBS.DELETE(jobId));
  },
};
