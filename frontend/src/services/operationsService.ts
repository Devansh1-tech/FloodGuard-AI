import { apiClient } from '@/api/client';
import { ApiResponse } from '@/types/api';

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{ type: 'Feature'; geometry: unknown; properties?: Record<string, unknown> }>;
};

export interface SafeHavenInput {
  name: string;
  coordinates: [number, number];
  capacity?: number;
}

export async function fetchOsmRoadTile(bbox: { west: number; south: number; east: number; north: number }) {
  const response = await apiClient.get<ApiResponse<GeoJsonFeatureCollection>>('/api/v1/operations/osm-road-network', { params: bbox });
  return response.data.data;
}

export async function findSafeEvacuationRoute(input: {
  roads: GeoJsonFeatureCollection;
  floodPolygons: GeoJsonFeatureCollection;
  origin: [number, number];
  safeHavens: SafeHavenInput[];
}) {
  const response = await apiClient.post<ApiResponse<Record<string, unknown>>>('/api/v1/operations/evacuation-route', {
    roads: input.roads,
    flood_polygons: input.floodPolygons,
    origin: input.origin,
    safe_havens: input.safeHavens,
  });
  return response.data.data;
}

export async function estimateFloodLoss(input: Record<string, unknown>) {
  const response = await apiClient.post<ApiResponse<Record<string, unknown>>>('/api/v1/operations/loss-estimate', input);
  return response.data.data;
}
