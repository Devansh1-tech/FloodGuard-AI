/**
 * reportsService.ts — Disaster situation reports metadata and file download API client.
 */

import { fetchApi } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ENV } from '@/config/environment';
import { ReportItem } from '@/types/reports';

export const reportsService = {
  getReportMetadata: async (reportId: string): Promise<ReportItem> => {
    return fetchApi<ReportItem>(ENDPOINTS.REPORTS.METADATA(reportId));
  },

  listReportsByRun: async (runId: string): Promise<string[]> => {
    return fetchApi<string[]>(ENDPOINTS.REPORTS.LIST_BY_RUN(runId));
  },

  getDownloadUrl: (reportId: string): string => {
    return `${ENV.API_BASE_URL}${ENDPOINTS.REPORTS.DOWNLOAD(reportId)}`;
  },
};
