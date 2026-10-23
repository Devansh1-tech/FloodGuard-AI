/**
 * Stage54RoadsPage.tsx — Stage 5.4: Road Network Inundation & Disruption Analysis.
 *
 * Overhauled to "Tactical Transit & Bridge Command Center" (VISUAL_DENSITY: 8, SKILL.md):
 * 1. Information Pruned: Removed debug badges, duplicated hotlines, and long descriptions.
 * 2. Full-Viewport Hero Map Canvas: <div id="map"></div> primary focus with edge-to-edge layout.
 * 3. Compact Monospace KPI Bar: 5 status metrics (Submerged, Restricted, Open, Isolated, Bridge Watch).
 * 4. Floating Left Dock: Route & Zone Selector with collapsible accordion tabs.
 * 5. On-Demand Inspector Drawer: Road & Bridge Status Drawer replacing the 11-card bottom scroll.
 * 6. High-Contrast Emergency Palette: Crimson (#EF4444), Amber (#F59E0B), Emerald (#10B981).
 * 7. Anti-Emoji Policy: Exclusively @phosphor-icons/react SVGs.
 */

import React, { useState } from 'react';
import {
  Car,
  WarningOctagon,
  Truck,
  ShieldCheck,
  Users,
  Waves,
  Compass,
  Funnel,
  NavigationArrow,
  Bridge,
  MapPin,
  X,
  ArrowRight,
  Clock,
  CheckCircle,
  Warning,
  ListBullets,
  Globe,
  SlidersHorizontal,
  Info,
  ArrowsClockwise,
} from '@phosphor-icons/react';

import { GoogleMapsViewer } from '@/components/map/GoogleMapsViewer';
import {
  ISOLATED_COMMUNITIES,
  IsolatedCommunity,
  RoadSegment,
  TERAI_BRIDGES,
  TERAI_ROAD_SEGMENTS,
  TeraiBridge,
  getRoadDisruptionStats,
} from '@/data/teraiRoadNetwork';
import { EMERGENCY_ROUTES, EmergencyRoute } from '@/data/teraiEmergencyRoutes';
import { TERAI_REGIONS } from '@/data/teraiRegions';

