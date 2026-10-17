/**
 * gis.ts — GIS layer interfaces and map state definitions.
 */

export interface MapLayerConfig {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  color: string;
  type: 'vector' | 'raster' | 'markers' | 'base';
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}
