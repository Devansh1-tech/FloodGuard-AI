import React, { useState } from 'react';
import {
  Truck,
  Navigation,
  Plane,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Wind,
  Layers,
  MapPin,
  Anchor,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  ReliefConvoyRoute,
  AlternateRoute,
  HelicopterSortie,
  getWeatherStatusLabel,
  getFlightStatusLabel,
} from '@/data/teraiReliefRoutes';
import { TeraiBridge } from '@/data/teraiRoadNetwork';

export interface EmergencyLogisticsHubProps {
  reliefRoutes: ReliefConvoyRoute[];
  alternateRoutes: AlternateRoute[];
  helicopterSorties: HelicopterSortie[];
  bridges: TeraiBridge[];
  onSelectRoute?: (type: 'relief' | 'alternate' | 'helicopter', id: string) => void;
}

export const EmergencyLogisticsHub: React.FC<EmergencyLogisticsHubProps> = ({
  reliefRoutes,
  alternateRoutes,
  helicopterSorties,
  bridges,
}) => {
  const [activeTab, setActiveTab] = useState<'relief' | 'alternate' | 'helicopter' | 'bridges'>('relief');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl space-y-0">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Navigation className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Multi-Modal Emergency Logistics &amp; Air Sortie Operations Hub
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ground relief supply corridors, civilian flood detours, helicopter air sorties with aviation weather clearance, and critical bridge telemetry.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('relief')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'relief'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Relief Convoys ({reliefRoutes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alternate')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'alternate'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Civilian Bypasses ({alternateRoutes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('helicopter')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'helicopter'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            <span>Air Support ({helicopterSorties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bridges')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bridges'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Bridges &amp; Crossings ({bridges.length})</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ───────────────────────────────────────────────────────────────────
            TAB 1: GROUND RELIEF CONVOYS (USER REQUIREMENT 4)
        ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'relief' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Active Ground Supply Lines to Flooded Settlements &bull; Dispatched via Nepal Army &amp; NRCS
              </span>
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                High-Clearance &amp; Zodiac Rafts
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {reliefRoutes.map((route) => (
                <div
                  key={route.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                          {route.name}
                        </h4>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                          {route.nepaliName}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold shrink-0">
                        {route.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Distance &amp; Time</span>
                        <div className="font-bold text-white">
                          {route.totalDistanceKm} km &bull; ~{route.estimatedTimeMins} mins
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Fleet Type</span>
                        <div className="font-bold text-emerald-400 uppercase">
                          {route.convoyType.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Payload Capacity</span>
                        <div className="font-bold text-cyan-300">
                          {route.payloadCapacity}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>
                        <strong className="text-slate-400">Origin Depot:</strong> {route.origin}
                      </div>
                      <div>
                        <strong className="text-slate-400">Destination:</strong> {route.destination}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Road Condition:</strong> {route.roadCondition}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tactical Waypoint Sequence:</div>
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      {route.waypoints.map((wp, idx) => (
                        <React.Fragment key={idx}>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {idx + 1}. {wp}
                          </span>
                          {idx < route.waypoints.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            TAB 2: CIVILIAN ALTERNATE BYPASS DETOURS (USER REQUIREMENT 5)
        ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'alternate' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Safe Detours for Travelers &amp; Commercial Traffic to Avoid Submerged Highway Sections
              </span>
              <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                100% Flood-Free Guarantee
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {alternateRoutes.map((alt) => (
                <div
                  key={alt.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Compass className="h-4 w-4 text-amber-400 shrink-0" />
                          {alt.name}
                        </h4>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                          {alt.nepaliName}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold shrink-0">
                        {alt.safetyRating === 'safe' ? 'SAFE ELEVATED' : 'CAUTION'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-200 space-y-0.5">
                      <div className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Submerged Highway Breach:
                      </div>
                      <div>
                        <strong>{alt.blockedRoad}</strong> &bull; {alt.blockedSegment}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Bypass Length</span>
                        <div className="font-bold text-white">{alt.bypassDistanceKm} km</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Detour Time Delta</span>
                        <div className="font-bold text-amber-400">+{alt.extraTimeMins} mins</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Road Surface</span>
                        <div className="font-bold text-slate-300 capitalize">
                          {alt.roadSurface.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>
                        <strong className="text-slate-400">Bypass Route:</strong> {alt.bypassName}
                      </div>
                      <div>
                        <strong className="text-slate-400">Suitable For:</strong>{' '}
                        <span className="font-semibold text-emerald-400 uppercase">
                          {alt.suitableFor.join(', ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        {alt.advisoryNote}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Detour Junction Nodes:</div>
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      {alt.waypoints.map((wp, idx) => (
                        <React.Fragment key={idx}>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {wp}
                          </span>
                          {idx < alt.waypoints.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            TAB 3: HELICOPTER AIR SUPPORT & AVIATION WEATHER (USER REQUIREMENT 8)
        ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'helicopter' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Aviation Weather Feasibility &amp; Nepal Army Helicopter Air-Evac Sorties
              </span>
              <span className="font-mono text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded">
                VFR Meteorological Cleared
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {helicopterSorties.map((sortie) => {
                const weatherStatus = getWeatherStatusLabel(sortie.currentWeather);
                const flightStatus = getFlightStatusLabel(sortie.flightStatus);
                const w = sortie.weatherDetails;

                return (
                  <div
                    key={sortie.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 hover:border-sky-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Plane className="h-4 w-4 text-sky-400 shrink-0" />
                            {sortie.name}
                          </h4>
                          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {sortie.nepaliName}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 text-white"
                          style={{ background: weatherStatus.bgColor || '#0284C7' }}
                        >
                          {weatherStatus.label}
                        </span>
                      </div>

                      {/* Aviation Weather Dashboard Card */}
                      <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-300">
                          <span className="flex items-center gap-1">
                            <Wind className="h-3.5 w-3.5" /> Live METAR / Aviation Telemetry
                          </span>
                          <span className="font-mono">{flightStatus.label}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400">Ceiling</span>
                            <div className="font-bold text-white">{w.ceiling_ft.toLocaleString()} ft AGL</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Visibility</span>
                            <div className="font-bold text-emerald-400">{w.visibility_km} km</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Winds</span>
                            <div className="font-bold text-white">{w.wind_speed_knots} kts {w.wind_direction}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Precipitation</span>
                            <div className="font-bold text-slate-300">{w.precipitation}</div>
                          </div>
                        </div>
                      </div>

                      {/* Flight Specifications */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Aircraft</span>
                          <div className="font-bold text-white">
                            {sortie.aircraftType.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Flight Time</span>
                          <div className="font-bold text-sky-400">
                            ~{sortie.estimatedFlightTimeMins} mins ({sortie.distanceNm} NM)
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Max Lift</span>
                          <div className="font-bold text-emerald-400">
                            {sortie.maxPayloadKg.toLocaleString()} kg / {sortie.maxPassengers} pax
                          </div>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        <div>
                          <strong className="text-slate-400">Origin Heliport:</strong> {sortie.originBase}
                        </div>
                        <div>
                          <strong className="text-slate-400">Destination Safe Haven HLZ:</strong>{' '}
                          <span className="text-sky-300 font-semibold">{sortie.destinationHLZ}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                          {sortie.sortieNotes}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                      <span>Priority: <strong className="text-rose-400 uppercase">{sortie.missionPriority}</strong></span>
                      <span className="font-mono text-[10px] text-sky-400">Nepal Army Air Wing Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            TAB 4: BRIDGES & CROSSINGS TELEMETRY (USER REQUIREMENT 3)
        ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'bridges' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Critical River Bridges &amp; Barrages Vulnerability Telemetry across Terai Corridors
              </span>
              <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                Real-Time APF Flood Watch
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {bridges.map((bridge) => {
                const isDanger = bridge.status === 'critical_danger';
                const isWarning = bridge.status === 'high_warning';
                const badgeColor = isDanger ? 'bg-red-600' : isWarning ? 'bg-amber-600' : 'bg-emerald-600';

                return (
                  <div
                    key={bridge.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3 hover:border-rose-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span className="text-base">🌉</span>
                            {bridge.name}
                          </h4>
                          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {bridge.nepaliName}
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 text-white ${badgeColor}`}>
                          {bridge.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">River &amp; District</span>
                          <div className="font-bold text-white">{bridge.river}</div>
                          <div className="text-[10px] text-slate-400">{bridge.district}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Traffic Status</span>
                          <div className={`font-bold uppercase ${bridge.trafficStatus === 'closed' ? 'text-red-400' : bridge.trafficStatus === 'restricted_single_lane' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {bridge.trafficStatus.replace(/_/g, ' ')}
                          </div>
                        </div>
                        {bridge.dischargeCusecs && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Discharge Rate</span>
                            <div className="font-bold text-cyan-300">
                              {bridge.dischargeCusecs.toLocaleString()} cusecs
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        <div>
                          <strong className="text-slate-400">Structural Evaluation:</strong> {bridge.structuralStatus}
                        </div>
                        {bridge.notes && (
                          <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <strong className="text-slate-300">Armed Police Force Advisory:</strong> {bridge.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Coordinates: [{bridge.coords[0].toFixed(4)}, {bridge.coords[1].toFixed(4)}]</span>
                      <span className="text-cyan-400">Live Sensory Probe</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
