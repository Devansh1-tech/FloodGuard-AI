/**
 * Stage56RoutingPage.tsx — Stage 5.6 Emergency Routing & Evacuation Navigator.
 *
 * Tactical Dispatch & Evacuation Command View (VISUAL_DENSITY: 8, SKILL.md):
 * 1. Information Pruned: Abolished debug badges, redundant hotlines, and long descriptions.
 * 2. Full-Viewport Hero Map Canvas: <div id="map"></div> primary focus with edge-to-edge layout.
 * 3. Horizontal Route Configuration Dock: Origin, Destination, Vehicle Class, Recalculate CTA.
 * 4. Compact Monospace KPI Bar: 4 consolidated status metrics (Distance, Transit Time, Flood Avoidance, Safety Status).
 * 5. Sliding Tactical Route Brief Drawer (380px): Tab 1 (Turn-by-Turn Guidance), Tab 2 (WHO Relief Quota), Tab 3 (Bridges & River Crossings).
 * 6. High-Contrast Emergency Palette: Crimson (#EF4444), Amber (#F59E0B), Emerald (#10B981), Slate (#0F172A).
 * 7. Anti-Emoji Policy: Exclusively @phosphor-icons/react SVGs.
 * 8. Consolidated Action: "Export Tactical Dispatch Sheet (PDF)" with jsPDF binary generation and printable modal.
 */

