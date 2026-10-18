/**
 * ExecutiveDashboard.tsx — National Emergency Disaster Command Landing Page & Dashboard.
 *
 * Dedicated to National Emergency Operations Center (NEOC) & Government Disaster Officers:
 * 1. Live situation intelligence across all 21 Nepal Terai districts.
 * 2. Instant Date Selector & Region/Basin Filter.
 * 3. Flooded vs Non-Flooded Layer Toggles ("What I want to see").
 * 4. Interactive Live Satellite Radar Flood Map embedded directly on the dashboard.
 * 5. Dynamic Area Inundation (km² & %) and Population at Risk Telemetry.
 * 6. District Flood Severity Leaderboard for all 21 lowland districts.
 * 7. Google Earth Engine Sentinel-1 SAR Analysis Code Modal launcher.
 */

import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  Radio,
  RefreshCw,
  Satellite,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

import {
  DATE_PRESETS,
  TERAI_REGIONS,
  TeraiRegionData,
  VillageSettlement,
} from '@/data/teraiRegions';
import { TERAI_DISTRICT_STATS, TERAI_HOSPITALS } from '@/data/teraiInfrastructure';
import { nepalBoundaries } from '@/data/nepalBoundaries';
import { EarthEngineScriptModal } from '@/components/gee/EarthEngineScriptModal';
import {
  TERAI_CITIES_DATA,
  TeraiCityData,
  VillageTownItem,
  createCityColorLeafletPin,
} from '@/data/teraiCitiesData';
import { CityVillagesModal } from '@/components/map/CityVillagesModal';

