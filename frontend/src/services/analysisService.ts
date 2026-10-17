/**
 * analysisService.ts — Disaster analysis trigger, study area presets, and consolidated results API client.
 */

import { fetchApi, postApi } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import {
  AnalysisDetailResponse,
  AnalysisSubmissionResponse,
  AnalysisTriggerRequest,
  AoiPreset,
} from '@/types/analysis';

export const analysisService = {
  submitAnalysis: async (payload: AnalysisTriggerRequest): Promise<AnalysisSubmissionResponse> => {
    return postApi<AnalysisSubmissionResponse, AnalysisTriggerRequest>(ENDPOINTS.ANALYSIS.SUBMIT, payload);
  },

  getPresets: async (): Promise<Record<string, AoiPreset>> => {
    return fetchApi<Record<string, AoiPreset>>(ENDPOINTS.ANALYSIS.PRESETS);
  },

  getAnalysisSummary: async (analysisId: string): Promise<AnalysisDetailResponse> => {
    return fetchApi<AnalysisDetailResponse>(ENDPOINTS.ANALYSIS.SUMMARY(analysisId));
  },
};