export const Stage54RoadsPage: React.FC = () => {
  // Road & Bridge Filter States
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'submerged' | 'restricted' | 'open'>('all');
  const [selectedHighwayFilter, setSelectedHighwayFilter] = useState<'all' | 'H01' | 'H12' | 'feeders'>('all');
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<TeraiBridge | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<IsolatedCommunity | null>(null);
  const [activeTab, setActiveTab] = useState<'roads' | 'bridges' | 'isolated'>('roads');

  // Command Dock & Drawer States
  const [isLeftDockOpen, setIsLeftDockOpen] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [activeLeftTab, setActiveLeftTab] = useState<'routes' | 'zones'>('routes');

  // Map & GIS Integration States
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('full_terai');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('none');
  const [provider, setProvider] = useState<'google_maps' | 'leaflet'>('leaflet');

  // Computed summary metrics
  const stats = getRoadDisruptionStats();

  // Filtered roads based on status and highway code
  const filteredRoads = TERAI_ROAD_SEGMENTS.filter((road) => {
    if (selectedStatusFilter !== 'all' && road.status !== selectedStatusFilter) return false;
    if (selectedHighwayFilter === 'H01' && road.highwayCode !== 'H01') return false;
    if (selectedHighwayFilter === 'H12' && road.highwayCode !== 'H12') return false;
    if (selectedHighwayFilter === 'feeders' && road.highwayCode.startsWith('H')) return false;
    return true;
  });

  // Handle highway card click
  const handleSelectRoad = (road: RoadSegment) => {
    setSelectedRoad(road);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F8FAFC] pb-10 space-y-3 px-2 sm:px-4 max-w-[1400px] mx-auto w-full">
      {/* ─────────────────────────────────────────────────────────────────────
          TOP TACTICAL CONTROL BAR: TITLE + HIGH-DENSITY ACTIONS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 pt-1">
        <div>
          <span className="sr-only">STAGE 5.4: ROAD NETWORK INUNDATION &amp; DISRUPTION ANALYSIS NEOC 1155 ROAD DISPATCH</span>
          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <Car size={24} weight="bold" className="text-cyan-400" />
            <span>Terai Highway &amp; Bridge Vulnerability Command</span>
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            Real-Time Highway Inundation &bull; Critical Bridges &bull; Isolated Communities
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Toggle Left Route/Zone Dock */}
          <button
            onClick={() => setIsLeftDockOpen(!isLeftDockOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
              isLeftDockOpen
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-white/10 bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]'
            }`}
            title="Toggle Route & Zone Selector Dock"
          >
            <SlidersHorizontal size={14} weight="bold" />
            <span className="hidden sm:inline">Corridor Dock</span>
            <span className="sm:hidden">Routes</span>
          </button>

          {/* Toggle Right Inspector Drawer */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
              isDrawerOpen
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                : 'border-white/10 bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]'
            }`}
            title="Toggle Road & Bridge Status Drawer"
          >
            <ListBullets size={14} weight="bold" />
            <span>Disruption Directory</span>
            <span className="rounded bg-[#0F172A] px-1.5 py-0.2 font-mono text-[10px] text-cyan-400 border border-white/10">
              {filteredRoads.length}
            </span>
          </button>

          {/* Map Engine Toggle */}
          <div className="flex rounded-lg border border-white/10 bg-[#1E293B] p-0.5 text-xs font-bold shadow-sm">
            <button
              onClick={() => setProvider('leaflet')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                provider === 'leaflet'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Leaflet
            </button>
            <button
              onClick={() => setProvider('google_maps')}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                provider === 'google_maps'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Google Maps
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TOP KPI METRICS BAR (Compact Monospace Strip)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Metric 1: Submerged Roads */}
        <div className="rounded-xl border border-rose-500/30 bg-[#1E293B] p-2.5 sm:p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 text-rose-400">
              <WarningOctagon size={13} weight="bold" />
              Submerged Roads
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-200 font-mono">
            {stats.totalSubmergedKm} <span className="text-xs text-rose-400 font-semibold">km</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] truncate font-mono">
            Impassable (&gt;0.5m water)
          </p>
        </div>

        {/* Metric 2: Restricted Transit */}
        <div className="rounded-xl border border-amber-500/30 bg-[#1E293B] p-2.5 sm:p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 text-amber-400">
              <Truck size={13} weight="bold" />
              Restricted (4x4)
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-200 font-mono">
            {stats.totalRestrictedKm} <span className="text-xs text-amber-400 font-semibold">km</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] truncate font-mono">
            Army &amp; Convoy only
          </p>
        </div>

        {/* Metric 3: Clear Passable */}
        <div className="rounded-xl border border-emerald-500/30 bg-[#1E293B] p-2.5 sm:p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={13} weight="bold" />
              Open Passable
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-200 font-mono">
            {stats.totalOpenKm} <span className="text-xs text-emerald-400 font-semibold">km</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] truncate font-mono">
            Dry highway corridors
          </p>
        </div>

        {/* Metric 4: Isolated Citizens */}
        <div className="rounded-xl border border-purple-500/30 bg-[#1E293B] p-2.5 sm:p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 text-purple-400">
              <Users size={13} weight="bold" />
              Isolated Citizens
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-200 font-mono">
            {stats.totalIsolatedPopulation.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#94A3B8] truncate font-mono">
            4 Cut-Off Clusters
          </p>
        </div>

        {/* Metric 5: Bridge Threat */}
        <div className="rounded-xl border border-cyan-500/30 bg-[#1E293B] p-2.5 sm:p-3 space-y-1 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
            <span className="flex items-center gap-1 text-cyan-400">
              <Waves size={13} weight="bold" />
              Bridge Watch
            </span>
            <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-bold text-rose-300 font-mono">
              {stats.criticalBridgesCount} CRITICAL
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-200 font-mono">
            {stats.totalBridgesMonitored} <span className="text-xs text-cyan-400 font-semibold">Bridges</span>
          </div>
          <p className="text-[10px] text-[#94A3B8] truncate font-mono">
            Discharge Telemetry
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN VIEWPORT: HERO MAP CANVAS (DOM ID "map" STRICTLY PRESERVED)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[78dvh] min-h-[580px] rounded-2xl overflow-hidden border border-white/10 bg-[#0F172A] shadow-2xl flex">
        {/* Leaflet / Google Maps Hero Container (id="map" strictly preserved) */}
        <div id="map" className="w-full h-full relative">
          <GoogleMapsViewer
            hideHeader={true}
            provider={provider}
            onProviderChange={setProvider}
            selectedRegionKey={selectedRegionKey}
            selectedRouteId={selectedRouteId}
          />

          {/* ─────────────────────────────────────────────────────────────────
              FLOATING LEFT DOCK: ROUTE & ZONE SELECTOR
          ─────────────────────────────────────────────────────────────────── */}
          {isLeftDockOpen && (
            <div className="absolute top-3 left-3 z-[400] w-72 max-w-[calc(100%-24px)] pointer-events-auto animate-in slide-in-from-left duration-200">
              <div className="rounded-xl border border-white/10 bg-[#1E293B]/95 backdrop-blur-md p-3 shadow-2xl space-y-2.5 text-xs text-[#F8FAFC]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Compass size={14} weight="bold" className="text-cyan-400" />
                    <span>Transit &amp; Zone Control</span>
                  </div>
                  <button
                    onClick={() => setIsLeftDockOpen(false)}
                    className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    title="Minimize Dock"
                  >
                    <X size={13} weight="bold" />
                  </button>
                </div>

                {/* Sub-Tabs: Preset Corridors vs Flood Zones */}
                <div className="grid grid-cols-2 rounded-lg bg-[#0F172A] p-0.5 text-xs font-bold border border-white/5">
                  <button
                    onClick={() => setActiveLeftTab('routes')}
                    className={`py-1 rounded text-center transition-all cursor-pointer ${
                      activeLeftTab === 'routes'
                        ? 'bg-[#1E293B] text-cyan-300 shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Relief Corridors
                  </button>
                  <button
                    onClick={() => setActiveLeftTab('zones')}
                    className={`py-1 rounded text-center transition-all cursor-pointer ${
                      activeLeftTab === 'zones'
                        ? 'bg-[#1E293B] text-cyan-300 shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Flood Zones
                  </button>
                </div>

                {/* Accordion Content */}
                {activeLeftTab === 'routes' ? (
                  <div className="space-y-1.5 pt-0.5">
                    {/* Preset 1: Bharatpur -> Gaur */}
                    <button
                      onClick={() => setSelectedRouteId('route_relief_gaur')}
                      className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedRouteId === 'route_relief_gaur'
                          ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                          : 'border-white/5 bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white text-[11px]">
                        <span className="flex items-center gap-1">
                          <Truck size={12} weight="bold" className="text-emerald-400" />
                          Bharatpur ➔ Gaur
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400">98.4 km</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5 truncate">
                        Central Terai Lifeline (Army 6x6)
                      </div>
                    </button>

                    {/* Preset 2: Duhabi -> Koshi */}
                    <button
                      onClick={() => setSelectedRouteId('route_relief_koshi')}
                      className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedRouteId === 'route_relief_koshi'
                          ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                          : 'border-white/5 bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white text-[11px]">
                        <span className="flex items-center gap-1">
                          <Truck size={12} weight="bold" className="text-cyan-400" />
                          Duhabi ➔ Koshi
                        </span>
                        <span className="font-mono text-[10px] text-cyan-400">68.0 km</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5 truncate">
                        Eastern Terai Medical Lifeline
                      </div>
                    </button>

                    {/* Preset 3: Gaur -> Chandranigahapur */}
                    <button
                      onClick={() => setSelectedRouteId('route_alt_gaur')}
                      className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedRouteId === 'route_alt_gaur'
                          ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
                          : 'border-white/5 bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white text-[11px]">
                        <span className="flex items-center gap-1">
                          <NavigationArrow size={12} weight="bold" className="text-amber-400" />
                          Gaur ➔ Chandranigahapur
                        </span>
                        <span className="font-mono text-[10px] text-amber-400">34.2 km</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5 truncate">
                        Civilian Alternate Evacuation
                      </div>
                    </button>

                    {/* Reset Route */}
                    <button
                      onClick={() => setSelectedRouteId('none')}
                      className="w-full text-center py-1 text-[10px] font-mono text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      Reset Route Selection (Show All)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-0.5">
                    {[
                      { key: 'full_terai', label: 'Full Belt', sub: 'All 21 Districts' },
                      { key: 'eastern_terai', label: 'Eastern Terai', sub: 'Saptakoshi Basin' },
                      { key: 'central_terai', label: 'Central Terai', sub: 'Bagmati & Lalbakeya' },
                      { key: 'western_terai', label: 'Western Terai', sub: 'West Rapti Corridor' },
                      { key: 'far_western_terai', label: 'Far-Western Terai', sub: 'Karnali & Mahakali' },
                    ].map((zone) => (
                      <button
                        key={zone.key}
                        onClick={() => setSelectedRegionKey(zone.key)}
                        className={`w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          selectedRegionKey === zone.key
                            ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                            : 'border-white/5 bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-[11px]">{zone.label}</div>
                          <div className="text-[10px] text-[#94A3B8] font-mono">{zone.sub}</div>
                        </div>
                        {selectedRegionKey === zone.key && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Floating Pill to reopen dock if closed */}
          {!isLeftDockOpen && (
            <button
              onClick={() => setIsLeftDockOpen(true)}
              className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white shadow-xl hover:bg-[#334155] transition-all cursor-pointer pointer-events-auto"
            >
              <Compass size={14} weight="bold" className="text-cyan-400" />
              <span>Open Corridors</span>
            </button>
          )}

          {/* Floating Map Legend Indicator */}
          <div className="absolute bottom-3 left-3 z-[400] pointer-events-none hidden sm:block">
            <div className="rounded-xl border border-white/10 bg-[#1E293B]/90 backdrop-blur-md px-3 py-2 shadow-2xl flex items-center gap-3 text-[11px] font-mono text-[#F8FAFC]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
                <span>Submerged (&gt;0.5m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]"></span>
                <span>Restricted (4x4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
                <span>Passable</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            ON-DEMAND INSPECTOR DRAWER: ROAD & BRIDGE STATUS DRAWER
        ─────────────────────────────────────────────────────────────────────── */}
        {isDrawerOpen && (
          <div className="absolute top-0 right-0 bottom-0 z-[500] w-full sm:w-[420px] bg-[#1E293B]/95 backdrop-blur-md border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-[#0F172A]/80">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 flex items-center gap-1">
                  <ListBullets size={13} weight="bold" />
                  Disruption Directory
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
                  Road &amp; Bridge Disruption Directory
                </h3>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Minimize Drawer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Sub-Tabs: Highways vs Bridges vs Cut-Off */}
            <div className="grid grid-cols-3 border-b border-white/10 p-1 bg-[#0F172A] gap-1 shrink-0 text-xs font-bold">
              <button
                onClick={() => setActiveTab('roads')}
                className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  activeTab === 'roads'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Car size={13} weight="bold" />
                <span>Highway Network ({TERAI_ROAD_SEGMENTS.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('bridges')}
                className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  activeTab === 'bridges'
                    ? 'bg-[#1E293B] text-cyan-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Waves size={13} weight="bold" />
                <span>Bridges &amp; Barrages ({TERAI_BRIDGES.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('isolated')}
                className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  activeTab === 'isolated'
                    ? 'bg-[#1E293B] text-rose-300 shadow-sm border border-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Users size={13} weight="bold" />
                <span>Cut-Off Communities ({ISOLATED_COMMUNITIES.length})</span>
              </button>
            </div>

            {/* Filters Row (when viewing highways) */}
            {activeTab === 'roads' && (
              <div className="p-2 border-b border-white/5 bg-[#0F172A]/40 space-y-2 shrink-0">
                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold">
                  <button
                    onClick={() => setSelectedStatusFilter('all')}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      selectedStatusFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:text-white'
                    }`}
                  >
                    All ({TERAI_ROAD_SEGMENTS.length})
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('submerged')}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      selectedStatusFilter === 'submerged'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-[#0F172A] text-rose-300 border-white/10 hover:bg-rose-950/30'
                    }`}
                  >
                    Submerged ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'submerged').length})
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('restricted')}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      selectedStatusFilter === 'restricted'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-[#0F172A] text-amber-300 border-white/10 hover:bg-amber-950/30'
                    }`}
                  >
                    Restricted ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'restricted').length})
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('open')}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      selectedStatusFilter === 'open'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-[#0F172A] text-emerald-300 border-white/10 hover:bg-emerald-950/30'
                    }`}
                  >
                    Open ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'open').length})
                  </button>
                </div>

                {/* Corridor Filter Select */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-mono text-[#94A3B8]">Corridor:</span>
                  <select
                    aria-label="Filter Highway Corridor"
                    value={selectedHighwayFilter}
                    onChange={(e) => setSelectedHighwayFilter(e.target.value as any)}
                    className="flex-1 rounded-md border border-white/10 bg-[#0F172A] px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="all">All Terai Corridors</option>
                    <option value="H01">Mahendra Highway (H01)</option>
                    <option value="H12">Postal Highway (H12)</option>
                    <option value="feeders">North-South Feeders</option>
                  </select>
                </div>
              </div>
            )}

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {/* TAB 1: HIGHWAYS */}
              {activeTab === 'roads' && (
                <div className="space-y-2">
                  {filteredRoads.map((road) => {
                    const isSubmerged = road.status === 'submerged';
                    const isRestricted = road.status === 'restricted';
                    const isSelected = selectedRoad?.id === road.id;

                    return (
                      <div
                        key={road.id}
                        onClick={() => handleSelectRoad(road)}
                        className={`rounded-xl border p-3 space-y-2 transition-all cursor-pointer hover:scale-[1.01] ${
                          isSelected
                            ? 'border-cyan-400 bg-[#0F172A] ring-1 ring-cyan-400 shadow-lg'
                            : isSubmerged
                            ? 'border-rose-900/60 bg-rose-950/20 hover:border-rose-500/60'
                            : isRestricted
                            ? 'border-amber-900/60 bg-amber-950/20 hover:border-amber-500/60'
                            : 'border-white/10 bg-[#0F172A] hover:border-emerald-500/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#0F172A] text-cyan-300 border border-white/10">
                              {road.highwayCode} &bull; {road.district}
                            </span>
                            <h4 className="font-bold text-xs text-white pt-1 leading-snug">
                              {road.name}
                            </h4>
                            <p className="text-[10px] text-[#94A3B8] italic mt-0.5">
                              {road.nepaliName}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 border font-mono ${
                              isSubmerged
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isRestricted
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {isSubmerged ? 'SUBMERGED' : isRestricted ? '4x4 ONLY' : 'OPEN'}
                          </span>
                        </div>

                        {/* Telemetry Monospace Row */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-white/10">
                          <div>
                            <span className="text-[#94A3B8] block">Total Length:</span>
                            <span className="font-bold text-white">{road.lengthKm} km</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block">Inundation:</span>
                            <span
                              className={`font-black ${
                                road.submergedLengthKm > 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {road.submergedLengthKm} km{' '}
                              {road.maxWaterDepthMeters > 0
                                ? `(${road.maxWaterDepthMeters}m depth)`
                                : '(Dry)'}
                            </span>
                          </div>
                        </div>

                        {/* Advisory Snippet */}
                        <div className="rounded-lg border border-white/5 bg-[#0F172A] p-2 text-[11px] text-[#CBD5E1]">
                          <p className="line-clamp-2">
                            <strong className="text-cyan-300">Advisory:</strong> {road.clearanceAdvice}
                          </p>
                        </div>

                        {road.bypassRecommendation && (
                          <p className="text-[10px] text-amber-300 font-medium font-mono flex items-start gap-1">
                            <Warning size={12} weight="bold" className="shrink-0 text-amber-400 mt-0.5" />
                            <span><strong>Detour:</strong> {road.bypassRecommendation}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: BRIDGES & BARRAGES */}
              {activeTab === 'bridges' && (
                <div className="space-y-2">
                  {TERAI_BRIDGES.map((bridge) => {
                    const isCritical = bridge.status === 'critical_danger';
                    const isWarning = bridge.status === 'high_warning';

                    return (
                      <div
                        key={bridge.id}
                        onClick={() => setSelectedBridge(bridge)}
                        className={`rounded-xl border p-3 space-y-2 transition-all cursor-pointer hover:scale-[1.01] ${
                          isCritical
                            ? 'border-rose-600/70 bg-rose-950/20 shadow-md'
                            : isWarning
                            ? 'border-amber-600/70 bg-amber-950/20 shadow-md'
                            : 'border-white/10 bg-[#0F172A] hover:border-cyan-500/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#0F172A] text-cyan-300 border border-white/10 font-mono">
                              {bridge.river} &bull; {bridge.district}
                            </span>
                            <h4 className="font-bold text-xs text-white pt-1 leading-snug">
                              {bridge.name}
                            </h4>
                            <p className="text-[10px] text-[#94A3B8] italic mt-0.5">
                              {bridge.nepaliName}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 border font-mono ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isWarning
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {isCritical ? 'DANGER' : isWarning ? 'WARNING' : 'SAFE'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-white/10">
                          <div>
                            <span className="text-[#94A3B8] block">Discharge:</span>
                            <span className="font-bold text-cyan-300">
                              {bridge.dischargeCusecs
                                ? `${bridge.dischargeCusecs.toLocaleString()} cusecs`
                                : 'Gauge Active'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block">Water Level:</span>
                            <span className="font-bold text-white">
                              {bridge.waterLevelMeters
                                ? `${bridge.waterLevelMeters}m (Danger: ${bridge.dangerLevelMeters}m)`
                                : 'Normal'}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/5 bg-[#0F172A] p-2 text-[11px] text-[#CBD5E1]">
                          <p className="line-clamp-2">
                            <strong className="text-white">Status:</strong> {bridge.structuralStatus}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: CUT-OFF COMMUNITIES */}
              {activeTab === 'isolated' && (
                <div className="space-y-2">
                  {ISOLATED_COMMUNITIES.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => setSelectedCommunity(community)}
                      className="rounded-xl border border-rose-600/50 bg-rose-950/20 p-3 space-y-2 transition-all cursor-pointer hover:border-rose-400"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-mono">
                            {community.district} District &bull; Isolation Day {community.estimatedIsolationDays}
                          </span>
                          <h4 className="font-bold text-xs text-white pt-1 leading-snug">
                            {community.name}
                          </h4>
                          <p className="text-[10px] text-[#94A3B8] italic mt-0.5">
                            {community.nepaliName}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-rose-400 font-mono block">
                            {community.populationCutOff.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-[#94A3B8] font-mono">Cut-Off Citizens</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-rose-500/20 bg-[#0F172A] p-2 text-[11px] text-[#CBD5E1] space-y-1">
                        <p>
                          <strong className="text-rose-300">Cause:</strong> {community.submergedAccessRoad}
                        </p>
                        <p className="font-mono text-[10px]">
                          <strong className="text-cyan-300">Transport:</strong>{' '}
                          <span className="capitalize text-white">
                            {community.emergencyAccessMethod.replace(/_/g, ' ')}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          DETAILED ADVISORY MODAL (HIGHWAY / BRIDGE / ISOLATED COMMUNITY)
      ─────────────────────────────────────────────────────────────────────── */}
      {selectedRoad && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1E293B] p-5 shadow-2xl space-y-3.5 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Car size={18} weight="bold" className="text-cyan-400" />
                <span className="font-bold text-sm text-white">Transit Corridor Advisory</span>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelectedRoad(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0F172A] text-cyan-300 border border-white/10">
                {selectedRoad.highwayCode} &bull; {selectedRoad.district}
              </span>
              <h3 className="text-base font-black text-white">{selectedRoad.name}</h3>
              <p className="text-xs text-[#94A3B8] italic">{selectedRoad.nepaliName}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Status</span>
                <span className={`font-bold ${selectedRoad.status === 'submerged' ? 'text-rose-400' : selectedRoad.status === 'restricted' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedRoad.status.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Water Depth</span>
                <span className="font-bold text-white">{selectedRoad.maxWaterDepthMeters} m</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Submerged</span>
                <span className="font-bold text-rose-400">{selectedRoad.submergedLengthKm} km</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#0F172A] border border-white/10 space-y-1">
                <strong className="text-cyan-300 font-semibold block">Clearance Advisory:</strong>
                <p className="text-[#CBD5E1] leading-relaxed">{selectedRoad.clearanceAdvice}</p>
              </div>

              {selectedRoad.bypassRecommendation && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                  <strong className="text-amber-300 font-semibold block flex items-center gap-1 font-mono">
                    <Warning size={14} weight="bold" />
                    Recommended Detour Route:
                  </strong>
                  <p className="text-[#CBD5E1] leading-relaxed">{selectedRoad.bypassRecommendation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedRoad(null)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBridge && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1E293B] p-5 shadow-2xl space-y-3.5 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Waves size={18} weight="bold" className="text-cyan-400" />
                <span className="font-bold text-sm text-white">Bridge &amp; Barrage Telemetry</span>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelectedBridge(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#0F172A] text-cyan-300 border border-white/10">
                {selectedBridge.river} River &bull; {selectedBridge.district}
              </span>
              <h3 className="text-base font-black text-white">{selectedBridge.name}</h3>
              <p className="text-xs text-[#94A3B8] italic">{selectedBridge.nepaliName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Discharge</span>
                <span className="font-bold text-cyan-300">
                  {selectedBridge.dischargeCusecs ? `${selectedBridge.dischargeCusecs.toLocaleString()} cusecs` : 'Gauge Active'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Water Level</span>
                <span className="font-bold text-white">
                  {selectedBridge.waterLevelMeters ? `${selectedBridge.waterLevelMeters}m (Danger: ${selectedBridge.dangerLevelMeters}m)` : 'Normal'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-white/10 space-y-1 text-xs">
              <strong className="text-white font-semibold block">Structural Status:</strong>
              <p className="text-[#CBD5E1] leading-relaxed">{selectedBridge.structuralStatus}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedBridge(null)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCommunity && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1E293B] p-5 shadow-2xl space-y-3.5 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Users size={18} weight="bold" className="text-rose-400" />
                <span className="font-bold text-sm text-white">Cut-Off Community Intelligence</span>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelectedCommunity(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                {selectedCommunity.district} District &bull; Isolation Day {selectedCommunity.estimatedIsolationDays}
              </span>
              <h3 className="text-base font-black text-white">{selectedCommunity.name}</h3>
              <p className="text-xs text-[#94A3B8] italic">{selectedCommunity.nepaliName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0F172A] border border-white/10 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Cut-Off Citizens</span>
                <span className="font-bold text-rose-400">{selectedCommunity.populationCutOff.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase block">Nearest Depot</span>
                <span className="font-bold text-white truncate block">{selectedCommunity.nearestDepot.split(' ')[0]} Base</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0F172A] border border-white/10 space-y-1.5 text-xs">
              <div>
                <strong className="text-rose-300 block">Submerged Access Breach:</strong>
                <p className="text-[#CBD5E1]">{selectedCommunity.submergedAccessRoad}</p>
              </div>
              <div>
                <strong className="text-cyan-300 block">Required Logistics Transport:</strong>
                <p className="text-white capitalize">{selectedCommunity.emergencyAccessMethod.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedCommunity(null)}
                className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stage54RoadsPage;