// Custom Map Pins for Flooded vs Safe High-Ground Settlements
const createSettlementPin = (isFlooded: boolean, depth?: number) => {
  if (isFlooded) {
    return L.divIcon({
      className: 'dashboard-pin-flooded',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.4);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 12px #EF4444, 0 3px 6px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 900;
          ">!</div>
          ${
            depth
              ? `<div style="
                  position: absolute;
                  bottom: -15px;
                  white-space: nowrap;
                  background: #7F1D1D;
                  color: #FCA5A5;
                  border: 1px solid #EF4444;
                  font-size: 8px;
                  font-weight: 800;
                  padding: 0 4px;
                  border-radius: 4px;
                ">${depth.toFixed(1)}m</div>`
              : ''
          }
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13],
    });
  }

  return L.divIcon({
    className: 'dashboard-pin-safe',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          background: linear-gradient(135deg, #10B981 0%, #047857 100%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 12px #10B981, 0 2px 5px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 900;
        ">✓</div>
        <div style="
          position: absolute;
          bottom: -15px;
          white-space: nowrap;
          background: #064E3B;
          color: #6EE7B7;
          border: 1px solid #10B981;
          font-size: 8px;
          font-weight: 800;
          padding: 0 4px;
          border-radius: 4px;
        ">SAFE</div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

const createSafeShelterPin = () => {
  return L.divIcon({
    className: 'dashboard-pin-shelter',
    html: `
      <div style="
        background: #059669;
        border: 2px solid #A7F3D0;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 12px;
        font-weight: 900;
      ">
        ⌂
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Map View Controller to handle smooth flyTo transitions
const MapViewController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [center, zoom, map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
};

interface ExecutiveDashboardProps {
  onNavigateToTab: (tabId: 'command_map' | 'satellite' | 'hospitals' | 'demographics') => void;
  onSelectRegion?: (regionKey: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToTab,
  onSelectRegion,
}) => {
  // Region & Filter State
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('full_terai');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('monsoon_deluge_2024');
  const [beforeDate, setBeforeDate] = useState<string>('2024-06-15');
  const [afterDate, setAfterDate] = useState<string>('2024-10-01');

  // Layer Visibility Mode (What I want to see)
  const [viewLayerMode, setViewLayerMode] = useState<'both' | 'flooded' | 'safe'>('both');
  const [mapType, setMapType] = useState<'google_hybrid' | 'google_satellite' | 'google_terrain'>('google_hybrid');
  const [showDeepWaterOnly, setShowDeepWaterOnly] = useState<boolean>(false);
  const [showCityPoints, setShowCityPoints] = useState<boolean>(true);
  const [selectedCity, setSelectedCity] = useState<TeraiCityData | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);

  // GEE Script Modal State
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);

  const activeRegion: TeraiRegionData = TERAI_REGIONS[selectedRegionKey] || TERAI_REGIONS.full_terai;

  const handleRegionChange = (key: string) => {
    setSelectedRegionKey(key);
    setSelectedDistrict('all');
    if (onSelectRegion) onSelectRegion(key);
  };

  const handleDatePresetChange = (presetId: string) => {
    setSelectedDatePreset(presetId);
    const preset = DATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setBeforeDate(preset.beforeDate);
      setAfterDate(preset.afterDate);
    }
  };

  // Filtered district statistics
  const filteredDistricts =
    selectedRegionKey === 'full_terai'
      ? TERAI_DISTRICT_STATS
      : TERAI_DISTRICT_STATS.filter((d) => {
          if (selectedRegionKey === 'eastern_terai') return d.basin === 'Eastern Terai';
          if (selectedRegionKey === 'central_terai') return d.basin === 'Central Terai';
          if (selectedRegionKey === 'western_terai') return d.basin === 'Western Terai';
          if (selectedRegionKey === 'far_western_terai') return d.basin === 'Far-Western Terai';
          return true;
        });

  // Filtered settlements by district
  const filteredSettlements =
    selectedDistrict === 'all'
      ? activeRegion.settlements
      : activeRegion.settlements.filter((s) => s.district.toLowerCase() === selectedDistrict.toLowerCase());

  const totalInundatedKm2 = activeRegion.floodAreaKm2;
  const totalSafeKm2 = activeRegion.safeAreaKm2;
  const totalAffectedPop = activeRegion.affectedPopulation;
  const operationalHospitalsCount = TERAI_HOSPITALS.filter((h) => !h.isFlooded).length;

  const tileUrls = {
    google_hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    google_satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    google_terrain: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ───────────────────────────────────────────────────────────────────────
          HERO EXECUTIVE BANNER: GOVERNMENT DISASTER INTELLIGENCE
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/70 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-black text-rose-400 border border-rose-500/30">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping"></span>
                OFFICIAL GOVERNMENT COMMAND PORTAL
              </span>
              <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
                NEPAL TERAI LOWLANDS CORRIDOR
              </span>
              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                21 DISTRICTS ACTIVE
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Disaster Response &amp; Flood Intelligence Console
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
              High-precision Copernicus Sentinel-1 SAR microwave change detection fused with Google Maps infrastructure intelligence. Select observation dates and lowland regions below to inspect newly inundated land, safe high-ground zones, and healthcare readiness.
            </p>
          </div>

          {/* Quick Actions Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateToTab('satellite')}
              className="flex items-center justify-between gap-3 rounded-2xl bg-cyan-600 px-5 py-3.5 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/25 active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <Satellite className="h-4 w-4" />
                <span>Open Split Deluge Comparison Slider</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('command_map')}
              className="flex items-center justify-between gap-3 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="h-4 w-4" />
                <span>Launch Field Command Map</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsScriptModalOpen(true)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 px-5 py-3.5 text-xs font-bold text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="h-4 w-4 text-cyan-400" />
                <span>Google Earth Engine Script</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          OFFICER RAPID INTELLIGENCE FILTER BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Officer Rapid Intelligence Filter</h2>
              <p className="text-xs text-slate-400">Configure Observation Dates, Study Regions, and Layer Display</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Active Basin: {activeRegion.name}</span>
          </div>
        </div>

        {/* 1. Date Selector (Pre-Monsoon Dry vs Deluge Peak Date) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              Select Flood Event Observation Window:
            </span>
            <span className="text-slate-400 text-[11px]">Sentinel-1 C-Band SAR Specular Backscatter</span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DATE_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedDatePreset;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleDatePresetChange(preset.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-600/20 text-white shadow-lg ring-1 ring-cyan-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{preset.label}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-cyan-500/30 text-cyan-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Dry: {preset.beforeDate} &rarr; Deluge: {preset.afterDate}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              Custom Temporal Range:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 font-bold">Baseline (Dry):</span>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-cyan-400 font-bold">Observation (Deluge):</span>
              <input
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <span className="text-[11px] text-slate-500 italic hidden md:inline">
              Otsu threshold computed automatically via GEE
            </span>
          </div>
        </div>

        {/* 2. Region / Basin Selector */}
        <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-blue-400" />
              Select Lowland Flood Corridor / Basin:
            </span>
            <span className="text-slate-400 text-[11px]">Strictly Clamped to 21 Southern Terai Districts</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {Object.values(TERAI_REGIONS).map((reg) => {
              const isSelected = reg.id === selectedRegionKey;
              return (
                <button
                  key={reg.id}
                  onClick={() => handleRegionChange(reg.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/20 text-white shadow-lg ring-1 ring-blue-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{reg.shortName}</span>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{reg.basin}</div>
                  <div className="text-[11px] font-mono font-bold text-cyan-400 mt-1">
                    {reg.floodAreaKm2} km² inundated
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. What I Want to See (Flooded vs Non-Flooded Toggle) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              What I Want to See on Map:
            </span>

            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                onClick={() => setViewLayerMode('both')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                  viewLayerMode === 'both'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-blue-200" />
                <span>Show Both (Flood vs Safe)</span>
              </button>

              <button
                onClick={() => setViewLayerMode('flooded')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                  viewLayerMode === 'flooded'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Waves className="h-3.5 w-3.5 text-cyan-200" />
                <span>🌊 Flooded Area Only</span>
              </button>

              <button
                onClick={() => setViewLayerMode('safe')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                  viewLayerMode === 'safe'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
                <span>🛡️ Non-Flooded (Safe) Only</span>
              </button>
            </div>
          </div>

          {/* Jump to Individual District */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Focus District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="all">All Terai Districts ({activeRegion.shortName})</option>
              {activeRegion.districts.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          LIVE INTERACTIVE SATELLITE RADAR FLOOD MAP
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden space-y-0">
        {/* Map Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Satellite className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  Live Terai Deluge Radar Map &bull; {activeRegion.name}
                </span>
                <span className="rounded bg-cyan-950/90 border border-cyan-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  {totalInundatedKm2} km² Deluge
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Observation Date: <strong className="text-cyan-300">{afterDate}</strong> vs Baseline: <strong className="text-emerald-300">{beforeDate}</strong>
              </span>
            </div>
          </div>

          {/* Basemap Switcher & Actions */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => setMapType('google_hybrid')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  mapType === 'google_hybrid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => setMapType('google_satellite')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  mapType === 'google_satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapType('google_terrain')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  mapType === 'google_terrain' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Terrain
              </button>
            </div>

            <button
              onClick={() => setShowCityPoints(!showCityPoints)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-bold transition-all ${
                showCityPoints
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle all 21 Terai region city color points"
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>21 City Color Points</span>
            </button>

            <button
              onClick={() => onNavigateToTab('satellite')}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/20 px-3 py-1.5 font-bold text-cyan-300 hover:bg-cyan-600/30 transition-all"
              title="Open full interactive Before/After comparison slider"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Split Slider</span>
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[520px] w-full bg-slate-950">
          <MapContainer
            center={activeRegion.center}
            zoom={activeRegion.zoom}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
            maxBounds={[
              [26.0, 79.8],
              [29.2, 88.5],
            ]}
            minZoom={7}
            maxZoom={14}
          >
            <MapViewController center={activeRegion.center} zoom={activeRegion.zoom} />

            {/* Base Tile Layer */}
            <TileLayer
              attribution='&copy; Google Earth Engine &bull; Copernicus Sentinel-1'
              url={tileUrls[mapType]}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />

            {/* Sovereign Nepal National Border (Illuminated Dotted Outline) */}
            <Polyline
              positions={nepalBoundaries.nepal_border}
              pathOptions={{
                color: '#FACC15',
                weight: 2.5,
                opacity: 0.9,
                dashArray: '6, 6',
              }}
            />

            {/* Nepal Terai Lowland Basin Delineation */}
            <Polyline
              positions={nepalBoundaries.terai_full}
              pathOptions={{
                color: '#06B6D4',
                weight: 2,
                opacity: 0.8,
                dashArray: '4, 4',
              }}
            />

            {/* 1. Flooded Inundation Polygons (Rendered when 'both' or 'flooded') */}
            {(viewLayerMode === 'both' || viewLayerMode === 'flooded') &&
              activeRegion.floodPolygons.map((polyCoords, idx) => (
                <Polygon
                  key={`flood-poly-${activeRegion.id}-${idx}`}
                  positions={polyCoords}
                  pathOptions={{
                    fillColor: '#06B6D4',
                    fillOpacity: 0.65,
                    color: '#38BDF8',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-1 text-slate-900 font-sans">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                        <Waves className="h-3.5 w-3.5 text-blue-600" />
                        <span>Sentinel-1 SAR Inundated Flood Plain</span>
                      </div>
                      <p className="text-[11px] text-slate-700">
                        River Corridor: <strong>{activeRegion.basin}</strong>
                      </p>
                      <div className="text-[11px] text-slate-700 space-y-0.5">
                        <div>Radar Backscatter Drop: <strong>{activeRegion.deltaDb} dB</strong></div>
                        <div>Otsu Threshold: <strong>{activeRegion.otsuThreshold} dB</strong></div>
                        <div>Deluge Depth: <strong>1.4m &ndash; 2.5m</strong></div>
                      </div>
                      <div className="pt-1 border-t border-slate-300 text-[10px] text-rose-600 font-bold">
                        ⚠️ High Hazard Zone: Immediate evacuation recommended
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ))}

            {/* 2. Safe High-Ground Refuges (Rendered when 'both' or 'safe') */}
            {(viewLayerMode === 'both' || viewLayerMode === 'safe') &&
              activeRegion.safeZones.map((sz) => (
                <React.Fragment key={sz.id}>
                  <Polygon
                    positions={sz.polygon}
                    pathOptions={{
                      fillColor: '#10B981',
                      fillOpacity: 0.55,
                      color: '#34D399',
                      weight: 2.5,
                      dashArray: '3, 3',
                    }}
                  >
                    <Popup>
                      <div className="p-2 space-y-1 text-slate-900 font-sans">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Safe High-Ground Refuge</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{sz.name}</p>
                        <div className="text-[11px] text-slate-700">
                          <div>District: <strong>{sz.district}</strong></div>
                          <div>Elevation: <strong>{sz.elevationMeters}m ASL</strong></div>
                          <div>Shelter Capacity: <strong>{sz.shelterCapacity.toLocaleString()} citizens</strong></div>
                          <div>Contact: <strong>{sz.contactAgency}</strong></div>
                        </div>
                        <div className="pt-1 text-[10px] text-emerald-700 font-bold">
                          ✓ Helicopter Landing Zone &amp; Relief Hub
                        </div>
                      </div>
                    </Popup>
                  </Polygon>

                  <Marker position={sz.coords} icon={createSafeShelterPin()}>
                    <Popup>
                      <div className="p-2 text-slate-900 font-sans">
                        <div className="font-bold text-xs text-emerald-700">Refuge Shelter: {sz.name}</div>
                        <div className="text-[11px] text-slate-700 mt-1">
                          Capacity: {sz.shelterCapacity.toLocaleString()} persons &bull; Elev: {sz.elevationMeters}m
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

            {/* 3. Village & Settlement Markers */}
            {filteredSettlements.map((settlement) => {
              if (viewLayerMode === 'flooded' && !settlement.isFlooded) return null;
              if (viewLayerMode === 'safe' && settlement.isFlooded) return null;

              return (
                <Marker
                  key={settlement.id}
                  position={settlement.coords}
                  icon={createSettlementPin(settlement.isFlooded, settlement.floodDepthMeters)}
                >
                  <Popup>
                    <div className="p-2 space-y-1.5 text-slate-900 font-sans min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900">{settlement.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            settlement.isFlooded
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {settlement.isFlooded ? 'FLOODED' : 'SAFE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-0.5">
                        <div>District: <strong>{settlement.district}</strong></div>
                        <div>Status: <strong>{settlement.status}</strong></div>
                        {settlement.floodDepthMeters && (
                          <div>Inundation Depth: <strong className="text-rose-700">{settlement.floodDepthMeters}m</strong></div>
                        )}
                        <div>Population: <strong>{settlement.population.toLocaleString()}</strong></div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-700">
                        <strong>Protocol:</strong> {settlement.recommendedAction}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 4. Terai City Color Points (User Feature) */}
            {showCityPoints &&
              TERAI_CITIES_DATA.map((city) => {
                if (selectedRegionKey !== 'full_terai' && city.regionKey !== selectedRegionKey) {
                  return null;
                }
                return (
                  <Marker
                    key={`exec-city-${city.id}`}
                    position={city.coords}
                    icon={createCityColorLeafletPin(city)}
                    eventHandlers={{
                      click: () => {
                        setSelectedCity(city);
                        setIsCityModalOpen(true);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 max-w-[220px]">
                        <span
                          className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${city.color}25`,
                            borderColor: `${city.color}60`,
                            color: city.color,
                          }}
                        >
                          {city.status.toUpperCase()} ZONE &bull; {city.district}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{city.name}</h4>
                        <p className="text-xs text-slate-600">{city.statusText}</p>
                        <button
                          onClick={() => {
                            setSelectedCity(city);
                            setIsCityModalOpen(true);
                          }}
                          className="w-full mt-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
                        >
                          Inspect Villages &amp; Towns ({city.villagesAndTowns.length})
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* Floating On-Map Telemetry HUD */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
            <div className="pointer-events-auto rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2.5 backdrop-blur-md shadow-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sentinel-1 SAR Specular Delineation</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-cyan-400 font-bold">{totalInundatedKm2} km² Flooded</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-emerald-400 font-bold">{totalSafeKm2.toLocaleString()} km² Safe</span>
              </div>
            </div>

            <div className="pointer-events-auto rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md text-[11px] text-slate-400">
              Active Display:{' '}
              <strong className="text-white">
                {viewLayerMode === 'both'
                  ? 'Flooded & Safe Grounds'
                  : viewLayerMode === 'flooded'
                  ? 'Flooded Corridors Only'
                  : 'Safe High Grounds Only'}
              </strong>
            </div>
          </div>

          {/* Floating Legend */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-auto rounded-xl border border-slate-800 bg-slate-950/95 p-3 backdrop-blur-md shadow-2xl text-xs space-y-2 max-w-xs">
            <span className="font-bold text-white block text-[11px] uppercase tracking-wider">
              Map Symbol Legend:
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-cyan-300">
                <div className="h-3 w-5 rounded bg-cyan-500/70 border border-cyan-400"></div>
                <span>Flooded Plain (Sentinel-1 SAR)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <div className="h-3 w-5 rounded bg-emerald-500/60 border border-emerald-400 border-dashed"></div>
                <span>Safe High-Ground Refuge Zone</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <div className="h-0.5 w-5 bg-yellow-400 border-dashed"></div>
                <span>Sovereign Nepal Border</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-3 w-3 rounded-full bg-red-600 border border-white"></div>
                <span>Flooded Settlement with Depth (m)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-3 w-3 rounded-full bg-emerald-600 border border-white"></div>
                <span>Safe Evacuation Hub</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DYNAMIC AREA TELEMETRY CARDS (EXACT FLOODED VS SAFE KM²)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Flooded Inundated Land */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-cyan-400" />
              Inundated Flood Area
            </span>
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
              ACTIVE DELUGE
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">{totalInundatedKm2} km²</span>
            <span className="text-xs text-rose-400 font-bold">Submerged</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Specular radar drop (&le; {activeRegion.otsuThreshold} dB) detected via Sentinel-1 SAR. Covers{' '}
            <strong className="text-slate-200">
              {((totalInundatedKm2 / (totalInundatedKm2 + totalSafeKm2)) * 100).toFixed(1)}%
            </strong>{' '}
            of regional alluvial surface.
          </p>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-300">
            <span>Core Deep Water: &gt;1.8m</span>
            <span>Backscatter: {activeRegion.deltaDb} dB</span>
          </div>
        </div>

        {/* Metric 2: Safe High-Ground Non-Flooded Area */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Safe Non-Flooded Surface
            </span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              DRY RIDGES
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{totalSafeKm2.toLocaleString()} km²</span>
            <span className="text-xs text-emerald-300 font-bold">Habitable</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Elevated terraces and dry Siwalik foothills available for relief camps, helicopter landing zones, and supply corridors.
          </p>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-300">
            <span>Capacity: {activeRegion.safeZones.reduce((acc, z) => acc + z.shelterCapacity, 0).toLocaleString()}</span>
            <span>Elevation: &gt;150m ASL</span>
          </div>
        </div>

        {/* Metric 3: Population At Risk / Displaced */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-400" />
              Exposed Citizens
            </span>
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/30">
              WORLDPOP 100M
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400">{totalAffectedPop.toLocaleString()}</span>
            <span className="text-xs text-slate-400">citizens</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Civilians situated inside direct river breach corridors and low-lying agricultural wards requiring emergency relief convoys.
          </p>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-purple-300">
            <span>High Risk: 34%</span>
            <span>Evacuation: Urgent</span>
          </div>
        </div>

        {/* Metric 4: Operational Healthcare Capacity */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-blue-400" />
              Hospital Emergency Beds
            </span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
              {operationalHospitalsCount} / {TERAI_HOSPITALS.length} ACTIVE
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400">2,180 Beds</span>
            <span className="text-xs text-rose-400 font-bold">2 Inundated</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Verified OpenStreetMap medical facilities mapped with direct emergency triage contact numbers and flood elevation clearance.
          </p>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-blue-300">
            <span>ICU Capacity: 84%</span>
            <span>Helpline: 1155</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DISTRICT LEADERBOARD & INUNDATION SUMMARY TABLE
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              District Flood Severity &amp; Exposure Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Real-time breakdown of inundated square kilometers and vulnerable citizens per Terai district
            </p>
          </div>

          <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Showing {filteredDistricts.length} Districts in {activeRegion.shortName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-[11px] text-slate-400">
              <tr>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">River Basin</th>
                <th className="py-3 px-4">Inundated Area</th>
                <th className="py-3 px-4">Total Population</th>
                <th className="py-3 px-4">Population at Risk</th>
                <th className="py-3 px-4">Hazard Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredDistricts.map((d) => {
                const isHighHazard = d.inundatedAreaKm2 > 40;
                const isModerateHazard = d.inundatedAreaKm2 > 20 && d.inundatedAreaKm2 <= 40;

                return (
                  <tr key={d.district} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isHighHazard ? 'bg-red-500 animate-ping' : isModerateHazard ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      {d.district}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{d.basin}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {d.inundatedAreaKm2.toFixed(1)} km²
                    </td>
                    <td className="py-3 px-4 font-mono">{d.totalPopulation.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-rose-300 font-bold">
                      {d.atRiskPopulation.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isHighHazard
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : isModerateHazard
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isHighHazard ? 'CRITICAL DELUGE' : isModerateHazard ? 'MODERATE WARNING' : 'STABLE MONITORING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToTab('command_map')}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        Inspect on Map
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          GOVERNMENT OFFICER PRIORITY INCIDENT NOTICES
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="h-4 w-4" />
            <span>Priority 1: Gaur Ring Dam Breaches</span>
          </div>
          <h4 className="text-sm font-bold text-white">Bagmati &amp; Lalbakeya Embankment Deluge</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Severe inundation in Gaur border municipality (depth ~2.2m). 39,800 citizens cut off. Recommend immediate food/water airdrops and relocation north to Chandranigahapur High Ground.
          </p>
          <div className="text-[11px] font-mono text-rose-300/90">
            District: Rautahat &bull; Safe Refuge: Chandranigahapur Campus
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Priority 2: Koshi Tailwater Spillover</span>
          </div>
          <h4 className="text-sm font-bold text-white">Bhantabari &amp; Hanumannagar Floodplains</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Koshi Barrage tailwater surge overflowing eastern dikes (depth ~2.1m). Maintain one-way emergency convoy traffic on East-West Highway; transfer evacuees to Barahachhetra High Ridge.
          </p>
          <div className="text-[11px] font-mono text-amber-300/90">
            District: Sunsari &bull; Safe Refuge: Barahachhetra High Ridge (8,500 cap)
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Radio className="h-4 w-4" />
            <span>Priority 3: West Rapti Stream Backflow</span>
          </div>
          <h4 className="text-sm font-bold text-white">Nepalgunj &amp; Holiya Rural Basin</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Duduwa stream backflow causing urban waterlogging (depth ~1.3m). Armed Police Force rubber boats deployed. Route medical supplies north along Ratna Highway toward Kohalpur Hub.
          </p>
          <div className="text-[11px] font-mono text-blue-300/90">
            District: Banke &bull; Safe Refuge: Kohalpur Evacuation Hub (9,200 cap)
          </div>
        </div>
      </div>

      {/* Earth Engine Script Modal */}
      <EarthEngineScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        selectedRegionName={activeRegion.name}
        beforeDate={beforeDate}
        afterDate={afterDate}
        otsuThreshold={activeRegion.otsuThreshold}
      />

      {/* Terai City Villages & Towns Directory Modal */}
      <CityVillagesModal
        city={selectedCity}
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
      />
    </div>
  );
};
