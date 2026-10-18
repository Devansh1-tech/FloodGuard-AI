/**
 * SafeHavenDetectorMap.tsx — Tactical Geospatial Proximity Map for Stage 5.7.
 *
 * Visualizes:
 * 1. Flooded Settlement Centroid with animated deluge pulsing ripples.
 * 2. Concentric Multi-Tier Proximity Buffer Rings (5km, 15km, 30km).
 * 3. Candidate Safe Havens with Suitability Badges (A+, A, B) & Elevations.
 * 4. Radial Egress Vectors connecting flood center to high-ground refuges.
 * 5. Helicopter Landing Zones (HLZ) suitable for Nepal Army Mi-17 rotary rescue.
 */

import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProximityMatch } from '@/services/teraiProximityEngine';
import { SafeHavenFacility } from '@/data/teraiSafeHavens';
import {
  Compass,
  MapPin,
  Shield,
  ShieldCheck,
  Waves,
  Zap,
} from 'lucide-react';

interface SafeHavenDetectorMapProps {
  centerSettlement: {
    id: string;
    name: string;
    nepaliName: string;
    coords: [number, number];
    elevationMeters: number;
    waterDepthMeters: number;
    displacedPopulation: number;
  };
  proximityMatches: ProximityMatch[];
  selectedHavenId: string | null;
  onSelectHaven: (haven: SafeHavenFacility) => void;
  scanRadiusKm: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LEAFLET DIV ICONS
// ─────────────────────────────────────────────────────────────────────────────
const createFloodCenterIcon = (name: string, depth: number) => {
  return L.divIcon({
    className: 'custom-flood-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          position: absolute;
          top: -6px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.4);
          animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          background: #E11D48;
          border: 2px solid #FFFFFF;
          border-radius: 8px;
          padding: 3px 7px;
          box-shadow: 0 4px 14px rgba(225, 29, 72, 0.6);
          display: flex;
          align-items: center;
          gap: 4px;
          color: #FFFFFF;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        ">
          <span>🌊</span>
          <span>${name.split(' ')[0]} DELUGE</span>
        </div>
        <div style="
          background: #7F1D1D;
          color: #FECDD3;
          border: 1px solid #E11D48;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 8px;
          font-weight: 800;
          margin-top: 2px;
          white-space: nowrap;
        ">
          Depth: ${depth}m
        </div>
      </div>
    `,
    iconSize: [90, 44],
    iconAnchor: [45, 22],
  });
};

const createHavenIcon = (haven: SafeHavenFacility, isSelected: boolean) => {
  const isTopGrade = haven.suitabilityGrade === 'A+';
  const bgColor = isTopGrade ? '#059669' : '#0284C7';
  const borderColor = isSelected ? '#FACC15' : '#FFFFFF';

  return L.divIcon({
    className: 'custom-haven-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        ${
          isSelected
            ? `<div style="
                position: absolute;
                top: -5px;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: rgba(250, 204, 21, 0.4);
                animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ''
        }
        <div style="
          background: ${bgColor};
          border: 2.5px solid ${borderColor};
          border-radius: 8px;
          padding: 3px 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          gap: 4px;
          color: #FFFFFF;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        ">
          <span>${haven.hasHelipad ? '🚁' : '🛡️'}</span>
          <span>${haven.suitabilityGrade} HAVEN</span>
        </div>
        <div style="
          background: #0F172A;
          color: ${isTopGrade ? '#34D399' : '#38BDF8'};
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 8px;
          font-weight: 700;
          margin-top: 2px;
          white-space: nowrap;
        ">
          ${haven.elevationMeters}m ASL &bull; Cap: ${haven.totalCapacity.toLocaleString()}
        </div>
      </div>
    `,
    iconSize: [85, 42],
    iconAnchor: [42, 21],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDS AUTO-FITTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const MapBoundsFitter: React.FC<{
  centerCoords: [number, number];
  matches: ProximityMatch[];
}> = ({ centerCoords, matches }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [centerCoords];
    matches.forEach((m) => points.push(m.haven.coords));

    if (points.length === 1) {
      map.setView(centerCoords, 10, { animate: true });
      return;
    }

    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);

    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 12,
      animate: true,
    });
  }, [map, centerCoords, matches]);

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SAFE HAVEN DETECTOR MAP
// ─────────────────────────────────────────────────────────────────────────────
export const SafeHavenDetectorMap: React.FC<SafeHavenDetectorMapProps> = ({
  centerSettlement,
  proximityMatches,
  selectedHavenId,
  onSelectHaven,
  scanRadiusKm,
}) => {
  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={centerSettlement.coords}
        zoom={9}
        minZoom={7}
        maxZoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapBoundsFitter
          centerCoords={centerSettlement.coords}
          matches={proximityMatches}
        />

        {/* Tactical Dark/Voyager Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* ── 1. CONCENTRIC PROXIMITY BUFFER RINGS ──────────────────────────── */}
        {/* Immediate 5km Walkable Ring */}
        <Circle
          center={centerSettlement.coords}
          radius={5000}
          pathOptions={{
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        />

        {/* Tactical 15km Transit Ring */}
        <Circle
          center={centerSettlement.coords}
          radius={15000}
          pathOptions={{
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.04,
            weight: 1.5,
            dashArray: '6, 6',
          }}
        />

        {/* Active Scan Radius Ring */}
        <Circle
          center={centerSettlement.coords}
          radius={scanRadiusKm * 1000}
          pathOptions={{
            color: '#06B6D4',
            fillColor: '#06B6D4',
            fillOpacity: 0.02,
            weight: 2,
            dashArray: '8, 8',
          }}
        />

        {/* ── 2. FLOODED SETTLEMENT CENTROID PIN ────────────────────────────── */}
        <Marker
          position={centerSettlement.coords}
          icon={createFloodCenterIcon(
            centerSettlement.name,
            centerSettlement.waterDepthMeters
          )}
        >
          <Popup>
            <div className="p-2 font-sans text-xs space-y-1">
              <div className="font-bold text-rose-600 flex items-center gap-1">
                <span>🌊</span> {centerSettlement.name}
              </div>
              <div className="text-slate-600 text-[11px]">
                {centerSettlement.nepaliName}
              </div>
              <div className="text-slate-500 text-[10px]">
                Water Depth: <strong>{centerSettlement.waterDepthMeters}m</strong> &bull; Elevation: {centerSettlement.elevationMeters}m ASL
              </div>
              <div className="font-mono text-[10px] text-rose-500 font-bold">
                Displaced Headcount: {centerSettlement.displacedPopulation.toLocaleString()} evacuees
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── 3. CANDIDATE SAFE HAVENS & RADIAL PROXIMITY VECTORS ────────────── */}
        {proximityMatches.map((match) => {
          const haven = match.haven;
          const isSelected = selectedHavenId === haven.id;
          const vectorColor = haven.suitabilityGrade === 'A+' ? '#10B981' : '#0284C7';

          return (
            <React.Fragment key={haven.id}>
              {/* Radial Distance Vector */}
              <Polyline
                positions={[centerSettlement.coords, haven.coords]}
                pathOptions={{
                  color: isSelected ? '#FACC15' : vectorColor,
                  weight: isSelected ? 3.5 : 2,
                  dashArray: '5, 8',
                  opacity: isSelected ? 0.95 : 0.6,
                }}
              />

              {/* Haven Marker */}
              <Marker
                position={haven.coords}
                icon={createHavenIcon(haven, isSelected)}
                eventHandlers={{
                  click: () => onSelectHaven(haven),
                }}
              >
                <Popup>
                  <div className="p-2 font-sans text-xs space-y-1.5 max-w-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">
                        {haven.name}
                      </span>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-black shrink-0">
                        GRADE {haven.suitabilityGrade}
                      </span>
                    </div>

                    <div className="text-slate-500 text-[10px] italic">
                      {haven.nepaliName}
                    </div>

                    <p className="text-slate-600 text-[11px] leading-snug">
                      {haven.notes}
                    </p>

                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                      <div>Dist: <strong>{match.distanceKm} km</strong> ({match.compassDirection})</div>
                      <div>Elev: <strong>{haven.elevationMeters}m</strong> (+{match.elevationGainMeters}m)</div>
                      <div>Capacity: <strong>{haven.totalCapacity.toLocaleString()}</strong></div>
                      <div>Vacancy: <strong className="text-emerald-600">{match.remainingCapacity.toLocaleString()}</strong></div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                      <span>Helipad: {haven.hasHelipad ? '✅ Active HLZ' : '❌ None'}</span>
                      <span>Warden: {haven.wardenPhone}</span>
                    </div>

                    <button
                      onClick={() => onSelectHaven(haven)}
                      className="w-full mt-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 text-[11px] shadow-sm transition-all"
                    >
                      Select for Camp Deployment
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* ── MAP OVERLAY BADGES ────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 max-w-sm">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              k-NN Safe Haven Proximity Scan
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
            Origin: {centerSettlement.name} ({centerSettlement.elevationMeters}m ASL)
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
            <span className="text-cyan-400 font-bold">
              Radius: {scanRadiusKm} km
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-emerald-400 font-bold">
              {proximityMatches.length} Havens Detected
            </span>
          </div>
        </div>
      </div>

      {/* ── MAP LEGEND ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 py-2 text-[10px] space-y-1 text-slate-300 shadow-xl">
        <div className="font-bold text-white flex items-center gap-1.5 pb-0.5 border-b border-slate-800">
          <Compass className="h-3 w-3 text-cyan-400" />
          Proximity Ring Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 rounded border-t-2 border-dashed border-emerald-500"></span>
          <span>5 km Walkable Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 rounded border-t-2 border-dashed border-amber-500"></span>
          <span>15 km Tactical Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>A+ Grade Safe Haven</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500"></span>
          <span>A/B+ Grade Safe Haven</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          <span>Flooded Settlement Centroid</span>
        </div>
      </div>
    </div>
  );
};
