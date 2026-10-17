/**
 * artifacts.ts — Artifact models and filter params.
 */

export interface ArtifactItem {
  id: string;
  flood_event_id: string;
  artifact_type: string;
  file_path: string;
  file_size_bytes?: number | null;
  checksum?: string | null;
  download_url: string;
  created_at: string;
}

export type ArtifactFilterType = 'ALL' | 'GEOJSON' | 'GEOTIFF' | 'PNG' | 'CSV' | 'JSON';
