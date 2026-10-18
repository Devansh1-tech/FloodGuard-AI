/**
 * Stage54RoadsPage.tsx — Stage 5.4: Road Network Inundation & Disruption Analysis.
 *
 * Implements User Point 4:
 * "google map pe ye batayega konsi road affect hui hai konsa area pe jyada affect hua hai."
 *
 * 1. Primary Highway Network (Mahendra H01, Postal H12, Feeder links).
 * 2. Color-coded Inundation Segmentation (🔴 Submerged, 🟠 Restricted, 🟢 Open).
 * 3. Bridge & Barrage Vulnerability Monitor (Koshi, Bagmati, Narayani, Karnali, Lalbakeya).
 * 4. High-Impact Isolation Communities (cut-off settlements with zero road transit).
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
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

export const Stage54RoadsPage: React.FC = () => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'submerged' | 'restricted' | 'open'>('all');
  const [selectedHighwayFilter, setSelectedHighwayFilter] = useState<'all' | 'H01' | 'H12' | 'feeders'>('all');
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(null);
  const [selectedBridge, setSelectedBridge] = useState<TeraiBridge | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<IsolatedCommunity | null>(null);
  const [activeTab, setActiveTab] = useState<'roads' | 'bridges' | 'isolated'>('roads');

  const stats = getRoadDisruptionStats();

  // Filtered roads
  const filteredRoads = TERAI_ROAD_SEGMENTS.filter((road) => {
    if (selectedStatusFilter !== 'all' && road.status !== selectedStatusFilter) return false;
    if (selectedHighwayFilter === 'H01' && road.highwayCode !== 'H01') return false;
    if (selectedHighwayFilter === 'H12' && road.highwayCode !== 'H12') return false;
    if (selectedHighwayFilter === 'feeders' && road.highwayCode.startsWith('H')) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* ───────────────────────────────────────────────────────────────────────
          HEADER: STAGE 5.4 ROAD NETWORK INUNDATION
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
              STAGE 5.4: ROAD NETWORK INUNDATION &amp; DISRUPTION ANALYSIS
            </span>
            <span className="text-xs text-slate-400">
              Point 4 Implementation &bull; Nepal Terai Lowlands
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
            <Car className="h-7 w-7 text-cyan-400" />
            Terai Highway &amp; Bridge Vulnerability Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Real-time geospatial assessment of submerged transit corridors along Mahendra Highway (H01), Postal Highway (Hulaki / H12), and North-South Feeders. Identifies breached culverts, critical bridge warnings, and completely isolated civilian settlements.
          </p>
        </div>

        <a
          href="tel:1155"
          className="self-start md:self-auto flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-300 hover:bg-rose-500/20 transition-all shadow-md shrink-0"
        >
          <Phone className="h-4 w-4 text-rose-400 animate-pulse" />
          <span>NEOC 1155 ROAD DISPATCH</span>
        </a>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          STAGE 5.4 TELEMETRY CAPSULES
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Impassable Road Km */}
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-br from-[#1c080b] to-[#0f0406] p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertOctagon className="h-3.5 w-3.5" />
              Submerged Roads
            </span>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-200">
            {stats.totalSubmergedKm} <span className="text-xs text-rose-400 font-semibold">km</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Impassable (&gt;0.5m water depth)
          </p>
        </div>

        {/* Metric 2: Restricted Transit */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1c1205] to-[#0f0a03] p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Restricted (4x4)
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-200">
            {stats.totalRestrictedKm} <span className="text-xs text-amber-400 font-semibold">km</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Army &amp; Heavy Tractor convoy only
          </p>
        </div>

        {/* Metric 3: Clear Passable */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-[#06180e] to-[#030d07] p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Open Passable
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-200">
            {stats.totalOpenKm} <span className="text-xs text-emerald-400 font-semibold">km</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Dry highway corridors active
          </p>
        </div>

        {/* Metric 4: Isolated Population */}
        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-[#150724] to-[#0a0312] p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Isolated Citizens
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-200">
            {stats.totalIsolatedPopulation.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Across 4 cut-off Terai clusters
          </p>
        </div>

        {/* Metric 5: Bridge Threat */}
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-[#061522] to-[#030a11] p-4 space-y-1.5 shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Waves className="h-3.5 w-3.5" />
              Bridge Watch
            </span>
            <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300">
              {stats.criticalBridgesCount} CRITICAL
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-200">
            {stats.totalBridgesMonitored} <span className="text-xs text-cyan-400 font-semibold">Bridges</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Real-time discharge monitoring
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN INTERACTIVE FIELD MAP ENGINE (GOOGLE MAPS PLATFORM)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <GoogleMapsViewer />
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          ROAD & BRIDGE INSPECTION CONSOLE & INTERACTIVE TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-[#070b14]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Road &amp; Bridge Disruption Directory</h2>
              <p className="text-xs text-slate-400">Detailed transit advisories, river discharge rates, and isolation protocols</p>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('roads')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'roads' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>Highway Network ({TERAI_ROAD_SEGMENTS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bridges')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'bridges' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Waves className="h-3.5 w-3.5" />
              <span>Bridges &amp; Barrages ({TERAI_BRIDGES.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('isolated')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'isolated' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Cut-Off Communities ({ISOLATED_COMMUNITIES.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: HIGHWAY NETWORK */}
        {activeTab === 'roads' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-400">Road Status:</span>
                <button
                  onClick={() => setSelectedStatusFilter('all')}
                  className={`rounded-lg px-2.5 py-1 font-bold border transition-all ${
                    selectedStatusFilter === 'all'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  All ({TERAI_ROAD_SEGMENTS.length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter('submerged')}
                  className={`rounded-lg px-2.5 py-1 font-bold border transition-all ${
                    selectedStatusFilter === 'submerged'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 text-rose-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🔴 Submerged ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'submerged').length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter('restricted')}
                  className={`rounded-lg px-2.5 py-1 font-bold border transition-all ${
                    selectedStatusFilter === 'restricted'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🟠 Restricted (4x4 Only) ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'restricted').length})
                </button>
                <button
                  onClick={() => setSelectedStatusFilter('open')}
                  className={`rounded-lg px-2.5 py-1 font-bold border transition-all ${
                    selectedStatusFilter === 'open'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-emerald-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🟢 Open Clear ({TERAI_ROAD_SEGMENTS.filter((r) => r.status === 'open').length})
                </button>
              </div>

              {/* Highway Corridor Select */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Corridor:</span>
                <select
                  value={selectedHighwayFilter}
                  onChange={(e) => setSelectedHighwayFilter(e.target.value as any)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Terai Highway Corridors</option>
                  <option value="H01">Mahendra Highway (H01 / East-West)</option>
                  <option value="H12">Postal Highway (Hulaki Rajmarg / H12)</option>
                  <option value="feeders">North-South Feeder Trade Corridors</option>
                </select>
              </div>
            </div>

            {/* Road Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRoads.map((road) => (
                <div
                  key={road.id}
                  onClick={() => setSelectedRoad(road)}
                  className={`rounded-2xl border p-4 space-y-3 transition-all cursor-pointer hover:scale-[1.01] ${
                    selectedRoad?.id === road.id
                      ? 'border-cyan-400 bg-slate-850 shadow-lg shadow-cyan-950/40'
                      : road.status === 'submerged'
                      ? 'border-rose-900/60 bg-[#16070a]/90 hover:border-rose-500/60'
                      : road.status === 'restricted'
                      ? 'border-amber-900/60 bg-[#170e04]/90 hover:border-amber-500/60'
                      : 'border-slate-800 bg-[#0b101c]/90 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {road.highwayCode} &bull; {road.district}
                      </span>
                      <h3 className="font-black text-sm text-white pt-1">{road.name}</h3>
                      <p className="text-[11px] text-slate-400">{road.nepaliName}</p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 border ${
                        road.status === 'submerged'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : road.status === 'restricted'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {road.status === 'submerged' ? '🔴 SUBMERGED' : road.status === 'restricted' ? '🟠 4x4 ONLY' : '🟢 OPEN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block">Total Length:</span>
                      <span className="font-bold text-white">{road.lengthKm} km</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Inundated:</span>
                      <span className={`font-black ${road.submergedLengthKm > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {road.submergedLengthKm} km {road.maxWaterDepthMeters > 0 ? `(${road.maxWaterDepthMeters}m depth)` : '(Dry)'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5 text-xs text-slate-300">
                    <p className="line-clamp-2">
                      <strong className="text-cyan-300">Advisory:</strong> {road.clearanceAdvice}
                    </p>
                  </div>

                  {road.bypassRecommendation && (
                    <p className="text-[11px] text-amber-300 font-medium">
                      ⚠️ <strong>Detour:</strong> {road.bypassRecommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BRIDGES & BARRAGE STATUS */}
        {activeTab === 'bridges' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TERAI_BRIDGES.map((bridge) => (
                <div
                  key={bridge.id}
                  onClick={() => setSelectedBridge(bridge)}
                  className={`rounded-2xl border p-4 space-y-3 transition-all cursor-pointer hover:scale-[1.01] ${
                    bridge.status === 'critical_danger'
                      ? 'border-rose-600/70 bg-[#16070a]/95 shadow-lg shadow-rose-950/40'
                      : bridge.status === 'high_warning'
                      ? 'border-amber-600/70 bg-[#170e04]/95 shadow-lg shadow-amber-950/40'
                      : 'border-slate-800 bg-[#09121f]/95 hover:border-cyan-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {bridge.river} &bull; {bridge.district}
                      </span>
                      <h3 className="font-black text-sm text-white pt-1">{bridge.name}</h3>
                      <p className="text-[11px] text-slate-400">{bridge.nepaliName}</p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 border ${
                        bridge.status === 'critical_danger'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : bridge.status === 'high_warning'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {bridge.status === 'critical_danger'
                        ? 'RED DANGER'
                        : bridge.status === 'high_warning'
                        ? 'AMBER WARNING'
                        : 'SAFE PASS'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400 block">Water Discharge:</span>
                      <span className="font-black text-cyan-300">
                        {bridge.dischargeCusecs ? `${bridge.dischargeCusecs.toLocaleString()} cusecs` : 'Gauge Active'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Water Level:</span>
                      <span className="font-black text-white">
                        {bridge.waterLevelMeters ? `${bridge.waterLevelMeters}m (Danger: ${bridge.dangerLevelMeters}m)` : 'Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300">
                    <p className="line-clamp-2">
                      <strong className="text-slate-200">Status:</strong> {bridge.structuralStatus}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {bridge.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HIGH-IMPACT ISOLATED COMMUNITIES */}
        {activeTab === 'isolated' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ISOLATED_COMMUNITIES.map((community) => (
                <div
                  key={community.id}
                  onClick={() => setSelectedCommunity(community)}
                  className="rounded-2xl border border-rose-600/60 bg-[#16070a]/95 p-5 space-y-3.5 shadow-xl hover:border-rose-400 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40">
                        {community.district} District &bull; Isolation Day {community.estimatedIsolationDays}
                      </span>
                      <h3 className="font-black text-base text-white pt-1">{community.name}</h3>
                      <p className="text-xs text-slate-400">{community.nepaliName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-rose-400">
                        {community.populationCutOff.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Cut-Off Citizens</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-slate-200 space-y-1">
                    <p>
                      <strong className="text-rose-300">Cut-Off Cause:</strong> {community.submergedAccessRoad}
                    </p>
                    <p>
                      <strong className="text-cyan-300">Required Transport:</strong>{' '}
                      <span className="capitalize font-bold text-white">
                        {community.emergencyAccessMethod.replace(/_/g, ' ')}
                      </span>
                    </p>
                    <p>
                      <strong className="text-amber-300">Staging Depot:</strong> {community.nearestDepot}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stage54RoadsPage;
