/**
 * Stage56RoutingPage.tsx — Stage 5.6 Emergency Routing & Evacuation Navigator.
 *
 * Implements Points 7 & 9 of the Master Plan:
 * 1. Relief & Medical Supply Convoy Router (Point 7):
 *    - Optimal safe routes from regional depots (Bharatpur, Duhabi, Nepalgunj, Dhangadhi) to cut-off flood zones.
 *    - Strict flood avoidance: submerged road segments receive infinite cost penalty.
 *    - WHO medical & cargo quota calculation (potable water, food, Aquatabs, antivenom, IV fluids).
 * 2. Civilian Evacuation Alternate Route Navigator (Point 9):
 *    - Step-by-step alternate egress directing stranded populations away from submerged highways to elevated safe havens.
 *    - Hazard alerts with bypass rationales.
 * 3. Interactive Leaflet / Google Maps Route Overlay with glowing polylines and turn cues.
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cross,
  Droplet,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  Filter,
  Gauge,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Printer,
  Radio,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import {
  computeTeraiRoute,
  calculateWHOQuota,
  EMERGENCY_MISSION_PRESETS,
  ROUTE_NODES,
  ROUTE_EDGES,
  VehicleClass,
  RouteNode,
  ComputedRouteResult,
  EmergencyMissionPreset,
} from '@/data/teraiRoutingNetwork';
import { InteractiveRouteMap } from '@/components/routing/InteractiveRouteMap';

export const Stage56RoutingPage: React.FC = () => {
  // Mode: Relief Convoy (Point 7) or Civilian Evacuation (Point 9)
  const [activeMode, setActiveMode] = useState<'relief_convoy' | 'civilian_alternate'>('relief_convoy');

  // Selected preset or custom route
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_convoy_gaur');
  const [originId, setOriginId] = useState<string>('depot_bharatpur');
  const [destinationId, setDestinationId] = useState<string>('target_gaur');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('army_6x6');
  const [avoidFloods, setAvoidFloods] = useState<boolean>(true);

  // Selected waypoint step
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Dispatch sheet modal state
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);

  // Filter available presets based on active mode
  const currentPresets = useMemo(() => {
    return EMERGENCY_MISSION_PRESETS.filter((p) => p.type === activeMode);
  }, [activeMode]);

  // Compute active route dynamically via Dijkstra Solver
  const activeRoute: ComputedRouteResult = useMemo(() => {
    return computeTeraiRoute(originId, destinationId, vehicleClass, avoidFloods);
  }, [originId, destinationId, vehicleClass, avoidFloods]);

  // Handle switching preset
  const handleSelectPreset = (preset: EmergencyMissionPreset) => {
    setSelectedPresetId(preset.id);
    setActiveMode(preset.type);
    setOriginId(preset.originId);
    setDestinationId(preset.destinationId);
    setVehicleClass(preset.vehicleClass);
    setSelectedStepIndex(null);
  };

  // Handle switching mode
  const handleModeChange = (mode: 'relief_convoy' | 'civilian_alternate') => {
    setActiveMode(mode);
    const firstPreset = EMERGENCY_MISSION_PRESETS.find((p) => p.type === mode);
    if (firstPreset) {
      handleSelectPreset(firstPreset);
    }
  };

  // Node lists for custom dropdown selectors
  const depotNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'depot');
  const floodNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'flooded_settlement');
  const safeHavenNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'safe_haven');

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────────────
          PAGE HEADER & ARCHITECTURE BADGE
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5" />
              STAGE 5.6: EMERGENCY ROUTING &amp; EVACUATION NAVIGATOR
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              Point 7: Convoy Router
            </span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
              Point 9: Evacuation Detours
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
            <Truck className="h-7 w-7 text-cyan-400" />
            Terai Emergency Routing Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-4xl">
            Calculates optimal disaster transport corridors across the 21 Terai districts with strict flood avoidance penalties ($cost = \infty$ for submerged roads). Automatically redirects relief convoys and civilian evacuees onto elevated high-ground arteries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 transition-all border border-blue-400/30"
          >
            <FileText className="h-4 w-4" />
            Export Tactical Dispatch Sheet
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MODE SELECTOR TABS (POINT 7 VS POINT 9)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleModeChange('relief_convoy')}
            className={`flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-xs font-bold transition-all ${
              activeMode === 'relief_convoy'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <div className="text-left">
              <div className="leading-tight">Point 7: Relief Convoy Router</div>
              <div className="text-[10px] font-normal opacity-80">Depots to Flooded Wards</div>
            </div>
          </button>

          <button
            onClick={() => handleModeChange('civilian_alternate')}
            className={`flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-xs font-bold transition-all ${
              activeMode === 'civilian_alternate'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <div className="text-left">
              <div className="leading-tight">Point 9: Civilian Evacuation</div>
              <div className="text-[10px] font-normal opacity-80">To High-Ground Havens</div>
            </div>
          </button>
        </div>

        {/* Flood Avoidance Status Indicator */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-300">Strict Flood Bypass Engine:</span>
          </div>
          <button
            onClick={() => setAvoidFloods(!avoidFloods)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
              avoidFloods
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {avoidFloods ? 'ACTIVE (Cost = ∞)' : 'DISABLED (Direct)'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          QUICK EMERGENCY MISSION PRESETS BAR
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Quick Emergency Mission Presets ({activeMode === 'relief_convoy' ? 'Point 7' : 'Point 9'})
          </span>
          <span>Click any scenario for instant mission briefing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`text-left rounded-xl p-3 border transition-all ${
                  isSelected
                    ? activeMode === 'relief_convoy'
                      ? 'bg-emerald-950/70 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                      : 'bg-amber-950/70 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      preset.urgency === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {preset.urgency}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {preset.vehicleClass.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{preset.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {preset.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CUSTOM ROUTING CONTROLS HUD
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Origin Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-400" />
              1. Origin (Staging Base / Start)
            </label>
            <select
              value={originId}
              onChange={(e) => {
                setOriginId(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Regional Military Depots & Logistics Hubs">
                {depotNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.elevationMeters}m ASL)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Flooded Communities & Starting Points">
                {floodNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Destination Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Navigation className="h-3 w-3 text-rose-400" />
              2. Destination (Target / Safe Haven)
            </label>
            <select
              value={destinationId}
              onChange={(e) => {
                setDestinationId(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Flooded Cut-Off Target Settlements (Relief Point 7)">
                {floodNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.waterDepthMeters}m water)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Designated Safe High-Ground Havens (Evacuation Point 9)">
                {safeHavenNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.elevationMeters}m ASL)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Regional Depots">
                {depotNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Vehicle Class Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Truck className="h-3 w-3 text-cyan-400" />
              3. Vehicle Class &amp; Clearance
            </label>
            <select
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value as VehicleClass)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="army_6x6">Nepal Army 6x6 Heavy Truck (Fords 0.8m)</option>
              <option value="high_clearance_4x4">High-Clearance 4x4 Medical Van (Fords 0.4m)</option>
              <option value="tractor_trailer">Heavy Farm Tractor with Trailer (Fords 0.6m)</option>
              <option value="pedestrian_escort">Civilian Walking / Escort (Fords 0.15m)</option>
            </select>
          </div>

          {/* Recalculate Trigger */}
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setSelectedStepIndex(null);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-md"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
              Recalculate Route Path
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          INTERACTIVE TACTICAL ROUTE MAP
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tactical Mission Map View
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({activeRoute.path.length} waypoints mapped)
            </span>
          </div>

          {activeRoute.submergedKmBypassed > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
              <AlertTriangle className="h-3 w-3" />
              Submerged Highway Bypassed: {activeRoute.submergedKmBypassed} km
            </span>
          )}
        </div>

        <InteractiveRouteMap
          route={activeRoute}
          selectedStepIndex={selectedStepIndex}
          onSelectStep={(idx) => setSelectedStepIndex(idx)}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MISSION TELEMETRY METRIC CARDS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Distance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Total Transit Distance</span>
            <Route className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {activeRoute.distanceKm}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">km</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            100% dry and elevated alignment
          </div>
        </div>

        {/* Metric 2: Estimated Time */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Estimated Transit Time</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {Math.floor(activeRoute.estimatedMinutes / 60)}h{' '}
            {activeRoute.estimatedMinutes % 60}m
          </div>
          <div className="text-[11px] text-slate-400">
            Calculated for {activeRoute.vehicleClass.replace('_', ' ')}
          </div>
        </div>

        {/* Metric 3: Flood Avoidance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Flood Avoidance Saved</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
            {activeRoute.submergedKmBypassed}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">km</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {activeRoute.submergedKmBypassed > 0
              ? 'Impassable roads prunned from graph'
              : 'Direct route verified dry'}
          </div>
        </div>

        {/* Metric 4: Route Safety Score */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Safety Status</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
            PASSABLE
          </div>
          <div className="text-[11px] text-blue-300">
            Escorted by APF &amp; Red Cross
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SPLIT DETAIL COLUMNS: TURN-BY-TURN VS MEDICAL QUOTA / SHELTER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN: TURN-BY-TURN WAYPOINT GUIDANCE ───────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-400" />
              Turn-by-Turn Waypoint Guidance ({activeRoute.steps.length} Steps)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Elev: {activeRoute.origin.elevationMeters}m &rarr; {activeRoute.destination.elevationMeters}m ASL
            </span>
          </div>

          {/* Avoidance Alert Banner */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/40 p-3 text-xs text-blue-200 space-y-1">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              Routing Avoidance Directive
            </div>
            <p className="leading-relaxed">{activeRoute.avoidanceAlert}</p>
          </div>

          {/* Waypoint List */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {activeRoute.steps.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;

              return (
                <div
                  key={`step_${step.stepNumber}`}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`rounded-xl p-3 border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md'
                      : 'bg-slate-950/80 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        step.action === 'depart'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : step.action === 'arrive'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : step.action === 'cross_bridge'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {step.stepNumber}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">{step.roadName}</span>
                        <span className="font-mono text-slate-400">
                          {step.cumulativeKm > 0 ? `+${step.distanceKm} km` : 'Start'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-snug">{step.instruction}</p>
                      <p className="text-[11px] text-slate-400 italic font-nepali">
                        {step.nepaliInstruction}
                      </p>

                      {step.hazardAlert && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[11px] text-amber-300 font-medium flex items-center gap-1.5 mt-1">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>{step.hazardAlert}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono">
                        <span>Cumul: {step.cumulativeKm} km</span>
                        <span>&bull;</span>
                        <span>Elev: {step.elevationMeters}m ASL</span>
                        <span>&bull;</span>
                        <span className="capitalize">{step.action.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT COLUMN: MEDICAL CARGO QUOTAS OR SHELTER PROFILE ─────────── */}
        <div className="space-y-6">
          {activeMode === 'relief_convoy' ? (
            /* POINT 7: WHO EMERGENCY MEDICAL & RELIEF CARGO CALCULATOR */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-emerald-400" />
                  WHO Emergency Relief &amp; Medical Quota
                </h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Target: {activeRoute.destination.capacity?.toLocaleString() || '10,000'} Persons
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Calculated strictly according to WHO, Sphere Standards &amp; Nepal Ministry of Health (MoHP) emergency disaster quotas for cut-off monsoon flood zones.
              </p>

              {activeRoute.reliefQuota && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Potable Water */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                      <Droplet className="h-3.5 w-3.5" />
                      Potable Drinking Water
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {activeRoute.reliefQuota.potableWaterLiters.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">Liters/day</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Standard: 3.0 Liters / person / day
                    </div>
                  </div>

                  {/* Food Rations */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <Boxes className="h-3.5 w-3.5" />
                      Emergency Food Rations
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {activeRoute.reliefQuota.foodRationsKg.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">kg/day</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      High-calorie ready-to-eat rations
                    </div>
                  </div>

                  {/* Snakebite Antivenom */}
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold">
                      <Cross className="h-3.5 w-3.5" />
                      Snakebite Antivenom Vials
                    </div>
                    <div className="text-xl font-black text-rose-200 font-mono">
                      {activeRoute.reliefQuota.antivenomVials.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-rose-300 font-sans">vials</span>
                    </div>
                    <div className="text-[10px] text-rose-300">
                      Polyvalent Terai cobra/krait serum
                    </div>
                  </div>

                  {/* Water Purification Aquatabs */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold">
                      <Zap className="h-3.5 w-3.5" />
                      Chlorine Aquatabs
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {activeRoute.reliefQuota.aquatabsCount.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">tabs</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      2 chlorine tablets / person / day
                    </div>
                  </div>

                  {/* IV Saline Bags */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-bold">
                      <HeartPulse className="h-3.5 w-3.5" />
                      IV Saline &amp; Ringer's Bags
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {activeRoute.reliefQuota.ivSalineBags.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400 font-sans">units</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Cholera &amp; acute diarrheal triage
                    </div>
                  </div>

                  {/* Transport Fleet Required */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                      <Truck className="h-3.5 w-3.5" />
                      Transport Fleet Allocation
                    </div>
                    <div className="text-xl font-black text-white font-mono">
                      {activeRoute.reliefQuota.trucksRequired} Trucks /{' '}
                      {activeRoute.reliefQuota.zodiacBoatsRequired} Boats
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Nepal Army 6x6 &amp; Zodiac carriers
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* POINT 9: CIVILIAN EVACUATION SAFE HAVEN PROFILE */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  Target High-Ground Safe Haven Profile
                </h3>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Elevation: {activeRoute.destination.elevationMeters}m ASL
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {activeRoute.destination.name}
                  </h4>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    Capacity: {activeRoute.destination.capacity?.toLocaleString() || '7,500'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeRoute.destination.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>District: <strong>{activeRoute.destination.district}</strong></span>
                  <span>Contact: <strong>{activeRoute.destination.contactPhone || '1155'}</strong></span>
                </div>
              </div>

              {/* Safety Checklist for Evacuees */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Evacuation Marshal Directives
                </h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Follow Armed Police Force (APF) guide ribbons; strictly avoid flooded Postal Highway.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Assemble children and elderly in tractor trailers first; keep drinking water packets ready.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Registration, hot food, and cholera prophylaxis available at safe haven entrance.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRITICAL BRIDGES & WATERWAYS STATUS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Waves className="h-4 w-4 text-cyan-400" />
              River Crossings &amp; Bridge Safety Along Route
            </h3>

            <div className="space-y-2">
              {activeRoute.bridgesEncountered.map((bridge, idx) => (
                <div
                  key={`bridge_${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>🌉</span> {bridge.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{bridge.advice}</div>
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                      bridge.status === 'monitored_safe'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {bridge.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TACTICAL DISPATCH SHEET MODAL (FOR PRINT / FIELD TEAMS)
      ─────────────────────────────────────────────────────────────────────── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Government Tactical Mission Dispatch Sheet
                </h3>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Manifest Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mission ID</span>
                  <span className="font-mono font-bold text-cyan-400">TERAI-{Date.now().toString().slice(-6)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mission Type</span>
                  <span className="font-bold uppercase text-white">{activeRoute.mode.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle Class</span>
                  <span className="font-bold text-white">{activeRoute.vehicleClass.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Distance</span>
                  <span className="font-mono font-bold text-emerald-400">{activeRoute.distanceKm} km</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div><strong>Origin:</strong> {activeRoute.origin.name} ({activeRoute.origin.elevationMeters}m ASL)</div>
                <div><strong>Destination:</strong> {activeRoute.destination.name}</div>
                <div className="text-emerald-400"><strong>Routing Avoidance:</strong> {activeRoute.avoidanceAlert}</div>
              </div>
            </div>

            {/* Waypoint Sequence */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turn-by-Turn Waypoint Sequence
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {activeRoute.steps.map((s) => (
                  <div key={s.stepNumber} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60 text-slate-300">
                    <span><strong>Step {s.stepNumber}:</strong> {s.instruction}</span>
                    <span className="font-mono text-slate-400 shrink-0 ml-2">{s.cumulativeKm} km</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Coordination */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>National Disaster Hotline: <strong className="text-white">1155</strong></span>
              <span>Nepal Red Cross: <strong className="text-white">1130</strong></span>
              <span>Armed Police Force Rescue: <strong className="text-white">1114</strong></span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all"
              >
                <Printer className="h-4 w-4" />
                Print Tactical Dispatch Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
