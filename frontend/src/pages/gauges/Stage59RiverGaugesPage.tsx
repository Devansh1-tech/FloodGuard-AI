/**
 * Stage59RiverGaugesPage.tsx — Stage 5.9 DHM River Gauge Telemetry & Vernacular SOS Alerts.
 *
 * Implements Point 11 of the Master Plan:
 * 1. Nepal DHM Real-Time River Gauge Telemetry across 21 Terai districts.
 * 2. Visual liquid water gauge bars (Normal, Warning, Danger thresholds).
 * 3. 12-Hour hydrographs and discharge telemetry.
 * 4. Multi-channel Vernacular Nepali SOS Alert Generator (SMS, WhatsApp, Radio FM).
 * 5. Full Bilingual Switcher (नेपाली / English).
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  Filter,
  Globe,
  HeartPulse,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Volume2,
  Waves,
  Zap,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
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
  const activeRivers = React.useMemo(() => {
    return syncNepalRiversWithGauges(NEPAL_RIVERS, gauges);
  }, [gauges]);

  const filteredGauges = gauges.filter((g) => {
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

  // Ensure selected station remains valid when filters or scenarios change
  useEffect(() => {
    if (filteredGauges.length > 0) {
      if (!selectedStation || !filteredGauges.some((g) => g.id === selectedStation.id)) {
        setSelectedStation(filteredGauges[0]);
      }
    } else {
      setSelectedStation(null);
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
  const summary: TelemetrySummary = computeTelemetrySummary(
    filteredGauges.length > 0 ? filteredGauges : gauges
  );

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

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────────────
          PAGE HEADER & BILINGUAL LANGUAGE SWITCHER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5" />
              STAGE 5.9: DHM RIVER GAUGES &amp; VERNACULAR SOS ALERTS
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              Point 11: Real-Time Early Warning
            </span>
            <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
              Nepal DHM Grounded
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-rose-400 animate-pulse" />
            <span>
              {language === 'ne'
                ? 'नदी जलसतह टेलिमेट्री तथा नेपाली आपतकालीन चेतावनी'
                : 'Real-Time River Gauge Telemetry & Vernacular Alerts'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-4xl">
            {language === 'ne'
              ? 'नेपाल जल तथा मौसम विज्ञान विभाग (DHM) को प्रत्यक्ष जलसतह सेन्सरहरूको आधारमा तराईका २१ जिल्लाका प्रमुख नदीहरूको खतरा विन्दु अनुगमन। एक क्लिकमा नेपाली भाषामा एसएमएस, व्हाट्सएप र रेडियो एफएम प्रसारण सूचना उत्पादन।'
              : 'Direct integration with Nepal Department of Hydrology & Meteorology (DHM) telemetry sensors across the 21 Terai districts. Automated generation of vernacular Nepali and English SOS alerts for cellular SMS, WhatsApp, and community FM radio.'}
          </p>
        </div>

        {/* Right Controls: Bilingual Switcher & Telemetry Sync */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Bilingual Toggle Button */}
          <div className="flex items-center rounded-xl bg-slate-850 border border-slate-700 p-1 bg-slate-900 shadow-md">
            <button
              onClick={() => setLanguage('ne')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                language === 'ne'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              नेपाली (Vernacular)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'ne' ? 'ताजा गर्नुहोस्' : 'Sync Telemetry'}</span>
          </button>

          {/* Data Provenance Info Button */}
          <button
            onClick={() => setShowProvenanceInfo(!showProvenanceInfo)}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 px-3 py-2 text-xs font-bold text-cyan-300 transition-all shadow-md cursor-pointer"
            title="View DHM Data Sources & Architecture"
          >
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>{language === 'ne' ? 'तथ्यांक स्रोत (DHM Info)' : 'DHM Data Info'}</span>
            {showProvenanceInfo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          DHM DATA PROVENANCE & REAL DATA ARCHITECTURE BANNER (COLLAPSIBLE)
      ─────────────────────────────────────────────────────────────────────── */}
      {showProvenanceInfo && (
        <div className="rounded-2xl border border-cyan-500/30 bg-[#091322] p-4 sm:p-6 space-y-3 shadow-xl backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>
                {language === 'ne'
                  ? 'नेपाल सरकार जल तथा मौसम विज्ञान विभाग (DHM) प्रत्यक्ष तथ्यांक प्रणाली'
                  : 'Government of Nepal DHM Real-Time Hydrological Telemetry Network'}
              </span>
            </div>
            <a
              href="http://hydrology.gov.np/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              <span>hydrology.gov.np</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase">1. Real Sensor Transducers</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'ne'
                  ? 'सप्तकोशी, बागमती, नारायणी, पश्चिम राप्ती र कर्णालीका ४७ वटा जलमापन केन्द्रहरूमा जडित रडार वाटर लेभल सेन्सर र प्रेसर ट्रान्सड्युसरहरूबाट प्रत्येक १०-१५ मिनेटमा जीएसएम/स्याटेलाइट मार्फत जलसतह तथ्यांक संकलन हुन्छ।'
                  : 'Water level data is collected at 47+ automated hydrological stations using Ott radar water level sensors and pressure transducers transmitting via Ncell/NTC telemetry every 10–15 minutes.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <span className="font-mono text-[10px] text-amber-400 font-bold uppercase">2. Warning &amp; Danger Benchmarks</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'ne'
                  ? 'प्रत्येक केन्द्रको लागि नेपाल DHM ले आधिकारिक चेतावनी तह (Warning Level) र खतरा तह (Danger Level) निर्धारण गरेको छ, जसमा जलस्तर पुग्दा स्वतः रातो साइरन र एसएमएस अलर्ट जारी हुन्छ।'
                  : 'Official DHM warning thresholds (सतर्कता तह) and danger thresholds (खतरा तह) in meters are calibrated based on riverbed bathymetry and embankment crest heights.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-1">
              <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">3. Date &amp; Historic Flood Replay</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === 'ne'
                  ? 'तल दिइएको "मिति / बाढी परिदृश्य" मेनुबाट २०२४ को असोज रेकर्ड बाढी, २०२३ को सतर्कता चरण, वा हिउँदको सामान्य बहाव चयन गरी ऐतिहासिक तथ्यांक हेर्न सकिन्छ।'
                  : 'You can adjust water levels by date or scenario (e.g. Sept 2024 Record Deluge, July 2023 Warning Phase, or March 2024 Normal Flow) to inspect historical flood hydrographs.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TELEMETRY SUMMARY HUD CARDS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0d1320]/90 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{language === 'ne' ? 'अनुगमन गरिएका केन्द्र' : 'Monitored DHM Gauges'}</span>
            <Waves className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-1.5">
            <span>{summary.totalStationsMonitored}</span>
            {filteredGauges.length !== gauges.length && (
              <span className="text-xs text-slate-400 font-normal font-sans">
                ({language === 'ne' ? `${gauges.length} मध्ये` : `of ${gauges.length}`})
              </span>
            )}
          </div>
          <span className="text-[10px] text-cyan-400 font-medium block mt-0.5 truncate">
            {filteredGauges.length !== gauges.length
              ? (language === 'ne' ? 'फिल्टर गरिएको सक्रिय केन्द्रहरू' : 'Filtered Subset Active')
              : (language === 'ne' ? '२१ तराई जिल्ला कोरिडोर' : '21 Lowland Terai Districts')}
          </span>
        </div>

        <div className={`rounded-2xl border p-4 shadow-lg backdrop-blur-sm ring-1 transition-colors ${
          summary.stationsInDangerOrExtreme > 0
            ? 'border-rose-500/40 bg-rose-950/20 ring-rose-500/20'
            : 'border-emerald-500/40 bg-emerald-950/20 ring-emerald-500/20'
        }`}>
          <div className={`flex items-center justify-between text-xs ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            <span className="font-semibold">{language === 'ne' ? 'खतरा विन्दु पार गरेका नदी' : 'Danger Level Breached'}</span>
            <AlertOctagon className={`h-4 w-4 ${summary.stationsInDangerOrExtreme > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {summary.stationsInDangerOrExtreme} / {summary.totalStationsMonitored}
          </div>
          <span className={`text-[10px] font-medium block mt-0.5 truncate ${
            summary.stationsInDangerOrExtreme > 0 ? 'text-rose-300/80' : 'text-emerald-300/80'
          }`}>
            {summary.stationsInDangerOrExtreme > 0
              ? (language === 'ne' ? 'तुरुन्त निकासी निर्देशन जारी' : 'Immediate Evacuation Orders Active')
              : (language === 'ne' ? 'कुनै खतरा छैन • सामान्य सुरक्षित बहाव' : 'Safe Baseline • Zero Danger Breaches')}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0d1320]/90 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{language === 'ne' ? 'अधिकतम जल प्रवाह' : 'Peak Discharge Flow'}</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono mt-1 truncate">
            {summary.maximumDischargeCusecs.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
            cusecs &bull; {summary.maximumDischargeStation}
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span className="font-semibold">{language === 'ne' ? 'जोखिममा रहेको तटीय जनसंख्या' : 'Downstream Population at Risk'}</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
            {summary.totalDownstreamPopulationAtRisk.toLocaleString()}
          </div>
          <span className="text-[10px] text-amber-400/80 font-medium block mt-0.5 truncate">
            {summary.totalDownstreamPopulationAtRisk > 0
              ? (language === 'ne' ? 'तुरुन्त अलर्ट सन्देश प्रेषित' : 'Receiving Vernacular SOS Alerts')
              : (language === 'ne' ? 'जोखिममुक्त • सुरक्षित अवस्था' : 'Standard Baseline • Riparian Zones Safe')}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SEARCH, BASIN, SEVERITY & DATE FILTER CONTROLS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Text Search with Clear Button and Focus Glow */}
          <div className="flex items-center gap-2 flex-1 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/80 focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={
                language === 'ne'
                  ? 'नदी वा केन्द्र खोज्नुहोस् (उदा: सप्तकोशी, बागमती, नारायणी, चतरा, DHM-695...)'
                  : 'Search river or gauge station (e.g., Koshi, Bagmati, Narayani, Devghat, DHM-695)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                title="Clear search query"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date & Scenario Selector */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs focus-within:border-cyan-500/70">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <select
                value={selectedScenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none font-semibold cursor-pointer max-w-[210px] sm:max-w-none truncate"
                title="Select Real Hydrological Date & Monsoon Flood Scenario"
              >
                {HISTORICAL_FLOOD_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id} className="bg-slate-900 text-white">
                    {language === 'ne' ? sc.nepaliLabel : sc.label}
                  </option>
                ))}
                <option value="custom" className="bg-slate-900 text-white">
                  {language === 'ne' ? '📅 आफ्नै मिति छान्नुहोस् (Custom Date)...' : '📅 Custom Observation Date...'}
                </option>
              </select>
            </div>

            {/* Custom Date Input (Shown when user wants to simulate any calendar date) */}
            {isCustomDate && (
              <div className="flex items-center gap-1 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-cyan-500/60 shadow-inner">
                <span className="text-[10px] text-cyan-400 font-mono font-bold">DATE:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-cyan-300 focus:outline-none font-mono cursor-pointer"
                  title="Choose any calendar date to replay seasonal flow"
                />
              </div>
            )}
          </div>
        </div>

        {/* Basin and Severity Dropdowns */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              {language === 'ne' ? 'फिल्टरहरू:' : 'Filter Corridors:'}
            </span>

            {/* Basin Filter */}
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">{language === 'ne' ? 'सबै नदी बेसिनहरू (All Basins)' : 'All River Basins'}</option>
              <option value="Koshi">{language === 'ne' ? 'सप्तकोशी कोरिडोर (Koshi & Kankai)' : 'Koshi Basin Corridor'}</option>
              <option value="Bagmati">{language === 'ne' ? 'बागमती / लालबकैया / कमला' : 'Bagmati / Lalbakeya Delta'}</option>
              <option value="Narayani">{language === 'ne' ? 'नारायणी / गण्डकी / तिनाउ' : 'Narayani / Gandaki'}</option>
              <option value="Rapti">{language === 'ne' ? 'पश्चिम राप्ती तथा बबई' : 'West Rapti Corridor'}</option>
              <option value="Karnali">{language === 'ne' ? 'कर्णाली तथा मोहना' : 'Karnali / Mohana Corridor'}</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">{language === 'ne' ? 'सबै अवस्था (All Status)' : 'All Severity Levels'}</option>
              <option value="extreme_flood">{language === 'ne' ? 'अत्यन्त उच्च बाढी (Extreme)' : 'Extreme Flood (Level 4)'}</option>
              <option value="danger">{language === 'ne' ? 'खतरा विन्दु पार (Danger Breached)' : 'Danger Breached'}</option>
              <option value="warning">{language === 'ne' ? 'सतर्कता तह (Warning Watch)' : 'Warning Watch'}</option>
              <option value="normal">{language === 'ne' ? 'सामान्य बहाव (Normal Flow)' : 'Normal Flow'}</option>
            </select>
          </div>

          {/* Reset All Filters Button */}
          <button
            onClick={handleResetFilters}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              isFilterActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="h-3 w-3" />
            <span>{language === 'ne' ? 'सबै रिसेट गर्नुहोस्' : 'Reset All Filters'}</span>
          </button>
        </div>

        {/* Active Filter Chips Bar (Visible when any filter is non-default) */}
        {isFilterActive && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">Active:</span>

            {selectedScenario !== 'live_monsoon_deluge' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 font-medium">
                <span>{selectedScenario === 'custom' ? `Custom: ${selectedDate}` : selectedScenario.replace('_', ' ')}</span>
                <button
                  onClick={() => {
                    setSelectedScenario('live_monsoon_deluge');
                    setSelectedDate('2026-10-18');
                    setIsCustomDate(false);
                  }}
                  className="hover:text-white cursor-pointer"
                  title="Remove scenario filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedBasin !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-medium">
                <span>Basin: {selectedBasin}</span>
                <button
                  onClick={() => setSelectedBasin('all')}
                  className="hover:text-white cursor-pointer"
                  title="Remove basin filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium">
                <span>Severity: {selectedStatus.replace('_', ' ')}</span>
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-white cursor-pointer"
                  title="Remove severity filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-medium">
                <span>Query: "{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white cursor-pointer"
                  title="Remove search query"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <span className="text-[10px] font-mono text-slate-400 ml-auto">
              {filteredGauges.length} {language === 'ne' ? 'स्टेशन म्याच भयो' : 'stations matched'}
            </span>
          </div>
        )}
      </div>

      {/* Empty State Banner if no stations match */}
      {filteredGauges.length === 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-amber-300 font-bold">
                {language === 'ne' ? 'कुनै केन्द्र फेला परेन' : 'No Gauge Stations Match This Filter Combination'}
              </strong>
              <span>
                {language === 'ne'
                  ? `छनोट गरिएको बेसिन ("${selectedBasin}") र अवस्था ("${selectedStatus}") मा यो मितिमा कुनै नदी छैन।`
                  : `In the "${selectedBasin}" corridor on this date, no stations are at "${selectedStatus}". (Stations may be at Danger level during peak deluge, or Normal during winter).`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedStatus('all')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Show All Severities
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TACTICAL HYDROLOGICAL MAP (LEAFLET INTERACTIVE WITH DOTTED BASINS & RIVERS)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>
              {language === 'ne'
                ? 'तराई नदी तथा बेसिन जलसतह नक्सा (DHM नेटवर्क • थोप्ला रेखाहरू)'
                : 'Nepal Terai River Telemetry Map (DHM Sensors • Dotted Basins & Rivers)'}
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-normal">
              ({filteredGauges.length} {language === 'ne' ? 'स्टेशन' : 'stations'} &bull; 12 {language === 'ne' ? 'नदीहरू' : 'rivers'})
            </span>
          </span>
          <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>
              {language === 'ne'
                ? 'नदी रेखा वा पिनमा ट्याप गरी प्रत्यक्ष विवरण हेर्नुहोस्'
                : 'Tap any dotted river line or station pin for live telemetry updates'}
            </span>
          </span>
        </div>

        {/* Quick Tap River Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0 flex items-center gap-1">
            <Waves className="h-3 w-3 text-cyan-400" />
            <span>{language === 'ne' ? 'नदीहरू' : 'Rivers'}:</span>
          </span>
          {activeRivers.map((riv) => {
            const isDanger = riv.status === 'extreme_flood' || riv.status === 'danger';
            return (
              <button
                key={riv.id}
                onClick={() => {
                  setSelectedRiverForModal(riv);
                  setIsRiverModalOpen(true);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold shrink-0 border transition-all cursor-pointer ${
                  isDanger
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/60 shadow-sm shadow-rose-950/40'
                    : 'bg-slate-900 border-slate-700/80 text-cyan-300 hover:border-cyan-500/50'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDanger ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`}></span>
                <span>{language === 'ne' ? riv.nepaliName.split(' ')[0] : riv.name.replace(' River', '')}</span>
                <span className="text-[10px] opacity-80">({riv.currentLevelMeters}m)</span>
              </button>
            );
          })}
        </div>

        <RiverGaugeMap
          gauges={filteredGauges}
          selectedStation={selectedStation}
          onSelectStation={(st) => setSelectedStation(st)}
          onOpenSosModal={handleOpenSosModal}
          language={language}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          INDIVIDUAL RIVER GAUGES GRID (ANIMATED LIQUID VISUALIZERS)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-blue-400" />
            <span>
              {language === 'ne'
                ? `सक्रिय जलमापन केन्द्रहरू (${filteredGauges.length})`
                : `Active Hydrological Monitoring Stations (${filteredGauges.length})`}
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            {language === 'ne' ? '१२-घण्टे प्रवृत्ति र तटीय जोखिम बस्ती' : '12-Hour hydrograph & downstream riparian zones'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGauges.map((gauge) => (
            <WaterGaugeVisualizer
              key={gauge.id}
              gauge={gauge}
              language={language}
              onOpenSosModal={handleOpenSosModal}
            />
          ))}
        </div>
      </div>

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
