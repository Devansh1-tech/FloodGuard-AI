/**
 * artifactsService.ts — Geospatial deliverables and export artifacts API client.
 */

import { fetchApi } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ENV } from '@/config/environment';
import { ArtifactItem } from '@/types/artifacts';

export const artifactsService = {
  getArtifactMetadata: async (artifactId: string): Promise<ArtifactItem> => {
    return fetchApi<ArtifactItem>(ENDPOINTS.ARTIFACTS.METADATA(artifactId));
  },

  getDownloadUrl: (artifactId: string): string => {
    return `${ENV.API_BASE_URL}${ENDPOINTS.ARTIFACTS.DOWNLOAD(artifactId)}`;
  },
};