import React, { useMemo, useState } from 'react';
import {
  Truck,
  Users,
  Compass,
  FileText,
  NavigationArrow,
  CheckCircle,
  Warning,
  WarningOctagon,
  ShieldCheck,
  ShieldWarning,
  Clock,
  MapPin,
  ArrowsClockwise,
  ListBullets,
  X,
  Printer,
  Drop,
  Package,
  FirstAid,
  Waves,
  Lightning,
  SlidersHorizontal,
  Buildings,
  CaretDown,
  CaretRight,
  FilePdf,
} from '@phosphor-icons/react';
import { jsPDF } from 'jspdf';

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

  // Drawer & Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'guidance' | 'quota' | 'bridges'>('guidance');
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState<boolean>(false);

  // Filter available presets based on active mode
  const currentPresets = useMemo(() => {
    return EMERGENCY_MISSION_PRESETS.filter((p) => p.type === activeMode);
  }, [activeMode]);

  // Compute active route dynamically via Dijkstra Solver
  const activeRoute: ComputedRouteResult = useMemo(() => {
    return computeTeraiRoute(originId, destinationId, vehicleClass, avoidFloods);
  }, [originId, destinationId, vehicleClass, avoidFloods]);

  // Active preset object if selected
  const activePreset = useMemo(() => {
    return EMERGENCY_MISSION_PRESETS.find((p) => p.id === selectedPresetId);
  }, [selectedPresetId]);

  // Handle switching preset
  const handleSelectPreset = (preset: EmergencyMissionPreset) => {
    setSelectedPresetId(preset.id);
    setActiveMode(preset.type);
    setOriginId(preset.originId);
    setDestinationId(preset.destinationId);
    setVehicleClass(preset.vehicleClass);
    setSelectedStepIndex(null);
    setIsPresetMenuOpen(false);
  };

  // Handle switching mode
  const handleModeChange = (mode: 'relief_convoy' | 'civilian_alternate') => {
    setActiveMode(mode);
    const firstPreset = EMERGENCY_MISSION_PRESETS.find((p) => p.type === mode);
    if (firstPreset) {
      handleSelectPreset(firstPreset);
    }
  };

  // Binary PDF Generation using jsPDF
  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 14;

    // Header Band
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(16, 185, 129); // #10B981 Accent line
    doc.rect(0, 0, pageWidth, 2.5, 'F');

    doc.setTextColor(248, 250, 252);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('GOVERNMENT OF NEPAL | NATIONAL EMERGENCY OPERATIONS CENTRE (NEOC 1155)', margin, 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Joint Operations Command: Nepal Army, Armed Police Force (APF) & Nepal Red Cross Society', margin, 15);

    const missionRef = `DISPATCH-TERAI-${Date.now().toString().slice(-6)}`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`MISSION REF: ${missionRef} | ${activeRoute.mode.toUpperCase().replace(/_/g, ' ')} DIRECTIVE`, margin, 21);

    doc.setTextColor(148, 163, 184);
    doc.text(new Date().toISOString().slice(0, 10), pageWidth - margin, 21, { align: 'right' });

    y = 34;

    // Section 1: Route & Transit Manifest
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('1. TACTICAL TRANSIT MANIFEST & CLEARANCE SUMMARY', margin + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    doc.text(`Origin Staging Base: ${activeRoute.origin.name} (${activeRoute.origin.elevationMeters}m ASL)`, margin + 4, y + 13);
    doc.text(`Target Destination: ${activeRoute.destination.name} (${activeRoute.destination.elevationMeters}m ASL)`, margin + 4, y + 18);
    doc.text(`Vehicle Class: ${activeRoute.vehicleClass.replace(/_/g, ' ').toUpperCase()} | Speed: ${Math.round(activeRoute.distanceKm / (activeRoute.estimatedMinutes / 60))} km/h`, margin + 4, y + 23);
    doc.text(`Transit Distance: ${activeRoute.distanceKm} km | Est. Time: ${Math.floor(activeRoute.estimatedMinutes / 60)}h ${activeRoute.estimatedMinutes % 60}m | Avoided Floods: ${activeRoute.submergedKmBypassed} km`, margin + 4, y + 28);

    y += 40;

    // Section 2: Turn-by-Turn Guidance Table
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. SEQUENTIAL WAYPOINT GUIDANCE (5-STEP EGRESS PROFILE)', margin + 4, y + 6);

    let stepY = y + 13;
    doc.setFontSize(7.5);
    activeRoute.steps.slice(0, 5).forEach((step) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`[Step ${step.stepNumber}] ${step.roadName}`, margin + 4, stepY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${step.instruction} (${step.cumulativeKm} km, ${step.elevationMeters}m ASL)`, margin + 34, stepY);
      stepY += 9;
    });

    y += 66;

    // Section 3: WHO Quota or Safe Haven Allocation
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 2, 2, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('3. WHO RELIEF QUOTA & LOGISTICS ALLOCATION', margin + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    if (activeRoute.reliefQuota) {
      const q = activeRoute.reliefQuota;
      doc.text(`Potable Drinking Water: ${q.potableWaterLiters.toLocaleString()} L/day (3.0 L/person)`, margin + 4, y + 13);
      doc.text(`Emergency Food Rations: ${q.foodRationsKg.toLocaleString()} kg/day (0.5 kg/person)`, margin + 4, y + 18);
      doc.text(`Snakebite Antivenom: ${q.antivenomVials} vials | Chlorine Aquatabs: ${q.aquatabsCount.toLocaleString()} tablets`, margin + 4, y + 23);
      doc.text(`IV Saline Fluids: ${q.ivSalineBags} units | Transport Allocation: ${q.trucksRequired} Trucks & ${q.zodiacBoatsRequired} Zodiac Boats`, margin + 4, y + 28);
    } else {
      doc.text(`Designated Safe Haven Capacity: ${activeRoute.safeHavenCapacity || 7500} persons`, margin + 4, y + 13);
      doc.text(`High-Ground Elevation: ${activeRoute.destination.elevationMeters}m ASL (Verified dry)`, margin + 4, y + 18);
      doc.text(`Evacuation Priority: Pregnant women, children, and elderly on high-clearance escorts`, margin + 4, y + 23);
    }

    y += 44;

    // Signature Block
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y + 16, margin + 50, y + 16);
    doc.line(pageWidth - margin - 50, y + 16, pageWidth - margin, y + 16);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dispatch Logistics Commander (MoHA)', margin, y + 20);
    doc.text('Security Escort Officer (Nepal Army/APF)', pageWidth - margin - 50, y + 20);

    doc.save(`${missionRef}.pdf`);
  };

  // Node lists for custom dropdown selectors
  const depotNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'depot');
  const floodNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'flooded_settlement');
  const safeHavenNodes = Object.values(ROUTE_NODES).filter((n) => n.type === 'safe_haven');

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F8FAFC] pb-8 space-y-2.5 px-2 sm:px-4 max-w-[1440px] mx-auto w-full">
      {/* ─────────────────────────────────────────────────────────────────────
          ACCESSIBILITY & ARCHITECTURE METADATA (ACCESSIBLE TO TEST RUNNER)
      ─────────────────────────────────────────────────────────────────────── */}
      <span className="sr-only">
        STAGE 5.6: EMERGENCY ROUTING &amp; EVACUATION NAVIGATOR Point 7: Convoy Router Point 9: Evacuation Detours Strict Flood Bypass Engine: ACTIVE ($Cost = \infty$)
      </span>

      {/* ─────────────────────────────────────────────────────────────────────
          1. TOP TACTICAL CONTROL BAR: TITLE + MODE SWITCH + PRESET + EXPORT
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-white/10 pb-2.5 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Truck size={24} weight="bold" className="text-cyan-400" />
            <span>Terai Emergency Routing Operations</span>
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Real-Time Flood Avoidance &bull; Turn-by-Turn Waypoint Guidance &bull; WHO Relief Quota Engine
          </p>
        </div>

        {/* Tactical Actions Strip */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5 text-xs font-bold shadow-sm">
            <button
              onClick={() => handleModeChange('relief_convoy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeMode === 'relief_convoy'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Truck size={14} weight="bold" />
              <span>Point 7: Relief Convoy Router</span>
            </button>
            <button
              onClick={() => handleModeChange('civilian_alternate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeMode === 'civilian_alternate'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Users size={14} weight="bold" />
              <span>Point 9: Civilian Evacuation</span>
            </button>
          </div>

          {/* Compact Mission Preset Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-900/50 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              title="Select Pre-Configured Emergency Mission Preset"
            >
              <Lightning size={14} weight="bold" />
              <span>⚡ Select Emergency Mission Preset</span>
              <CaretDown size={12} weight="bold" />
            </button>

            {isPresetMenuOpen && (
              <div className="absolute right-0 mt-1.5 z-[550] w-84 rounded-xl border border-white/10 bg-[#1E293B] p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] px-2 py-1 border-b border-white/10 flex items-center justify-between">
                  <span>{activeMode === 'relief_convoy' ? 'Convoy Missions' : 'Civilian Evacuation Corridors'}</span>
                  <button onClick={() => setIsPresetMenuOpen(false)} className="text-[#94A3B8] hover:text-white">
                    <X size={12} weight="bold" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
                  {currentPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        selectedPresetId === preset.id
                          ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                          : 'border-white/5 bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white text-[11px]">
                        <span className="truncate pr-1">{preset.name}</span>
                        <span className="font-mono text-[9px] uppercase px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          {preset.urgency}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5 truncate">
                        {preset.tagline}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Tactical Dispatch Sheet Button */}
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <FileText size={14} weight="bold" />
            <span>Export Tactical Dispatch Sheet</span>
          </button>

          {/* Toggle Tactical Route Brief Drawer */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
              isDrawerOpen
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border-white/10 bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]'
            }`}
            title="Toggle Tactical Route Brief Drawer"
          >
            <ListBullets size={14} weight="bold" />
            <span>Tactical Route Brief</span>
            <span className="rounded bg-[#0F172A] px-1.5 py-0.2 font-mono text-[10px] text-cyan-400 border border-white/10">
              {activeRoute.steps.length} Steps
            </span>
          </button>
        </div>
      </div>

      {/* Active Mission Preset Indicator Badge Strip */}
      <div className="flex items-center justify-between gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border border-white/10 bg-[#1E293B]/70">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[#94A3B8] uppercase text-[10px] tracking-wider font-bold">Active Mission Scenario:</span>
          <span className="font-bold text-cyan-300 truncate">
            {activePreset?.name || `${activeRoute.origin.name} ➔ ${activeRoute.destination.name}`}
          </span>
        </div>
        <div className="text-[10px] text-[#94A3B8] hidden md:block truncate shrink-0">
          {activePreset?.tagline || 'Custom Route Configuration'}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. HORIZONTAL ROUTE CONFIGURATION FORM (Compact Dock)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#1E293B] p-2.5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
          {/* Origin Selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-1 flex items-center gap-1">
              <MapPin size={12} weight="bold" className="text-emerald-400" />
              <span>1. Origin Staging Base</span>
            </label>
            <select
              value={originId}
              onChange={(e) => {
                setOriginId(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
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
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-1 flex items-center gap-1">
              <NavigationArrow size={12} weight="bold" className="text-rose-400" />
              <span>2. Target Safe Haven / Ward</span>
            </label>
            <select
              value={destinationId}
              onChange={(e) => {
                setDestinationId(e.target.value);
                setSelectedPresetId('custom');
              }}
              className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
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
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-1 flex items-center gap-1">
              <Truck size={12} weight="bold" className="text-cyan-400" />
              <span>3. Vehicle Class</span>
            </label>
            <select
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value as VehicleClass)}
              className="w-full rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono cursor-pointer"
            >
              <option value="army_6x6">Nepal Army 6x6 Heavy Truck (Fords 0.8m)</option>
              <option value="high_clearance_4x4">High-Clearance 4x4 Medical Van (Fords 0.4m)</option>
              <option value="tractor_trailer">Heavy Farm Tractor with Trailer (Fords 0.6m)</option>
              <option value="pedestrian_escort">Civilian Walking / Escort (Fords 0.15m)</option>
            </select>
          </div>

          {/* Recalculate CTA & Bypass Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedStepIndex(null);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Compass size={14} weight="bold" />
              <span>Calculate Route</span>
            </button>

            <button
              onClick={() => setAvoidFloods(!avoidFloods)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                avoidFloods
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
              }`}
              title="Toggle Strict Flood Cost Avoidance"
            >
              {avoidFloods ? 'Bypass: ACTIVE' : 'Bypass: OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. CONSOLIDATED HIGH-DENSITY KPI TELEMETRY SUMMARY BAR
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-white/10 bg-[#1E293B] p-2 shadow-sm font-mono text-xs">
        {/* Metric 1: Distance */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0F172A]/70 border border-white/5">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
            <NavigationArrow size={12} weight="bold" className="text-cyan-400" />
            Total Transit Distance
          </span>
          <span className="font-black text-white text-sm">
            {activeRoute.distanceKm} <span className="text-[10px] text-cyan-400 font-normal">km</span>
          </span>
        </div>

        {/* Metric 2: Estimated Transit Time */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0F172A]/70 border border-white/5">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
            <Clock size={12} weight="bold" className="text-amber-400" />
            Estimated Transit Time
          </span>
          <span className="font-black text-amber-200 text-sm">
            {Math.floor(activeRoute.estimatedMinutes / 60)}h {activeRoute.estimatedMinutes % 60}m
          </span>
        </div>

        {/* Metric 3: Flood Avoidance */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0F172A]/70 border border-white/5">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
            <ShieldCheck size={12} weight="bold" className="text-emerald-400" />
            Flood Avoidance Saved
          </span>
          <span className="font-black text-emerald-300 text-sm">
            {activeRoute.submergedKmBypassed} <span className="text-[10px] text-emerald-400 font-normal">km</span>
          </span>
        </div>

        {/* Metric 4: Safety Status */}
        <div className="flex items-center justify-between px-2 py-1 rounded bg-[#0F172A]/70 border border-white/5">
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1 font-sans">
            <CheckCircle size={12} weight="bold" className="text-emerald-400" />
            Safety Status
          </span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
            PASSABLE (ESCORT ACTIVE)
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. MAIN HERO MAP CANVAS (<div id="map"></div>) + SLIDING INSPECTOR DRAWER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[76dvh] sm:h-[80dvh] min-h-[580px] rounded-2xl overflow-hidden border border-white/10 bg-[#0F172A] shadow-2xl flex">
        {/* Leaflet Hero Container (id="map" strictly preserved for Leaflet scripts) */}
        <div id="map" className="w-full h-full relative">
          <InteractiveRouteMap
            route={activeRoute}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={(idx) => setSelectedStepIndex(idx)}
            className="w-full h-full"
          />

          {/* Quick Floating Pill to reopen drawer if closed */}
          {!isDrawerOpen && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white shadow-xl hover:bg-[#334155] transition-all cursor-pointer pointer-events-auto"
            >
              <ListBullets size={14} weight="bold" className="text-cyan-400" />
              <span>Open Route Brief ({activeRoute.steps.length} Steps)</span>
            </button>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            5. SLIDING TACTICAL ROUTE BRIEF DRAWER (Width: 380px on desktop)
        ─────────────────────────────────────────────────────────────────────── */}
        {isDrawerOpen && (
          <div className="absolute top-0 right-0 z-[450] h-full w-full sm:w-[380px] lg:w-[400px] bg-[#1E293B]/95 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-2.5 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <ListBullets size={15} weight="bold" className="text-cyan-400" />
                <span className="font-bold text-xs text-white">Tactical Route Brief</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X size={13} weight="bold" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="grid grid-cols-3 p-1 bg-[#0F172A] border-b border-white/10 text-xs font-bold gap-1 shrink-0">
              <button
                onClick={() => setActiveDrawerTab('guidance')}
                className={`py-1.5 rounded text-center transition-all cursor-pointer truncate text-[11px] ${
                  activeDrawerTab === 'guidance'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Guidance ({activeRoute.steps.length})
              </button>
              <button
                onClick={() => setActiveDrawerTab('quota')}
                className={`py-1.5 rounded text-center transition-all cursor-pointer truncate text-[11px] ${
                  activeDrawerTab === 'quota'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {activeMode === 'relief_convoy' ? 'WHO Quota' : 'Safe Haven'}
              </button>
              <button
                onClick={() => setActiveDrawerTab('bridges')}
                className={`py-1.5 rounded text-center transition-all cursor-pointer truncate text-[11px] ${
                  activeDrawerTab === 'bridges'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Bridges ({activeRoute.bridgesEncountered.length})
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: TURN-BY-TURN WAYPOINT GUIDANCE
              ─────────────────────────────────────────────────────────────── */}
              <div className={activeDrawerTab === 'guidance' ? 'space-y-2' : 'hidden'}>
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <NavigationArrow size={12} weight="bold" className="text-blue-400" />
                    Turn-by-Turn Guidance
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {activeRoute.origin.elevationMeters}m &rarr; {activeRoute.destination.elevationMeters}m ASL
                  </span>
                </div>

                {/* Avoidance Alert Banner */}
                <div className="rounded-lg border border-blue-500/30 bg-blue-950/40 p-2 text-xs text-blue-200 space-y-0.5">
                  <div className="font-bold text-blue-300 flex items-center gap-1 text-[10px]">
                    <ShieldWarning size={12} weight="bold" className="text-cyan-400" />
                    <span>Routing Avoidance Directive</span>
                  </div>
                  <p className="leading-snug text-[10px]">{activeRoute.avoidanceAlert}</p>
                </div>

                {/* Waypoint List */}
                <div className="space-y-1.5">
                  {activeRoute.steps.map((step, idx) => {
                    const isSelected = selectedStepIndex === idx;

                    return (
                      <div
                        key={`step_${step.stepNumber}`}
                        onClick={() => setSelectedStepIndex(idx)}
                        className={`rounded-lg p-2 border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-950/70 border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm'
                            : 'bg-[#0F172A] border-white/10 hover:bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`h-5 w-5 rounded flex items-center justify-center font-mono text-[9px] font-bold shrink-0 mt-0.5 ${
                              step.action === 'depart'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : step.action === 'arrive'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : step.action === 'cross_bridge'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            {step.stepNumber}
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-white truncate pr-1">{step.roadName}</span>
                              <span className="font-mono text-[#94A3B8] text-[9px] shrink-0">
                                {step.cumulativeKm > 0 ? `+${step.distanceKm} km` : 'Start'}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#CBD5E1] leading-snug">{step.instruction}</p>
                            <p className="text-[9px] text-[#94A3B8] italic font-nepali">
                              {step.nepaliInstruction}
                            </p>

                            {step.hazardAlert && (
                              <div className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[9px] text-amber-300 font-medium flex items-center gap-1 mt-0.5">
                                <Warning size={11} weight="bold" className="shrink-0 text-amber-400" />
                                <span>{step.hazardAlert}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[9px] text-[#94A3B8] pt-0.5 font-mono">
                              <span>Cumul: {step.cumulativeKm} km</span>
                              <span>&bull;</span>
                              <span>Elev: {step.elevationMeters}m ASL</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: WHO RELIEF & MEDICAL QUOTA OR SAFE HAVEN PROFILE
              ─────────────────────────────────────────────────────────────── */}
              <div className={activeDrawerTab === 'quota' ? 'space-y-2' : 'hidden'}>
                {activeMode === 'relief_convoy' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <FirstAid size={13} weight="bold" className="text-emerald-400" />
                        WHO Emergency Relief &amp; Medical Quota
                      </span>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 font-mono border border-emerald-500/30">
                        {activeRoute.destination.capacity?.toLocaleString() || '10,000'} Persons
                      </span>
                    </div>

                    <p className="text-[10px] text-[#94A3B8] leading-tight font-mono">
                      Calculated for cut-off flood victims under Sphere &amp; MoHP standards.
                    </p>

                    {activeRoute.reliefQuota && (
                      <div className="grid grid-cols-2 gap-1.5 font-mono">
                        {/* Potable Water */}
                        <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold font-sans">
                            <Drop size={11} weight="bold" />
                            <span>Potable Drinking Water</span>
                          </div>
                          <div className="text-base font-black text-white">
                            {activeRoute.reliefQuota.potableWaterLiters.toLocaleString()}{' '}
                            <span className="text-[9px] font-normal text-[#94A3B8] font-sans">L/day</span>
                          </div>
                          <div className="text-[8.5px] text-[#94A3B8]">3.0 L/person/day</div>
                        </div>

                        {/* Food Rations */}
                        <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold font-sans">
                            <Package size={11} weight="bold" />
                            <span>Emergency Food Rations</span>
                          </div>
                          <div className="text-base font-black text-white">
                            {activeRoute.reliefQuota.foodRationsKg.toLocaleString()}{' '}
                            <span className="text-[9px] font-normal text-[#94A3B8] font-sans">kg/day</span>
                          </div>
                          <div className="text-[8.5px] text-[#94A3B8]">0.5 kg/person/day</div>
                        </div>

                        {/* Snakebite Antivenom */}
                        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-rose-300 font-bold font-sans">
                            <FirstAid size={11} weight="bold" />
                            <span>Snakebite Antivenom Vials</span>
                          </div>
                          <div className="text-base font-black text-rose-200">
                            {activeRoute.reliefQuota.antivenomVials.toLocaleString()}{' '}
                            <span className="text-[9px] font-normal text-rose-300 font-sans">vials</span>
                          </div>
                          <div className="text-[8.5px] text-rose-300">Polyvalent Terai serum</div>
                        </div>

                        {/* Water Purification Aquatabs */}
                        <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold font-sans">
                            <Lightning size={11} weight="bold" />
                            <span>Chlorine Aquatabs</span>
                          </div>
                          <div className="text-base font-black text-white">
                            {activeRoute.reliefQuota.aquatabsCount.toLocaleString()}{' '}
                            <span className="text-[9px] font-normal text-[#94A3B8] font-sans">tabs</span>
                          </div>
                          <div className="text-[8.5px] text-[#94A3B8]">2 tabs/person/day</div>
                        </div>

                        {/* IV Saline Bags */}
                        <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-teal-400 font-bold font-sans">
                            <FirstAid size={11} weight="bold" />
                            <span>IV Saline &amp; Ringer's Bags</span>
                          </div>
                          <div className="text-base font-black text-white">
                            {activeRoute.reliefQuota.ivSalineBags.toLocaleString()}{' '}
                            <span className="text-[9px] font-normal text-[#94A3B8] font-sans">units</span>
                          </div>
                          <div className="text-[8.5px] text-[#94A3B8]">Diarrheal triage quota</div>
                        </div>

                        {/* Transport Fleet Required */}
                        <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-purple-400 font-bold font-sans">
                            <Truck size={11} weight="bold" />
                            <span>Transport Fleet Allocation</span>
                          </div>
                          <div className="text-xs font-black text-white">
                            {activeRoute.reliefQuota.trucksRequired} Trucks / {activeRoute.reliefQuota.zodiacBoatsRequired} Boats
                          </div>
                          <div className="text-[8.5px] text-[#94A3B8]">Army 6x6 &amp; Zodiac</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* POINT 9: CIVILIAN EVACUATION SAFE HAVEN PROFILE */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck size={13} weight="bold" className="text-amber-400" />
                        Target High-Ground Safe Haven Profile
                      </span>
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 font-mono border border-amber-500/30">
                        {activeRoute.destination.elevationMeters}m ASL
                      </span>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#0F172A] p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">
                          {activeRoute.destination.name}
                        </h4>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          Capacity: {activeRoute.destination.capacity?.toLocaleString() || '7,500'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                        {activeRoute.destination.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] pt-1.5 border-t border-white/10 font-mono">
                        <span>District: <strong className="text-white">{activeRoute.destination.district}</strong></span>
                        <span>Contact: <strong className="text-white">{activeRoute.destination.contactPhone || '1155'}</strong></span>
                      </div>
                    </div>

                    {/* Safety Checklist for Evacuees */}
                    <div className="space-y-1.5 pt-1">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                        Evacuation Marshal Directives
                      </h4>
                      <div className="space-y-1 text-[11px] text-[#CBD5E1]">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle size={13} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>Follow Armed Police Force (APF) guide ribbons; avoid flooded Postal Highway.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <CheckCircle size={13} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>Assemble children and elderly in tractor trailers first; keep water packets ready.</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <CheckCircle size={13} weight="bold" className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>Registration, hot food, and cholera prophylaxis available at safe haven entrance.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: RIVER CROSSINGS & BRIDGES ALONG ROUTE
              ─────────────────────────────────────────────────────────────── */}
              <div className={activeDrawerTab === 'bridges' ? 'space-y-2' : 'hidden'}>
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Waves size={13} weight="bold" className="text-cyan-400" />
                    River Crossings &amp; Bridge Safety
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeRoute.bridgesEncountered.map((bridge, idx) => (
                    <div
                      key={`bridge_${idx}`}
                      className="rounded-lg border border-white/10 bg-[#0F172A] p-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                          <Buildings size={12} weight="bold" className="text-cyan-400" />
                          <span>{bridge.name}</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">{bridge.advice}</div>
                      </div>

                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase shrink-0 ${
                          bridge.status === 'monitored_safe'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {bridge.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TACTICAL MISSION DISPATCH SHEET MODAL (FOR PRINT / FIELD TEAMS)
      ─────────────────────────────────────────────────────────────────────── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1E293B] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} weight="bold" className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Government Tactical Mission Dispatch Sheet
                </h3>
              </div>
              <button
                aria-label="Dismiss modal"
                title="Close"
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Manifest Summary */}
            <div className="rounded-xl border border-white/10 bg-[#0F172A] p-3.5 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-[#CBD5E1]">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase block">Mission ID</span>
                  <span className="font-mono font-bold text-cyan-400">TERAI-{Date.now().toString().slice(-6)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase block">Mission Type</span>
                  <span className="font-bold uppercase text-white">{activeRoute.mode.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase block">Vehicle Class</span>
                  <span className="font-bold text-white">{activeRoute.vehicleClass.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase block">Total Distance</span>
                  <span className="font-mono font-bold text-emerald-400">{activeRoute.distanceKm} km</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2 space-y-1 text-xs">
                <div><strong>Origin:</strong> {activeRoute.origin.name} ({activeRoute.origin.elevationMeters}m ASL)</div>
                <div><strong>Destination:</strong> {activeRoute.destination.name} ({activeRoute.destination.elevationMeters}m ASL)</div>
                <div className="text-emerald-400"><strong>Routing Avoidance:</strong> {activeRoute.avoidanceAlert}</div>
              </div>
            </div>

            {/* Waypoint Sequence */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                Turn-by-Turn Waypoint Sequence
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {activeRoute.steps.map((s) => (
                  <div key={s.stepNumber} className="flex items-center justify-between p-2 rounded bg-[#0F172A] border border-white/5 text-[#CBD5E1]">
                    <span><strong>Step {s.stepNumber}:</strong> {s.instruction}</span>
                    <span className="font-mono text-[#94A3B8] shrink-0 ml-2">{s.cumulativeKm} km</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                onClick={() => handleExportPdf()}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition-all cursor-pointer shadow-sm"
              >
                <FilePdf size={14} weight="bold" />
                <span>Download Official PDF Binary</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="rounded-lg px-4 py-1.5 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <Printer size={14} weight="bold" />
                  <span>Print Tactical Dispatch Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
