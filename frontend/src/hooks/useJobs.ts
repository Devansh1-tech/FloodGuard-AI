/**
 * useJobs.ts — TanStack Query hooks for listing, monitoring, and controlling background jobs.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '@/services/jobsService';
import { JobFilterParams, JobStatusDetail } from '@/types/jobs';

export function useJobs(params?: JobFilterParams, autoRefresh: boolean = true) {
  return useQuery<JobStatusDetail[]>({
    queryKey: ['jobs', params],
    queryFn: () => jobsService.listJobs(params),
    refetchInterval: (query) => {
      if (!autoRefresh) return false;
      const data = query.state.data;
      const hasActiveJobs = data?.some((j) => j.status === 'RUNNING' || j.status === 'QUEUED');
      return hasActiveJobs ? 3000 : 8000;
    },
  });
}

export function useJobDetail(jobId?: string, enabled: boolean = true) {
  return useQuery<JobStatusDetail>({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => jobsService.getJobDetail(jobId!),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'RUNNING' || status === 'QUEUED' || status === 'PENDING') {
        return 2000;
      }
      return false;
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobsService.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobsService.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
