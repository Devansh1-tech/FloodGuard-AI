/**
 * GisMapView.tsx — Interactive Leaflet GIS Map with Sentinel-1 Inundation & Infrastructure layers.
 */

import React, { useState } from 'react';
import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapControls } from '@/components/maps/MapControls';
import { MapLegend } from '@/components/maps/MapLegend';

// Modern SVG DivIcons
const createFacilityIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-gis-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px ${color}88, 0 4px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ${label}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const hospitalIcon = createFacilityIcon('#EF4444', '+');
const schoolIcon = createFacilityIcon('#3B82F6', 'S');
const policeIcon = createFacilityIcon('#10B981', 'P');
const shelterIcon = createFacilityIcon('#8B5CF6', 'E');

export interface GisMapViewProps {
  center?: [number, number];
  zoom?: number;
  floodAreaKm2?: number;
  className?: string;
  facilities?: Array<{
    id: string;
    name: string;
    type: 'hospital' | 'school' | 'police' | 'shelter';
    coords: [number, number];
    status: string;
  }>;
}

// Controller component to track mouse movement
const MouseCoordinatesTracker: React.FC<{
  onMouseMove: (coords: { lat: number; lng: number }) => void;
}> = ({ onMouseMove }) => {
  useMapEvents({
    mousemove(e) {
      onMouseMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Controller component for programmatic zoom and pan
const MapController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const GisMapView: React.FC<GisMapViewProps> = ({
  center = [26.65, 87.1],
  zoom = 10,
  floodAreaKm2 = 180.6,
  className = 'h-[600px] w-full',
  facilities,
}) => {
  const [activeBasemap, setActiveBasemap] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number }>({
    lat: center[0],
    lng: center[1],
  });

  const basemapUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const basemapAttributions = {
    dark: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
    osm: '&copy; OpenStreetMap contributors',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  };

  // Synthetic representative inundation polygons based on center
  const sampleFloodPolygon: [number, number][] = [
    [center[0] - 0.15, center[1] - 0.15],
    [center[0] - 0.05, center[1] + 0.12],
    [center[0] + 0.12, center[1] + 0.18],
    [center[0] + 0.18, center[1] - 0.02],
    [center[0] + 0.08, center[1] - 0.16],
    [center[0] - 0.15, center[1] - 0.15],
  ];

  const sampleFacilities = facilities || [
    {
      id: 'f-1',
      name: 'Koshi Zonal Hospital',
      type: 'hospital' as const,
      coords: [center[0] + 0.02, center[1] + 0.04] as [number, number],
      status: 'Submerged (0.6m water level)',
    },
    {
      id: 'f-2',
      name: 'Biratnagar Health Post',
      type: 'hospital' as const,
      coords: [center[0] - 0.06, center[1] - 0.02] as [number, number],
      status: 'Submerged (1.1m water level)',
    },
    {
      id: 'f-3',
      name: 'Adarsha Secondary High School',
      type: 'school' as const,
      coords: [center[0] + 0.05, center[1] - 0.08] as [number, number],
      status: 'Flooded ground floor',
    },
    {
      id: 'f-4',
      name: 'Shree Tribhuvan Public School',
      type: 'school' as const,
      coords: [center[0] - 0.02, center[1] + 0.09] as [number, number],
      status: 'Surrounded by floodwaters',
    },
    {
      id: 'f-5',
      name: 'District Police Sub-Division',
      type: 'police' as const,
      coords: [center[0] + 0.08, center[1] + 0.02] as [number, number],
      status: 'Access road cut off',
    },
    {
      id: 'f-6',
      name: 'Koshi Red Cross Evacuation Camp',
      type: 'shelter' as const,
      coords: [center[0] + 0.15, center[1] - 0.1] as [number, number],
      status: 'Active (850 evacuees hosted)',
    },
  ];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/80 shadow-2xl ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapController center={center} zoom={zoom} />
        <MouseCoordinatesTracker onMouseMove={setMouseCoords} />

        {/* Dynamic Basemap Layer */}
        <TileLayer
          url={basemapUrls[activeBasemap]}
          attribution={basemapAttributions[activeBasemap]}
          maxZoom={18}
        />

        {/* Flood Extent Inundation Layer */}
        <Polygon
          positions={sampleFloodPolygon}
          pathOptions={{
            color: '#2563EB',
            fillColor: '#3B82F6',
            fillOpacity: 0.45,
            weight: 2,
            dashArray: '4, 4',
          }}
        >
          <Popup>
            <div className="p-1 space-y-1 text-slate-100">
              <h4 className="font-bold text-blue-400 text-sm">Delineated Flood Inundation</h4>
              <p className="text-xs text-slate-300">
                Satellite: Sentinel-1 SAR GRD (VV/VH)<br />
                Detection Method: Otsu Automatic Thresholding<br />
                Calculated Inundation: <strong>{floodAreaKm2.toFixed(1)} km²</strong>
              </p>
            </div>
          </Popup>
        </Polygon>

        {/* Critical Facilities Pins */}
        {sampleFacilities.map((facility) => {
          let icon = hospitalIcon;
          if (facility.type === 'school') icon = schoolIcon;
          if (facility.type === 'police') icon = policeIcon;
          if (facility.type === 'shelter') icon = shelterIcon;

          return (
            <Marker key={facility.id} position={facility.coords} icon={icon}>
              <Popup>
                <div className="p-1 space-y-1.5 text-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {facility.type}
                  </span>
                  <h4 className="font-bold text-sm text-white">{facility.name}</h4>
                  <div className="rounded bg-slate-800 p-2 text-xs text-slate-300 border border-slate-700">
                    <strong>Status:</strong> {facility.status}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Coord: {facility.coords[0].toFixed(4)}°N, {facility.coords[1].toFixed(4)}°E
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Controls */}
      <MapControls
        activeBasemap={activeBasemap}
        onBasemapChange={setActiveBasemap}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onResetView={() => {}}
        mouseCoords={mouseCoords}
      />

      {/* Cartographic Legend */}
      <MapLegend />
    </div>
  );
};
