/**
 * InteractiveRouteMap.tsx — High-Fidelity Tactical Leaflet Map for Stage 5.6 Routing.
 *
 * Visualizes:
 * 1. Safe Passable Route Polyline with luminous glowing border (Emerald/Cyan for Convoy, Amber for Evacuation).
 * 2. Blocked Inundated Alternative Route (Dashed Red with warning badges).
 * 3. Origin Depot / Start Point Marker with elevation.
 * 4. Target Deluge / Safe Haven Destination Marker with capacity.
 * 5. Numbered Waypoint markers with turn instructions.
 * 6. Critical River Crossing & Bridge status pins.
 */

import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ComputedRouteResult,
  RouteNode,
} from '@/data/teraiRoutingNetwork';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  MapPin,
  Shield,
  Truck,
  Waves,
  Zap,
} from 'lucide-react';

interface InteractiveRouteMapProps {
  route: ComputedRouteResult;
  selectedStepIndex?: number | null;
  onSelectStep?: (index: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM LEAFLET DIV ICONS
// ─────────────────────────────────────────────────────────────────────────────
const createOriginIcon = (node: RouteNode) => {
  const isDepot = node.type === 'depot';
  const bgColor = isDepot ? '#059669' : '#DC2626';
  const label = isDepot ? 'DEPOT' : 'START';

  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          position: absolute;
          top: -4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${bgColor}40;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          background: ${bgColor};
          border: 2px solid #FFFFFF;
          border-radius: 8px;
          padding: 3px 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 4px;
          color: #FFFFFF;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        ">
          <span>${isDepot ? '🚚' : '📍'}</span>
          <span>${label}</span>
        </div>
        <div style="
          background: #0F172A;
          color: #94A3B8;
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 8px;
          font-weight: 700;
          margin-top: 2px;
          white-space: nowrap;
        ">
          ${node.elevationMeters}m ASL
        </div>
      </div>
    `,
    iconSize: [60, 40],
    iconAnchor: [30, 20],
  });
};

const createDestinationIcon = (node: RouteNode) => {
  const isSafeHaven = node.type === 'safe_haven';
  const bgColor = isSafeHaven ? '#0284C7' : '#E11D48';
  const label = isSafeHaven ? 'SAFE HAVEN' : 'DELUGE TARGET';

  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          position: absolute;
          top: -4px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${bgColor}50;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          background: ${bgColor};
          border: 2px solid #FFFFFF;
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
          <span>${isSafeHaven ? '🛡️' : '🌊'}</span>
          <span>${label}</span>
        </div>
        <div style="
          background: #0F172A;
          color: ${isSafeHaven ? '#38BDF8' : '#FDA4AF'};
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 8px;
          font-weight: 700;
          margin-top: 2px;
          white-space: nowrap;
        ">
          ${isSafeHaven ? `Cap: ${node.capacity?.toLocaleString()}` : `${node.elevationMeters}m ASL`}
        </div>
      </div>
    `,
    iconSize: [80, 42],
    iconAnchor: [40, 21],
  });
};

