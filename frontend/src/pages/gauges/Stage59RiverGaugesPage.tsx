/**
 * Stage59RiverGaugesPage.tsx — Real-Time River Gauge Telemetry & Vernacular SOS.
 *
 * Overhauled to High-Density Cockpit Telemetry (VISUAL_DENSITY: 8, SKILL.md):
 * 1. Zero vertical page scroll: Abolished 7 heavy static station cards.
 * 2. On-Demand Inspection Drawer: Inspect station hydrographs, gate status, and downstream zones via dropdown or map pin click.
 * 3. 4 High-Density Monospace Telemetry KPI Cards.
 * 4. Consolidated Toolbar: Language switcher (नेपाली / EN), Telemetry Sync, and DHM Info.
 * 5. Clean Basin & Station Dropdowns directly above the interactive River Map canvas.
 * 6. Preserved <div id="map"></div> mounting container and Leaflet/Google Maps compatibility.
 * 7. Anti-Emoji Policy: Exclusively @phosphor-icons/react SVGs.
 * 8. WCAG AA Palette: #0F172A Canvas, #1E293B Containers, #F8FAFC Text, #94A3B8 Secondary.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Broadcast,
  Waves,
  Drop,
  WarningOctagon,
  WarningCircle,
  Warning,
  Gauge,
  Users,
  ArrowsClockwise,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
  CaretDown,
  CaretUp,
  MapPin,
  CalendarBlank,
  Info,
  Radio,
  CheckCircle,
} from '@phosphor-icons/react';

import {
  TERAI_RIVER_GAUGES,
  RiverGaugeStation,
  HISTORICAL_FLOOD_SCENARIOS,
  FloodScenario,
} from '@/data/teraiRiverGauges';
import {
  fetchRiverGauges,
  computeTelemetrySummary,
  TelemetrySummary,
  matchesBasin,
  matchesStatus,
} from '@/services/riverGaugeService';
import { WaterGaugeVisualizer } from '@/components/gauges/WaterGaugeVisualizer';
import { RiverGaugeMap } from '@/components/gauges/RiverGaugeMap';
import { VernacularSosModal } from '@/components/gauges/VernacularSosModal';
import { NEPAL_RIVERS, LiveRiverData, syncNepalRiversWithGauges } from '@/data/nepalRiverBasinsAndRivers';
import { LiveRiverTelemetryModal } from '@/components/gauges/LiveRiverTelemetryModal';

export const Stage59RiverGaugesPage: React.FC = () => {
  const [gauges, setGauges] = useState<RiverGaugeStation[]>(TERAI_RIVER_GAUGES);
  const [selectedStation, setSelectedStation] = useState<RiverGaugeStation | null>(TERAI_RIVER_GAUGES[0]);
  const [inspectedStation, setInspectedStation] = useState<RiverGaugeStation | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<string>('live_monsoon_deluge');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-18');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'ne'>('ne'); // Default to Nepali vernacular

  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [modalStation, setModalStation] = useState<RiverGaugeStation | null>(null);
  const [selectedRiverForModal, setSelectedRiverForModal] = useState<LiveRiverData | null>(null);
  const [isRiverModalOpen, setIsRiverModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showProvenanceInfo, setShowProvenanceInfo] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRiverGauges({
        basin: selectedBasin,
        status: selectedStatus,
        date: selectedDate,
        scenario: selectedScenario,
      });
      setGauges(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBasin, selectedStatus, selectedDate, selectedScenario]);

  // Synchronize Nepal rivers with active DHM gauges and selected scenario
  const activeRivers = useMemo(() => {
    return syncNepalRiversWithGauges(NEPAL_RIVERS, gauges);
  }, [gauges]);

  const filteredGauges = useMemo(() => {
    return gauges.filter((g) => {
      // 1. Text search filter: Match names, rivers, districts, basins, DHM station numbers, officer, settlements
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qDigits = q.replace(/[^0-9]/g, '');
        const matchText = (
          g.name.toLowerCase().includes(q) ||
          g.nepaliName.toLowerCase().includes(q) ||
          g.river.toLowerCase().includes(q) ||
          g.nepaliRiver.toLowerCase().includes(q) ||
          g.district.toLowerCase().includes(q) ||
          g.basin.toLowerCase().includes(q) ||
          g.dhmStationNumber.toLowerCase().includes(q) ||
          (qDigits.length > 0 && g.dhmStationNumber.replace(/[^0-9]/g, '').includes(qDigits)) ||
          g.stationOfficer.toLowerCase().includes(q) ||
          (g.downstreamSettlements && g.downstreamSettlements.some(
            (s) => s.settlementName.toLowerCase().includes(q) || s.nepaliName.toLowerCase().includes(q)
          ))
        );
        if (!matchText) return false;
      }
      // 2. Client-side basin & status double-check for instantaneous responsiveness
      if (!matchesBasin(g, selectedBasin)) return false;
      if (!matchesStatus(g, selectedStatus)) return false;

      return true;
    });
  }, [gauges, searchQuery, selectedBasin, selectedStatus]);

  // Ensure selected station remains valid when filters change
  useEffect(() => {
    if (filteredGauges.length > 0) {
      if (!selectedStation || !filteredGauges.some((g) => g.id === selectedStation.id)) {
        setSelectedStation(filteredGauges[0]);
      }
    }
  }, [filteredGauges]);

  const handleScenarioChange = (scenarioId: string) => {
    if (scenarioId === 'custom') {
      setIsCustomDate(true);
      setSelectedScenario('custom');
    } else {
      setIsCustomDate(false);
      setSelectedScenario(scenarioId);
      const matched = HISTORICAL_FLOOD_SCENARIOS.find((s) => s.id === scenarioId);
      if (matched) {
        setSelectedDate(matched.date);
      }
    }
  };

  const isFilterActive =
    selectedBasin !== 'all' ||
    selectedStatus !== 'all' ||
    selectedScenario !== 'live_monsoon_deluge' ||
    searchQuery.trim() !== '' ||
    isCustomDate;

  // Compute telemetry summary reflecting active filtered subset (or full gauges)
  const summary: TelemetrySummary = useMemo(() => {
    return computeTelemetrySummary(filteredGauges.length > 0 ? filteredGauges : gauges);
  }, [filteredGauges, gauges]);

  const handleOpenSosModal = (station: RiverGaugeStation) => {
    setModalStation(station);
    setIsSosModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedBasin('all');
    setSelectedStatus('all');
    setSelectedScenario('live_monsoon_deluge');
    setSelectedDate('2026-10-18');
    setIsCustomDate(false);
    setSearchQuery('');
  };

  const handleStationSelect = (station: RiverGaugeStation) => {
    setSelectedStation(station);
    setInspectedStation(station);
    setIsInspectorOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F8FAFC] pb-12 space-y-4 px-2 sm:px-4 max-w-7xl mx-auto w-full">
      {/* ─────────────────────────────────────────────────────────────────────
          1. CONSOLIDATED TOP BAR: CRISP TITLE + UNIFIED TOOLBAR
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 flex items-center gap-1 font-mono uppercase">
              <Broadcast size={12} weight="bold" />
              STAGE 5.9: DHM RIVER GAUGES &amp; VERNACULAR SOS ALERTS
            </span>
            <span className="text-[10px] text-[#94A3B8] font-mono">
              Point 11: Real-Time Early Warning &bull; Terai Lowlands
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2 mt-1">
            <Broadcast size={24} weight="bold" className="text-[#EF4444] animate-pulse" />
            <span>
              {language === 'ne'
                ? 'नदी जलसतह टेलिमेट्री तथा नेपाली आपतकालीन चेतावनी'
                : 'Real-Time River Gauge Telemetry & Vernacular SOS Alerts'}
            </span>
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
            DHM Automated Sensor Transducers &bull; 21 Lowland Terai Districts &bull; 10-Min Telemetry
          </p>
        </div>

        {/* Compact Right Toolbar: Language Switcher + Telemetry Sync + Provenance Info */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact Bilingual Switcher */}
          <div className="flex items-center rounded-lg bg-[#1E293B] border border-white/10 p-0.5 shadow-sm text-xs">
            <button
              onClick={() => setLanguage('ne')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                language === 'ne'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="नेपाली (Vernacular)"
              aria-label="नेपाली (Vernacular)"
            >
              नेपाली (Vernacular)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="English"
              aria-label="English"
            >
              English
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1E293B] hover:bg-[#334155] px-3 py-1.5 text-xs font-bold text-[#F8FAFC] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh Live Telemetry"
          >
            <ArrowsClockwise size={14} weight="bold" className={`text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'ne' ? 'ताजा गर्नुहोस्' : 'Sync'}</span>
          </button>

          {/* Data Provenance Info Button */}
          <button
            onClick={() => setShowProvenanceInfo(!showProvenanceInfo)}
            className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition-all cursor-pointer"
            title="DHM Data Architecture"
          >
            <Info size={14} weight="bold" className="text-cyan-400" />
            <span className="hidden sm:inline">DHM Info</span>
            {showProvenanceInfo ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          COLLAPSIBLE DHM PROVENANCE INFO PANEL
      ─────────────────────────────────────────────────────────────────────── */}
      {showProvenanceInfo && (
        <div className="rounded-xl border border-white/10 bg-[#1E293B] p-3.5 space-y-2 text-xs shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Info size={14} weight="bold" className="text-cyan-400" />
              Government of Nepal DHM Real-Time Hydrological Telemetry Architecture
            </span>
            <a
              href="http://hydrology.gov.np/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              hydrology.gov.np
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-[#94A3B8]">
            <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 space-y-1">
              <strong className="text-cyan-300 block uppercase font-mono text-[10px]">1. Radar Transducers</strong>
              <p className="leading-relaxed">
                47+ automated hydrological stations transmitting stage and discharge telemetry every 10–15 minutes via GSM/Satellite.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 space-y-1">
              <strong className="text-amber-300 block uppercase font-mono text-[10px]">2. Calibrated Thresholds</strong>
              <p className="leading-relaxed">
                Official DHM Warning and Danger levels in meters calibrated to riverbed bathymetry and embankment crest heights.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 space-y-1">
              <strong className="text-emerald-300 block uppercase font-mono text-[10px]">3. Monsoon Replay</strong>
              <p className="leading-relaxed">
                Replay historical monsoon deluge records (Sept 2024, July 2023, winter baseline) or simulate custom dates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          2. TOP 4 HIGH-DENSITY KPI CARDS (MONOSPACE METRICS)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Monitored Gauges */}
        <div className="rounded-xl border border-white/10 bg-[#1E293B] p-3 text-left shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px] font-mono uppercase tracking-wider font-bold">
            <span>{language === 'ne' ? 'अनुगमन केन्द्र' : 'Monitored DHM Gauges'}</span>
            <Waves size={16} weight="bold" className="text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-1.5">
            <span>{summary.totalStationsMonitored}</span>
            {filteredGauges.length !== gauges.length && (
              <span className="text-xs text-[#94A3B8] font-normal font-sans">
                ({filteredGauges.length} filtered)
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-0.5 truncate">
            21 Lowland Terai Districts
          </div>
        </div>

        {/* KPI 2: Danger Level Breached */}
        <div className={`rounded-xl border p-3 text-left shadow-sm transition-colors ${
          summary.stationsInDangerOrExtreme > 0
            ? 'border-rose-500/30 bg-rose-950/20'
            : 'border-emerald-500/30 bg-emerald-950/20'
        }`}>
          <div className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            <span>{language === 'ne' ? 'खतरा विन्दु पार' : 'Danger Level Breached'}</span>
            <WarningOctagon size={16} weight="bold" className={summary.stationsInDangerOrExtreme > 0 ? 'text-[#EF4444] animate-pulse' : 'text-[#10B981]'} />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
          }`}>
            {summary.stationsInDangerOrExtreme} / {summary.totalStationsMonitored}
          </div>
          <div className={`text-[10px] font-mono mt-0.5 truncate ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            {summary.stationsInDangerOrExtreme > 0
              ? (language === 'ne' ? 'तुरुन्त निकासी निर्देशन जारी' : 'Immediate Evacuation Active')
              : (language === 'ne' ? 'कुनै खतरा छैन • सामान्य सुरक्षित बहाव' : 'Safe Flow • Zero Breaches')}
          </div>
        </div>

        {/* KPI 3: Peak Discharge Flow */}
        <div className="rounded-xl border border-white/10 bg-[#1E293B] p-3 text-left shadow-sm">
          <div className="flex items-center justify-between text-[#94A3B8] text-[10px] font-mono uppercase tracking-wider font-bold">
            <span>{language === 'ne' ? 'अधिकतम जल प्रवाह' : 'Peak Discharge Flow'}</span>
            <Gauge size={16} weight="bold" className="text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono mt-1 truncate">
            {summary.maximumDischargeCusecs.toLocaleString()} <span className="text-xs font-normal text-[#94A3B8]">cusecs</span>
          </div>
          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5 truncate">
            {summary.maximumDischargeStation}
          </div>
        </div>

        {/* KPI 4: Population at Risk */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3 text-left shadow-sm">
          <div className="flex items-center justify-between text-amber-300 text-[10px] font-mono uppercase tracking-wider font-bold">
            <span>{language === 'ne' ? 'जोखिममा जनसंख्या' : 'Population at Risk'}</span>
            <Users size={16} weight="bold" className="text-[#F59E0B]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
            {summary.totalDownstreamPopulationAtRisk.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-amber-400 mt-0.5 truncate">
            {summary.totalDownstreamPopulationAtRisk > 0
              ? (language === 'ne' ? 'तुरुन्त अलर्ट सन्देश प्रेषित' : 'Vernacular SOS Dispatched')
              : (language === 'ne' ? 'जोखिममुक्त अवस्था' : 'Riparian Zones Clear')}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          3. REAL-TIME RIVER INFORMATION CARDS (MONITORED TERAI RIVERS)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
          <span className="flex items-center gap-1.5">
            <Waves size={16} weight="bold" className="text-cyan-400" />
            <span>
              {language === 'ne'
                ? 'नेपालका प्रमुख नदीहरू (प्रत्यक्ष जलस्तर तथ्यांक)'
                : 'Major Nepal Terai Rivers (Real-Time Hydrological Telemetry)'}
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8]">
              ({activeRivers.length} {language === 'ne' ? 'नदीहरू' : 'Rivers'})
            </span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 hidden sm:inline">
            {language === 'ne'
              ? 'प्रत्यक्ष स्ट्रिम हेर्न कुनै पनि नदी कार्डमा ट्याप गर्नुहोस्'
              : 'Click any river card for live hydrograph ticker'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {activeRivers.map((riv) => {
            const isDanger = riv.status === 'extreme_flood' || riv.status === 'danger';
            const isWarning = riv.status === 'warning';
            return (
              <button
                key={riv.id}
                onClick={() => {
                  setSelectedRiverForModal(riv);
                  setIsRiverModalOpen(true);
                }}
                className={`group text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5 ${
                  isDanger
                    ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/30 to-[#1E293B] hover:border-rose-500/70'
                    : isWarning
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-[#1E293B] hover:border-amber-500/70'
                    : 'border-white/10 bg-[#1E293B] hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-[#F8FAFC] truncate group-hover:text-cyan-300">
                    {language === 'ne' ? riv.nepaliName.split(' ')[0] : riv.name.replace(' River', '')}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isDanger
                        ? 'bg-[#EF4444] animate-ping'
                        : isWarning
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#10B981]'
                    }`}
                  />
                </div>

                <div className="flex items-baseline gap-1 mt-1 font-mono">
                  <span className={`text-base font-black ${
                    isDanger ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-cyan-300'
                  }`}>
                    {riv.currentLevelMeters}m
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    / {riv.dangerLevelMeters}m
                  </span>
                </div>

                <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[9.5px] font-mono text-[#94A3B8]">
                  <span className="truncate">{riv.basinName}</span>
                  <span className="text-cyan-400 font-bold shrink-0">{riv.dischargeCusecs.toLocaleString()} cfs</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. UNIFIED CONTROL BAR: ON-DEMAND STATION SELECTOR + BASIN FILTER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-[#1E293B] p-2.5 sm:p-3 space-y-2 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* ON-DEMAND STATION SELECTOR DROPDOWN (Primary Requirement) */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-full sm:max-w-md">
              <select
                value={selectedStation?.id || ''}
                onChange={(e) => {
                  const st = gauges.find((g) => g.id === e.target.value);
                  if (st) handleStationSelect(st);
                }}
                className="w-full appearance-none rounded-lg border border-cyan-500/40 bg-[#0F172A] px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 cursor-pointer shadow-sm pl-8 pr-8"
              >
                <option value="" disabled>
                  {language === 'ne' ? 'जलमापन केन्द्र छान्नुहोस्...' : 'Select Gauged River Station...'}
                </option>
                {filteredGauges.map((g) => {
                  const isD = g.status === 'danger' || g.status === 'extreme_flood';
                  const isW = g.status === 'warning';
                  const statusSymbol = isD ? '[DANGER]' : isW ? '[WARNING]' : '[SAFE]';
                  return (
                    <option key={g.id} value={g.id} className="bg-[#0F172A] text-white">
                      {statusSymbol} {language === 'ne' ? g.nepaliName : g.name} &bull; {g.river} ({g.currentLevelMeters}m / {g.dangerLevelMeters}m)
                    </option>
                  );
                })}
              </select>
              <Waves size={15} weight="bold" className="absolute left-2.5 top-2.5 text-cyan-400 pointer-events-none" />
              <CaretDown size={14} weight="bold" className="absolute right-2.5 top-2.5 text-[#94A3B8] pointer-events-none" />
            </div>

            {selectedStation && (
              <button
                onClick={() => handleStationSelect(selectedStation)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-2 text-xs font-bold text-cyan-300 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
              >
                <Gauge size={14} weight="bold" className="text-cyan-400" />
                <span>{language === 'ne' ? 'विवरण हेर्नुहोस्' : 'Inspect Hydrograph'}</span>
              </button>
            )}
          </div>

          {/* Basin, Status & Date Filters */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Single Clean Filter by River Basin Dropdown */}
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-2 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">{language === 'ne' ? 'सबै बेसिनहरू (All Basins)' : 'Filter by River Basin (All)'}</option>
              <option value="Koshi">{language === 'ne' ? 'सप्तकोशी कोरिडोर (Koshi)' : 'Koshi Basin Corridor'}</option>
              <option value="Bagmati">{language === 'ne' ? 'बागमती / कमला (Bagmati)' : 'Bagmati / Lalbakeya Delta'}</option>
              <option value="Narayani">{language === 'ne' ? 'नारायणी / गण्डकी (Narayani)' : 'Narayani / Gandaki Basin'}</option>
              <option value="Rapti">{language === 'ne' ? 'पश्चिम राप्ती (West Rapti)' : 'West Rapti Corridor'}</option>
              <option value="Karnali">{language === 'ne' ? 'कर्णाली / मोहना (Karnali)' : 'Karnali / Mohana Corridor'}</option>
            </select>

            {/* Severity Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-2 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">{language === 'ne' ? 'सबै अवस्था' : 'Severity Status (All)'}</option>
              <option value="danger">{language === 'ne' ? 'खतरा विन्दु पार' : 'Danger Breached'}</option>
              <option value="extreme_flood">{language === 'ne' ? 'अत्यन्त उच्च बाढी' : 'Extreme Deluge'}</option>
              <option value="warning">{language === 'ne' ? 'सतर्कता तह' : 'Warning Watch'}</option>
              <option value="normal">{language === 'ne' ? 'सामान्य बहाव' : 'Normal Flow'}</option>
            </select>

            {/* Scenario / Observation Date Selector */}
            <select
              value={selectedScenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              title="Select Real Hydrological Date & Monsoon Flood Scenario"
              className="rounded-lg border border-white/10 bg-[#0F172A] px-2.5 py-2 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[150px] sm:max-w-none truncate"
            >
              {HISTORICAL_FLOOD_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-[#0F172A] text-white">
                  {language === 'ne' ? sc.nepaliLabel : sc.label}
                </option>
              ))}
              <option value="custom" className="bg-[#0F172A] text-white">
                {language === 'ne' ? 'कस्टम मिति...' : 'Custom Date...'}
              </option>
            </select>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-2 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 transition-colors cursor-pointer"
                title="Reset All Filters"
                aria-label="सबै रिसेट गर्नुहोस्"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Compact search input row */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={
                language === 'ne'
                  ? 'नदी वा केन्द्र खोज्नुहोस् (उदा: सप्तकोशी, बागमती, नारायणी, चतरा, DHM-695)...'
                  : 'Search river, district, settlement or DHM station code (e.g., Koshi, Devghat, Gaur, DHM-695)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-[#0F172A] pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 border border-white/10 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#94A3B8] hover:text-white"
                title="Clear search query"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
            {filteredGauges.length} stations active
          </span>
        </div>

        {/* Empty Search / Filter Alert State */}
        {filteredGauges.length === 0 && (
          <div className="p-3 text-center text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg mt-1 font-mono">
            {language === 'ne'
              ? 'कुनै केन्द्र फेला परेन • कृपया खोज शब्द वा फिल्टर परिवर्तन गर्नुहोस्'
              : 'No stations found • Please adjust search query or filter'}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          4. MAIN RIVER TELEMETRY MAP CANVAS (CONTAINER: <div id="map"></div>)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#1E293B] shadow-2xl">
        <RiverGaugeMap
          gauges={filteredGauges}
          selectedStation={selectedStation}
          onSelectStation={(st) => handleStationSelect(st)}
          onOpenSosModal={handleOpenSosModal}
          language={language}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. ON-DEMAND STATION INSPECTION SLIDE-OVER DRAWER / MODAL
             (Replaces the 7 heavy static cards with zero vertical page scroll)
      ─────────────────────────────────────────────────────────────────────── */}
      {isInspectorOpen && inspectedStation && (
        <div className="fixed inset-0 z-[600] flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl bg-[#0F172A] border-l border-white/10 shadow-2xl h-full flex flex-col z-[610] overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-[#1E293B]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      inspectedStation.status === 'danger' || inspectedStation.status === 'extreme_flood'
                        ? 'bg-red-500/20 text-[#EF4444] border-red-500/40'
                        : inspectedStation.status === 'warning'
                        ? 'bg-amber-500/20 text-[#F59E0B] border-amber-500/40'
                        : 'bg-emerald-500/20 text-[#10B981] border-emerald-500/40'
                    }`}
                  >
                    {inspectedStation.status === 'danger' || inspectedStation.status === 'extreme_flood'
                      ? 'DANGER BREACHED'
                      : inspectedStation.status === 'warning'
                      ? 'WARNING WATCH'
                      : 'NORMAL FLOW'}
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    DHM ID: {inspectedStation.dhmStationNumber} &bull; {inspectedStation.basin} Basin
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#F8FAFC] tracking-tight truncate mt-1">
                  {language === 'ne' ? inspectedStation.nepaliName : inspectedStation.name}
                  <span className="text-sm font-normal text-[#94A3B8] ml-2 font-mono">
                    ({inspectedStation.river})
                  </span>
                </h2>
                <p className="text-xs text-[#94A3B8] truncate">
                  {inspectedStation.district} District &bull; Officer: {inspectedStation.stationOfficer} ({inspectedStation.contactNumber})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Action Button: Generate Vernacular SOS Broadcast */}
                <button
                  onClick={() => {
                    handleOpenSosModal(inspectedStation);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-[#EF4444] hover:bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  title="Generate Vernacular SOS Broadcast"
                >
                  <Radio size={15} weight="bold" className="animate-pulse" />
                  <span className="hidden sm:inline">{language === 'ne' ? 'आपतकालीन SOS प्रसारण' : 'Generate Vernacular SOS'}</span>
                </button>

                {/* Close Drawer Button */}
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="rounded-lg p-2 text-[#94A3B8] hover:text-white hover:bg-[#334155] border border-white/10 transition-colors cursor-pointer"
                  title="Close Inspector"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Drawer Body: Single Detailed Station Inspection */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <WaterGaugeVisualizer
                gauge={inspectedStation}
                language={language}
                onOpenSosModal={handleOpenSosModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          VERNACULAR SOS ALERT GENERATOR MODAL
      ─────────────────────────────────────────────────────────────────────── */}
      <VernacularSosModal
        gauge={modalStation}
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        language={language}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          LIVE RIVER TELEMETRY INSPECTOR MODAL
      ─────────────────────────────────────────────────────────────────────── */}
      <LiveRiverTelemetryModal
        river={selectedRiverForModal}
        isOpen={isRiverModalOpen}
        onClose={() => setIsRiverModalOpen(false)}
        language={language}
        onOpenSosModal={(riv) => {
          const matchingStation = gauges.find(
            (g) =>
              g.river.toLowerCase().includes(riv.name.toLowerCase()) ||
              riv.name.toLowerCase().includes(g.river.toLowerCase())
          );
          if (matchingStation) {
            handleOpenSosModal(matchingStation);
          } else if (gauges.length > 0) {
            handleOpenSosModal(gauges[0]);
          }
        }}
      />
    </div>
  );
};
