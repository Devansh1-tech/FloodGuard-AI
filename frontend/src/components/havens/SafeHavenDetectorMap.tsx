/**
 * SafeHavenDetectorMap.tsx — Tactical Geospatial Proximity Map for Stage 5.7.
 *
 * Visualizes:
 * 1. Flooded Settlement Centroid with animated deluge pulsing ripples.
 * 2. Concentric Multi-Tier Proximity Buffer Rings (5km, 15km, 30km).
 * 3. Candidate Safe Havens with Suitability Badges (A+, A, B) & Elevations.
 * 4. Radial Egress Vectors connecting flood center to high-ground refuges.
 * 5. Helicopter Landing Zones (HLZ) suitable for Nepal Army Mi-17 rotary rescue.
 *
 * Adheres strictly to @SKILL.md:
 * - Anti-Emoji Policy: Exclusively @phosphor-icons/react and clean SVGs.
 * - WCAG AA Palette: Deep Slate (#0F172A), Dark Slate (#1E293B), Off-White (#F8FAFC).
 * - Retains <div id="map"></div> container DOM ID intact for GIS engine compatibility.
 */

import React, { useEffect } from 'react';
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
  Lightning,
  AirplaneTilt,
} from '@phosphor-icons/react';

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
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LEAFLET DIV ICONS (ANTI-EMOJI ENFORCED: PURE SVGS)
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
          background: rgba(239, 68, 68, 0.45);
          animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          background: #EF4444;
          border: 2px solid #FFFFFF;
          border-radius: 8px;
          padding: 3px 7px;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.6);
          display: flex;
          align-items: center;
          gap: 5px;
          color: #FFFFFF;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12c.6 0 1.2-.2 1.7-.6 1.1-.8 2.7-.8 3.8 0 1.1.8 2.7.8 3.8 0 1.1-.8 2.7-.8 3.8 0 1.1.8 2.7.8 3.8 0 .5.4 1.1.6 1.7.6"/>
            <path d="M2 18c.6 0 1.2-.2 1.7-.6 1.1-.8 2.7-.8 3.8 0 1.1.8 2.7.8 3.8 0 1.1-.8 2.7-.8 3.8 0 1.1.8 2.7.8 3.8 0 .5.4 1.1.6 1.7.6"/>
          </svg>
          <span>${name.split(' ')[0]} DELUGE</span>
        </div>
        <div style="
          background: #7F1D1D;
          color: #FECDD3;
          border: 1px solid #EF4444;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 8px;
          font-weight: 800;
          font-family: monospace;
          margin-top: 2px;
          white-space: nowrap;
        ">
          Depth: ${depth}m
        </div>
      </div>
    `,
    iconSize: [92, 44],
    iconAnchor: [46, 22],
  });
};

const createHavenIcon = (haven: SafeHavenFacility, isSelected: boolean) => {
  const isHighSuitability =
    haven.suitabilityGrade === 'A+' || haven.suitabilityGrade === 'A' || haven.suitabilityGrade === 'B+';
  const bgColor = isHighSuitability ? '#10B981' : '#F59E0B';
  const borderColor = isSelected ? '#FACC15' : '#FFFFFF';

  // SVG badge for HLZ or shelter sanctuary
  const iconSvg = haven.hasHelipad
    ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M4 6h16M7 10h10a4 4 0 0 1 4 4v2H3v-2a4 4 0 0 1 4-4ZM5 20h14M12 16v4"/></svg>`
    : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

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
                background: rgba(250, 204, 21, 0.45);
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
          ${iconSvg}
          <span>${haven.suitabilityGrade} HAVEN</span>
        </div>
        <div style="
          background: #0F172A;
          color: ${isHighSuitability ? '#34D399' : '#FBBF24'};
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 8px;
          font-weight: 700;
          font-family: monospace;
          margin-top: 2px;
          white-space: nowrap;
        ">
          ${haven.elevationMeters}m ASL &bull; Cap: ${haven.totalCapacity.toLocaleString()}
        </div>
      </div>
    `,
    iconSize: [88, 42],
    iconAnchor: [44, 21],
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
  className = '',
}) => {
  return (
    <div
      id="map"
      className={`relative isolate z-10 w-full h-full min-h-[500px] md:min-h-[580px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F172A] ${className}`}
    >
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

        {/* Tactical Street & Terrain Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* ── 1. CONCENTRIC PROXIMITY BUFFER RINGS ──────────────────────────── */}
        {/* Immediate 5km Walkable Ring (Emerald) */}
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

        {/* Tactical 15km Transit Ring (Amber) */}
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

        {/* Active Scan Radius Ring (Cyan) */}
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

        {/* ── 2. FLOODED SETTLEMENT CENTROID PIN (CRIMSON) ─────────────────── */}
        <Marker
          position={centerSettlement.coords}
          icon={createFloodCenterIcon(
            centerSettlement.name,
            centerSettlement.waterDepthMeters
          )}
        >
          <Popup>
            <div className="p-2 font-sans text-xs space-y-1.5 max-w-[260px] text-[#F8FAFC]">
              <div className="font-bold text-[#EF4444] text-sm flex items-center gap-1.5 border-b border-white/10 pb-1">
                <Waves size={15} weight="bold" className="text-[#EF4444]" />
                <span>{centerSettlement.name}</span>
              </div>
              <div className="text-cyan-400 text-[11px] font-medium">
                {centerSettlement.nepaliName}
              </div>
              <div className="text-[#94A3B8] text-[11px] space-y-0.5">
                <div>Water Depth: <strong className="text-[#EF4444] font-bold font-mono">{centerSettlement.waterDepthMeters}m</strong></div>
                <div>Elevation: <strong className="text-white font-bold font-mono">{centerSettlement.elevationMeters}m ASL</strong></div>
              </div>
              <div className="font-mono text-[11px] text-rose-200 bg-rose-500/20 border border-rose-500/30 px-2 py-1.5 rounded-lg flex items-center justify-between mt-1">
                <span className="text-rose-300 text-[10px]">Displaced Headcount:</span>
                <strong className="text-white font-bold">{centerSettlement.displacedPopulation.toLocaleString()} evacuees</strong>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── 3. CANDIDATE SAFE HAVENS & RADIAL PROXIMITY VECTORS ────────────── */}
        {proximityMatches.map((match) => {
          const haven = match.haven;
          const isSelected = selectedHavenId === haven.id;
          const isHighSuitability =
            haven.suitabilityGrade === 'A+' || haven.suitabilityGrade === 'A' || haven.suitabilityGrade === 'B+';
          const vectorColor = isHighSuitability ? '#10B981' : '#F59E0B';

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
                  <div className="p-2 font-sans text-xs space-y-2 max-w-[280px] text-[#F8FAFC]">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-1.5">
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-sm text-white leading-tight">
                          {haven.name}
                        </h4>
                        <div className="text-cyan-400 text-[11px] font-medium">
                          {haven.nepaliName}
                        </div>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-black shrink-0 ${
                          isHighSuitability
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        GRADE {haven.suitabilityGrade}
                      </span>
                    </div>

                    <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                      {haven.notes}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0F172A] p-2.5 rounded-lg border border-white/10 font-mono">
                      <div>
                        <span className="text-[#94A3B8] text-[10px] block">Distance:</span>
                        <strong className="text-white font-bold">{match.distanceKm} km</strong>{' '}
                        <span className="text-[#94A3B8] text-[10px]">({match.compassDirection})</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[10px] block">Elevation:</span>
                        <strong className="text-cyan-400 font-bold">{haven.elevationMeters}m</strong>{' '}
                        <span className="text-emerald-400 font-bold text-[10px]">(+{match.elevationGainMeters}m)</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[10px] block">Capacity:</span>
                        <strong className="text-white font-bold">{haven.totalCapacity.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] text-[10px] block">Vacancy:</span>
                        <strong className="text-emerald-400 font-bold">{match.remainingCapacity.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px] text-[#94A3B8]">
                      <span className="flex items-center gap-1">
                        <AirplaneTilt size={13} weight="bold" className={haven.hasHelipad ? 'text-[#10B981]' : 'text-slate-500'} />
                        <strong className={haven.hasHelipad ? 'text-emerald-400' : 'text-slate-400'}>
                          {haven.hasHelipad ? 'Active HLZ Helipad' : 'Ground Logistics Only'}
                        </strong>
                      </span>
                      <span>
                        Marshal: <strong className="text-cyan-300">{haven.wardenPhone}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectHaven(haven)}
                      className="w-full mt-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-2 text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} weight="bold" />
                      <span>Select for Camp Deployment</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* ── MAP LEGEND (WCAG AA Standard) ─────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[400] rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md px-3 py-2 text-[10px] space-y-1 text-[#F8FAFC] shadow-xl pointer-events-auto">
        <div className="font-bold text-white flex items-center gap-1.5 pb-0.5 border-b border-white/10">
          <Compass size={14} weight="bold" className="text-cyan-400" />
          <span>Proximity Ring Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 rounded border-t-2 border-dashed border-[#10B981]"></span>
          <span className="text-[#94A3B8]">5 km Walkable Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 rounded border-t-2 border-dashed border-[#F59E0B]"></span>
          <span className="text-[#94A3B8]">15 km Tactical Ring</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
          <span className="text-[#94A3B8]">High Suitability (Grade A/B+)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#F59E0B]"></span>
          <span className="text-[#94A3B8]">Moderate Suitability (Grade C)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span>
          <span className="text-[#94A3B8]">Inundated Origin Centroid</span>
        </div>
      </div>
    </div>
  );
};
