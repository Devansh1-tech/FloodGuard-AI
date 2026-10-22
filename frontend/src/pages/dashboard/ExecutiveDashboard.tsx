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

import React, { useEffect, useMemo, useState } from 'react';
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
  FileDown,
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
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
  X,
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
import { GoogleMapsViewer } from '@/components/map/GoogleMapsViewer';

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
  onNavigateToTab: (tabId: 'command_map' | 'satellite' | 'hospitals' | 'demographics' | 'roads' | 'routing' | 'havens' | 'sitrep' | 'gauges') => void;
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

  // District Table Hazard Filters, Search, and Sort State
  const [districtHazardFilter, setDistrictHazardFilter] = useState<'ALL' | 'CRITICAL_DELUGE' | 'MODERATE_WARNING' | 'STABLE_MONITORING'>('ALL');
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [districtSortBy, setDistrictSortBy] = useState<'inundated' | 'atRisk' | 'name'>('inundated');

  // Base districts filtered by selected region
  const activeRegionBaseDistricts = useMemo(() => {
    return selectedRegionKey === 'full_terai'
      ? TERAI_DISTRICT_STATS
      : TERAI_DISTRICT_STATS.filter((d) => {
          if (selectedRegionKey === 'eastern_terai') return d.basin === 'Eastern Terai';
          if (selectedRegionKey === 'central_terai') return d.basin === 'Central Terai';
          if (selectedRegionKey === 'western_terai') return d.basin === 'Western Terai';
          if (selectedRegionKey === 'far_western_terai') return d.basin === 'Far-Western Terai';
          return true;
        });
  }, [selectedRegionKey]);

  // Dynamic counts for hazard filter pills
  const districtHazardCounts = useMemo(() => {
    return {
      ALL: activeRegionBaseDistricts.length,
      CRITICAL_DELUGE: activeRegionBaseDistricts.filter((d) => d.inundatedAreaKm2 > 40).length,
      MODERATE_WARNING: activeRegionBaseDistricts.filter((d) => d.inundatedAreaKm2 > 20 && d.inundatedAreaKm2 <= 40).length,
      STABLE_MONITORING: activeRegionBaseDistricts.filter((d) => d.inundatedAreaKm2 <= 20).length,
    };
  }, [activeRegionBaseDistricts]);

  // Filtered and sorted district statistics
  const filteredDistricts = useMemo(() => {
    let list = [...activeRegionBaseDistricts];

    // Hazard Level Filter
    if (districtHazardFilter === 'CRITICAL_DELUGE') {
      list = list.filter((d) => d.inundatedAreaKm2 > 40);
    } else if (districtHazardFilter === 'MODERATE_WARNING') {
      list = list.filter((d) => d.inundatedAreaKm2 > 20 && d.inundatedAreaKm2 <= 40);
    } else if (districtHazardFilter === 'STABLE_MONITORING') {
      list = list.filter((d) => d.inundatedAreaKm2 <= 20);
    }

    // Text Search
    if (districtSearchQuery.trim()) {
      const q = districtSearchQuery.toLowerCase();
      list = list.filter(
        (d) => d.district.toLowerCase().includes(q) || d.basin.toLowerCase().includes(q)
      );
    }

    // Sorting
    return list.sort((a, b) => {
      if (districtSortBy === 'inundated') return b.inundatedAreaKm2 - a.inundatedAreaKm2;
      if (districtSortBy === 'atRisk') return b.atRiskPopulation - a.atRiskPopulation;
      return a.district.localeCompare(b.district);
    });
  }, [activeRegionBaseDistricts, districtHazardFilter, districtSearchQuery, districtSortBy]);

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
          HERO EXECUTIVE LANDING PAGE: GOVERNMENT DISASTER INTELLIGENCE PLATFORM
          (Ultra-Sleek Dark Theme Matching FloodGuard AI Sovereign Aesthetic)
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', width: '100%', minHeight: '560px', backgroundColor: '#070b16' }}
        className="relative rounded-3xl border border-cyan-500/30 bg-[#070b16] shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden"
      >
        {/* Deep Sovereign Dark Ambient Accents & Grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-[#070b16] to-cyan-950/30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#0ea5e9_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08] pointer-events-none" />
        <div className="absolute -top-32 left-1/4 h-72 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 h-72 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 md:p-9 flex flex-col justify-between min-h-[560px] space-y-6">
          {/* Top Header: Official Nepal Government Badges — All 5 in One-Line Alignment */}
          <div className="w-full border-b border-slate-800/80 pb-3.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between gap-2 min-w-[760px] lg:min-w-0 w-full">
              {/* 1. Official Government Command Portal */}
              <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/70 px-2.5 py-1.5 text-[11px] font-bold text-rose-200 shadow-sm shadow-rose-950/40 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                <span>OFFICIAL GOVERNMENT COMMAND PORTAL</span>
              </div>

              {/* 2. Government of Nepal MoHA / NEOC */}
              <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-950/70 px-2.5 py-1.5 text-[11px] font-bold text-blue-200 shadow-sm shadow-blue-950/40 whitespace-nowrap">
                <Shield className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>GOVERNMENT OF NEPAL &bull; MoHA / NEOC</span>
              </div>

              {/* 3. 21 Districts Active */}
              <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 shadow-sm shadow-emerald-950/40 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>21 DISTRICTS ACTIVE</span>
              </div>

              {/* 4. Sentinel-1 Radar Live */}
              <div className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/70 px-2.5 py-1.5 text-[11px] font-bold text-cyan-200 shadow-sm shadow-cyan-950/40 whitespace-nowrap">
                <Satellite className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>SENTINEL-1 RADAR LIVE</span>
              </div>

              {/* 5. NEOC 1155 Emergency Room */}
              <a
                href="tel:1155"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-red-900/70 hover:from-rose-900/90 hover:to-red-800/80 px-2.5 py-1.5 text-[11px] font-extrabold text-rose-200 hover:text-white transition-all shadow-md shadow-rose-950/40 whitespace-nowrap cursor-pointer group"
              >
                <Phone className="h-3.5 w-3.5 text-rose-400 animate-pulse shrink-0 group-hover:scale-110 transition-transform" />
                <span>NEOC 1155 EMERGENCY ROOM</span>
              </a>
            </div>
          </div>

          {/* Middle Section: Sovereign Brand Emblem, Title & Detailed Government Briefing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2">
            <div className="lg:col-span-8 space-y-4">
              {/* Sovereign Brand Emblem */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/20">
                  <Shield className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent">
                      FLOODGUARD NEPAL
                    </h2>
                    <span className="rounded-md border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                      v5.10 SOVEREIGN AI
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-400/80 tracking-wider uppercase font-semibold">
                    National Emergency Operations Centre (NEOC) &bull; Ministry of Home Affairs
                  </p>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                Disaster Response &amp; Flood Intelligence Console
              </h1>

              {/* Nepal Government Briefing Statement */}
              <div className="rounded-2xl border border-cyan-500/25 bg-[#090d16]/95 p-4 sm:p-5 backdrop-blur-md space-y-2.5 shadow-2xl">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <p className="text-xs sm:text-sm font-bold text-cyan-300">
                    Dedicated Nepal Government Disaster Intelligence Briefing
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  National command intelligence platform designed for the Ministry of Home Affairs (MoHA) and the National Emergency Operations Centre (NEOC). High-frequency Copernicus Sentinel-1 Synthetic Aperture Radar (SAR) microwave change detection is directly fused with Google Maps JavaScript API v3 infrastructure layers across all 21 southern lowland Terai plain districts from Jhapa to Kanchanpur.
                </p>
              </div>

              {/* Quick Key Telemetry Capsules inside Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="rounded-xl border border-cyan-500/30 bg-[#06121f]/90 p-2.5 backdrop-blur-sm shadow-md">
                  <span className="text-[10px] text-cyan-300 font-semibold uppercase block">Inundated Area</span>
                  <span className="text-base sm:text-lg font-black text-cyan-200">642.8 km²</span>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-[#140824]/90 p-2.5 backdrop-blur-sm shadow-md">
                  <span className="text-[10px] text-purple-300 font-semibold uppercase block">Population at Risk</span>
                  <span className="text-base sm:text-lg font-black text-purple-200">1,482,000</span>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-[#051811]/90 p-2.5 backdrop-blur-sm shadow-md">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Active Hospitals</span>
                  <span className="text-base sm:text-lg font-black text-emerald-200">7 / 8 Ready</span>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-[#081024]/90 p-2.5 backdrop-blur-sm shadow-md">
                  <span className="text-[10px] text-blue-300 font-semibold uppercase block">Monitored Basin</span>
                  <span className="text-base sm:text-lg font-black text-blue-200">21 Districts</span>
                </div>
              </div>
            </div>

            {/* Action Center: Prominent Buttons for Moving Next */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="rounded-2xl border border-slate-800 bg-[#070b13]/95 p-4 space-y-3 shadow-2xl backdrop-blur-xl">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Immediate Operational Actions
                </span>

                {/* Primary Next Stage Button */}
                <button
                  onClick={() => onNavigateToTab('satellite')}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 px-4 py-3.5 text-xs font-black text-white hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-950/60 active:scale-95 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Satellite className="h-4 w-4 text-cyan-100" />
                    <span>Proceed to Next Stage: Flood Detection</span>
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                {/* View Google Map Button */}
                <button
                  onClick={() => {
                    const el = document.getElementById('terai-google-map');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-[#0d1320] border border-slate-700/80 hover:border-cyan-500/60 px-4 py-3 text-xs font-bold text-slate-200 hover:text-white hover:bg-[#121a2c] transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    <span>Explore Live Google Map Below</span>
                  </div>
                  <span className="text-cyan-400 font-black group-hover:translate-y-0.5 transition-transform">&darr;</span>
                </button>

                {/* Relief & Evacuation Routes Button */}
                <button
                  onClick={() => onNavigateToTab('routing')}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-[#0d1320] border border-slate-700/80 hover:border-amber-500/60 px-4 py-3 text-xs font-bold text-slate-200 hover:text-white hover:bg-[#121a2c] transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="h-4 w-4 text-amber-400" />
                    <span>Relief Convoys &amp; Alternate Routes</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Official Govt SitRep (Stage 5.8) Button */}
                <button
                  onClick={() => onNavigateToTab('sitrep')}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/40 hover:border-emerald-400 px-4 py-3 text-xs font-bold text-emerald-200 hover:text-white transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FileDown className="h-4 w-4 text-emerald-400" />
                    <span>Govt Situation Report (SitRep PDF)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Stage 5.8
                  </span>
                </button>

                {/* DHM River Gauges & SOS Alerts (Stage 5.9) Button */}
                <button
                  onClick={() => onNavigateToTab('gauges')}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-rose-950/70 border border-blue-500/40 hover:border-rose-400 px-4 py-3 text-xs font-bold text-cyan-200 hover:text-white transition-all shadow-md group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Waves className="h-4 w-4 text-cyan-400 animate-pulse" />
                    <span>DHM River Gauges &amp; Vernacular SOS</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Stage 5.9
                  </span>
                </button>

                {/* GEE Script Launcher */}
                <button
                  onClick={() => setIsScriptModalOpen(true)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-cyan-500/40 bg-[#091522] px-4 py-2.5 text-xs font-bold text-cyan-300 hover:text-white hover:bg-[#0e2136] transition-all active:scale-95 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span>GEE Sentinel-1 SAR Code</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Indicator: Scroll Prompt */}
          <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Copernicus Sentinel-1 SAR &bull; Google Maps API v3 &bull; Strictly Nepal Terai Basin</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('terai-google-map');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
            >
              <span>Scroll Down to Google Map &amp; Real-Time Hazards</span>
              <span className="animate-bounce">&darr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          OFFICER RAPID INTELLIGENCE FILTER BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#070b14]/95 p-5 shadow-2xl backdrop-blur-xl space-y-5">
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
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Sentinel-1 C-Band SAR &bull; Otsu threshold computed automatically via GEE
            </span>
          </div>

          {/* Quick Presets & Custom Temporal Range — All 4 Buttons Aligned with Matching Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DATE_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedDatePreset;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleDatePresetChange(preset.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-600/20 text-white shadow-lg ring-1 ring-cyan-500/40'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-xs truncate">{preset.label}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/30 text-cyan-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-2">
                    <span className="text-emerald-400/90 font-bold">Dry:</span> {preset.beforeDate} &rarr;{' '}
                    <span className="text-cyan-400/90 font-bold">Deluge:</span> {preset.afterDate}
                  </div>
                </button>
              );
            })}

            {/* 4. Custom Temporal Range Button (Fixed Size matching the other 3 presets) */}
            <div
              onClick={() => setSelectedDatePreset('custom')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedDatePreset === 'custom'
                  ? 'border-cyan-500 bg-cyan-600/20 text-white shadow-lg ring-1 ring-cyan-500/40'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-xs truncate flex items-center gap-1.5 text-slate-200">
                  <Clock className={`h-3.5 w-3.5 shrink-0 ${selectedDatePreset === 'custom' ? 'text-cyan-400' : 'text-blue-400'}`} />
                  Custom Temporal Range
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    selectedDatePreset === 'custom'
                      ? 'bg-cyan-500/30 text-cyan-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  CUSTOM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-tight">
                    Baseline (Dry)
                  </label>
                  <input
                    type="date"
                    value={beforeDate}
                    onChange={(e) => {
                      setBeforeDate(e.target.value);
                      setSelectedDatePreset('custom');
                    }}
                    className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-1.5 py-0.5 text-[10px] text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer w-full"
                  />
                </div>
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <label className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-tight">
                    Observation (Deluge)
                  </label>
                  <input
                    type="date"
                    value={afterDate}
                    onChange={(e) => {
                      setAfterDate(e.target.value);
                      setSelectedDatePreset('custom');
                    }}
                    className="rounded-lg border border-slate-700/80 bg-slate-900/90 px-1.5 py-0.5 text-[10px] text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer w-full"
                  />
                </div>
              </div>
            </div>
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
          LIVE GOOGLE MAPS FLOOD EXTENT & EMERGENCY OPERATIONS PLATFORM
          (User Requirement: The uske neeche bas google map lagana hai, agar kahi flood aye to google map pe highlight karke bataye)
      ───────────────────────────────────────────────────────────────────────── */}
      <div id="terai-google-map" className="space-y-4 scroll-mt-24">
        <GoogleMapsViewer
          selectedRegionKey={selectedRegionKey}
          selectedDistrict={selectedDistrict}
          viewLayerMode={viewLayerMode}
          selectedDatePreset={selectedDatePreset}
          beforeDate={beforeDate}
          afterDate={afterDate}
          onRegionChange={(key) => handleRegionChange(key)}
          onDistrictChange={(d) => setSelectedDistrict(d)}
          onViewLayerModeChange={(m) => setViewLayerMode(m)}
        />
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          DYNAMIC AREA TELEMETRY CARDS (EXACT FLOODED VS SAFE KM²)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Flooded Inundated Land */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#070b14]/95 p-5 space-y-2 relative overflow-hidden shadow-xl">
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
        <div className="rounded-2xl border border-slate-800/90 bg-[#070b14]/95 p-5 space-y-2 shadow-xl">
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
        <div className="rounded-2xl border border-slate-800/90 bg-[#070b14]/95 p-5 space-y-2 shadow-xl">
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
        <div className="rounded-2xl border border-slate-800/90 bg-[#070b14]/95 p-5 space-y-2 shadow-xl">
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              Showing {filteredDistricts.length} of {activeRegionBaseDistricts.length} Districts in {activeRegion.shortName}
            </span>
          </div>
        </div>

        {/* ── HAZARD FILTER TOOLBAR & CONTROLS ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Hazard Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDistrictHazardFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                districtHazardFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>All Districts</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                districtHazardFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {districtHazardCounts.ALL}
              </span>
            </button>

            <button
              onClick={() => setDistrictHazardFilter('CRITICAL_DELUGE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                districtHazardFilter === 'CRITICAL_DELUGE'
                  ? 'bg-red-500/30 text-red-200 border-red-500 shadow-md shadow-red-500/20 ring-1 ring-red-500/50'
                  : 'bg-slate-950/80 text-red-400 border-red-900/50 hover:bg-red-950/30 hover:border-red-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>Critical Deluge</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-red-950 border border-red-800/80 text-red-300">
                {districtHazardCounts.CRITICAL_DELUGE}
              </span>
            </button>

            <button
              onClick={() => setDistrictHazardFilter('MODERATE_WARNING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                districtHazardFilter === 'MODERATE_WARNING'
                  ? 'bg-amber-500/30 text-amber-200 border-amber-500 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/50'
                  : 'bg-slate-950/80 text-amber-400 border-amber-900/50 hover:bg-amber-950/30 hover:border-amber-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Moderate Warning</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-950 border border-amber-800/80 text-amber-300">
                {districtHazardCounts.MODERATE_WARNING}
              </span>
            </button>

            <button
              onClick={() => setDistrictHazardFilter('STABLE_MONITORING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                districtHazardFilter === 'STABLE_MONITORING'
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/80 text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30 hover:border-emerald-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Stable Monitoring</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800/80 text-emerald-300">
                {districtHazardCounts.STABLE_MONITORING}
              </span>
            </button>
          </div>

          {/* Quick Search & Sort Control */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search district or basin..."
                value={districtSearchQuery}
                onChange={(e) => setDistrictSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-52 transition-colors"
              />
              {districtSearchQuery && (
                <button
                  onClick={() => setDistrictSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[11px]">
              <button
                onClick={() => setDistrictSortBy('inundated')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  districtSortBy === 'inundated'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort by Inundated Area (Highest First)"
              >
                Inundation
              </button>
              <button
                onClick={() => setDistrictSortBy('atRisk')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  districtSortBy === 'atRisk'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort by Population at Risk (Highest First)"
              >
                At-Risk Pop
              </button>
              <button
                onClick={() => setDistrictSortBy('name')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  districtSortBy === 'name'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sort Alphabetically (A-Z)"
              >
                A-Z
              </button>
            </div>
          </div>
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
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <AlertCircle className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                    <p className="font-semibold text-white">No districts found matching criteria</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {districtHazardFilter !== 'ALL'
                        ? `No districts currently categorized under "${districtHazardFilter.replace(/_/g, ' ')}"`
                        : 'Try adjusting your search query'}
                    </p>
                    <button
                      onClick={() => {
                        setDistrictHazardFilter('ALL');
                        setDistrictSearchQuery('');
                      }}
                      className="mt-3 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((d) => {
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
                          className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Inspect on Map
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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
          <button
            onClick={() => onNavigateToTab('roads')}
            className="w-full mt-2 rounded-xl bg-rose-600/30 border border-rose-500/50 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-600/50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Inspect Road Breaches (Stage 5.4)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
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
          <button
            onClick={() => onNavigateToTab('havens')}
            className="w-full mt-2 rounded-xl bg-amber-600/30 border border-amber-500/50 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-600/50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Safe Havens &amp; Camps (Stage 5.7)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
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
          <button
            onClick={() => onNavigateToTab('routing')}
            className="w-full mt-2 rounded-xl bg-blue-600/30 border border-blue-500/50 px-3 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-600/50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Emergency Route Navigator (Stage 5.6)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
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