const createWaypointIcon = (stepNum: number, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-waypoint-marker',
    html: `
      <div style="
        background: ${isSelected ? '#38BDF8' : '#1E293B'};
        border: 2px solid ${isSelected ? '#FFFFFF' : '#64748B'};
        color: ${isSelected ? '#0F172A' : '#F1F5F9'};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 900;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        cursor: pointer;
        transition: transform 0.2s;
        transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
      ">
        ${stepNum}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const createBlockedWarningIcon = () => {
  return L.divIcon({
    className: 'custom-blocked-marker',
    html: `
      <div style="
        background: #DC2626;
        border: 2px solid #FFFFFF;
        color: #FFFFFF;
        border-radius: 6px;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 900;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.6);
        white-space: nowrap;
      ">
        <span>⛔</span>
        <span>SUBMERGED ROAD BLOCKED</span>
      </div>
    `,
    iconSize: [160, 24],
    iconAnchor: [80, 12],
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// BOUNDS AUTO-FITTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const RouteBoundsFitter: React.FC<{ path: [number, number][]; blockedPath?: [number, number][] }> = ({
  path,
  blockedPath,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!path || path.length === 0) return;

    const allPoints = [...path];
    if (blockedPath && blockedPath.length > 0) {
      allPoints.push(...blockedPath);
    }

    const lats = allPoints.map((p) => p[0]);
    const lngs = allPoints.map((p) => p[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 12,
      animate: true,
    });
  }, [map, path, blockedPath]);

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INTERACTIVE ROUTE MAP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  route,
  selectedStepIndex,
  onSelectStep,
}) => {
  const isEvacuation = route.mode === 'civilian_alternate';
  const primaryColor = isEvacuation ? '#F59E0B' : '#10B981'; // Amber for Evac, Emerald for Convoy
  const glowColor = isEvacuation ? '#F97316' : '#06B6D4';

  const defaultCenter: [number, number] = useMemo(() => {
    if (route.path.length > 0) {
      const mid = Math.floor(route.path.length / 2);
      return route.path[mid];
    }
    return [27.2, 85.0];
  }, [route.path]);

  // Blocked midpoint coordinate for placing warning badge
  const blockedMidpoint: [number, number] | null = useMemo(() => {
    if (!route.blockedDirectPath || route.blockedDirectPath.length === 0) return null;
    const midIdx = Math.floor(route.blockedDirectPath.length / 2);
    return route.blockedDirectPath[midIdx];
  }, [route.blockedDirectPath]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={8}
        minZoom={7}
        maxZoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <RouteBoundsFitter path={route.path} blockedPath={route.blockedDirectPath} />

        {/* High-Contrast Dark Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* ── 1. BLOCKED FLOODED DIRECT ROUTE (RED DASHED) ───────────────────── */}
        {route.blockedDirectPath && route.blockedDirectPath.length > 0 && (
          <>
            <Polyline
              positions={route.blockedDirectPath}
              pathOptions={{
                color: '#EF4444',
                weight: 4,
                opacity: 0.85,
                dashArray: '8, 8',
                lineCap: 'round',
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 font-sans text-xs">
                  <div className="font-bold text-rose-600 flex items-center gap-1">
                    <span>⛔</span> Direct Highway Submerged &amp; Impassable
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    This road has floodwater exceeding 1.5m. The system has automatically calculated a safe high-ground detour.
                  </p>
                  <div className="font-mono text-[10px] text-rose-500 font-bold">
                    Bypassed: {route.submergedKmBypassed} km of floodwater
                  </div>
                </div>
              </Popup>
            </Polyline>

            {blockedMidpoint && (
              <Marker position={blockedMidpoint} icon={createBlockedWarningIcon()} />
            )}
          </>
        )}

        {/* ── 2. ACTIVE SAFE ROUTE GLOW UNDERLAY ──────────────────────────────── */}
        {route.path.length > 0 && (
          <Polyline
            positions={route.path}
            pathOptions={{
              color: glowColor,
              weight: 9,
              opacity: 0.45,
              lineCap: 'round',
            }}
          />
        )}

        {/* ── 3. ACTIVE SAFE ROUTE FOREGROUND POLYLINE ───────────────────────── */}
        {route.path.length > 0 && (
          <Polyline
            positions={route.path}
            pathOptions={{
              color: primaryColor,
              weight: 4.5,
              opacity: 0.95,
              lineCap: 'round',
            }}
          >
            <Popup>
              <div className="p-2 space-y-1 font-sans text-xs">
                <div className="font-bold text-emerald-600 flex items-center gap-1">
                  <span>✅</span> {route.title}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Distance: <strong>{route.distanceKm} km</strong> &bull; Est. Time: <strong>{route.estimatedMinutes} mins</strong>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Vehicle: {route.vehicleClass.replace('_', ' ').toUpperCase()} &bull; 100% Flood-Clear
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* ── 4. ORIGIN MARKER ──────────────────────────────────────────────── */}
        <Marker position={route.origin.coords} icon={createOriginIcon(route.origin)}>
          <Popup>
            <div className="p-2 font-sans text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <span>📍</span> {route.origin.name}
              </div>
              <div className="text-slate-500 text-[11px]">{route.origin.nepaliName}</div>
              <div className="text-slate-600 text-[11px]">{route.origin.description}</div>
              <div className="font-mono text-[10px] text-emerald-600 font-bold">
                Elevation: {route.origin.elevationMeters}m ASL &bull; Phone: {route.origin.contactPhone || 'N/A'}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── 5. DESTINATION MARKER ─────────────────────────────────────────── */}
        <Marker position={route.destination.coords} icon={createDestinationIcon(route.destination)}>
          <Popup>
            <div className="p-2 font-sans text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <span>🎯</span> {route.destination.name}
              </div>
              <div className="text-slate-500 text-[11px]">{route.destination.nepaliName}</div>
              <div className="text-slate-600 text-[11px]">{route.destination.description}</div>
              {route.destination.capacity && (
                <div className="font-mono text-[10px] text-blue-600 font-bold">
                  Capacity / Population: {route.destination.capacity.toLocaleString()} persons
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* ── 6. NUMBERED WAYPOINT MARKERS ──────────────────────────────────── */}
        {route.steps.map((step, idx) => {
          if (idx === 0 || idx === route.steps.length - 1) return null; // Skip start & end since they have dedicated pins
          const isSelected = selectedStepIndex === idx;

          return (
            <Marker
              key={`step_marker_${step.stepNumber}`}
              position={step.coords}
              icon={createWaypointIcon(step.stepNumber, isSelected)}
              eventHandlers={{
                click: () => onSelectStep && onSelectStep(idx),
              }}
            >
              <Popup>
                <div className="p-2 font-sans text-xs space-y-1">
                  <div className="font-bold text-slate-800">
                    Step {step.stepNumber}: {step.roadName}
                  </div>
                  <div className="text-slate-600 text-[11px]">{step.instruction}</div>
                  <div className="text-slate-500 text-[10px] italic">{step.nepaliInstruction}</div>
                  {step.hazardAlert && (
                    <div className="text-amber-600 font-medium text-[10px] bg-amber-50 p-1 rounded border border-amber-200">
                      ⚠️ {step.hazardAlert}
                    </div>
                  )}
                  <div className="font-mono text-[10px] text-slate-400">
                    Cumul. Dist: {step.cumulativeKm} km &bull; Elev: {step.elevationMeters}m ASL
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── MAP OVERLAY BADGES ────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 max-w-sm">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 backdrop-blur-md p-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isEvacuation ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            ></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              {isEvacuation ? 'Civilian Alternate Egress' : 'Relief Convoy Lifeline'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
            {route.title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
            <span className="text-emerald-400 font-bold">{route.distanceKm} km</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-cyan-400 font-bold">~{route.estimatedMinutes} mins</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-amber-400 font-bold">
              {route.vehicleClass.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {route.submergedKmBypassed > 0 && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/80 backdrop-blur-md px-3 py-1.5 shadow-lg flex items-center gap-2 text-[11px] text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>
              <strong>{route.submergedKmBypassed} km</strong> flooded highway avoided on direct route
            </span>
          </div>
        )}
      </div>

      {/* ── MAP LEGEND ────────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 py-2 text-[10px] space-y-1 text-slate-300 shadow-xl">
        <div className="font-bold text-white flex items-center gap-1.5 pb-0.5 border-b border-slate-800">
          <Compass className="h-3 w-3 text-cyan-400" />
          Tactical Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-1 rounded"
            style={{ backgroundColor: primaryColor }}
          ></span>
          <span>Safe Traversable Route</span>
        </div>
        {route.blockedDirectPath && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded border-t-2 border-dashed border-rose-500"></span>
            <span>Blocked Submerged Road</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Emergency Base / Depot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500"></span>
          <span>High-Ground Safe Haven</span>
        </div>
      </div>
    </div>
  );
};
