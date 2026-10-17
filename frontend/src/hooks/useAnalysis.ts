/**
 * useAnalysis.ts — TanStack Query hooks for triggering and inspecting disaster analyses.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisService } from '@/services/analysisService';
import { AnalysisDetailResponse, AnalysisSubmissionResponse, AnalysisTriggerRequest, AoiPreset } from '@/types/analysis';

export function usePresets() {
  return useQuery<Record<string, AoiPreset>>({
    queryKey: ['analysis', 'presets'],
    queryFn: analysisService.getPresets,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalysisSummary(analysisId?: string, enabled: boolean = true) {
  return useQuery<AnalysisDetailResponse>({
    queryKey: ['analysis', 'summary', analysisId],
    queryFn: () => analysisService.getAnalysisSummary(analysisId!),
    enabled: Boolean(analysisId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'RUNNING' || status === 'QUEUED' || status === 'PENDING') {
        return 3000;
      }
      return false;
    },
  });
}

export function useSubmitAnalysis() {
  const queryClient = useQueryClient();
  return useMutation<AnalysisSubmissionResponse, Error, AnalysisTriggerRequest>({
    mutationFn: (payload: AnalysisTriggerRequest) => analysisService.submitAnalysis(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'stats'] });
    },
  });
}
