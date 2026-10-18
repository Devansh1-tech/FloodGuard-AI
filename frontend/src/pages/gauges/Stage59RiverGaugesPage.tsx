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
} from 'lucide-react';
import {
  TERAI_RIVER_GAUGES,
  RiverGaugeStation,
} from '@/data/teraiRiverGauges';
import {
  fetchRiverGauges,
  computeTelemetrySummary,
  TelemetrySummary,
} from '@/services/riverGaugeService';
import { WaterGaugeVisualizer } from '@/components/gauges/WaterGaugeVisualizer';
import { RiverGaugeMap } from '@/components/gauges/RiverGaugeMap';
import { VernacularSosModal } from '@/components/gauges/VernacularSosModal';

export const Stage59RiverGaugesPage: React.FC = () => {
  const [gauges, setGauges] = useState<RiverGaugeStation[]>(TERAI_RIVER_GAUGES);
  const [selectedStation, setSelectedStation] = useState<RiverGaugeStation | null>(TERAI_RIVER_GAUGES[0]);
  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'ne'>('ne'); // Default to Nepali vernacular
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false);
  const [modalStation, setModalStation] = useState<RiverGaugeStation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRiverGauges({
        basin: selectedBasin,
        status: selectedStatus,
      });
      setGauges(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBasin, selectedStatus]);

  const filteredGauges = gauges.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.nepaliName.toLowerCase().includes(q) ||
      g.river.toLowerCase().includes(q) ||
      g.nepaliRiver.toLowerCase().includes(q) ||
      g.district.toLowerCase().includes(q)
    );
  });

  const summary: TelemetrySummary = computeTelemetrySummary(gauges);

  const handleOpenSosModal = (station: RiverGaugeStation) => {
    setModalStation(station);
    setIsSosModalOpen(true);
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
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TELEMETRY SUMMARY HUD CARDS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#0d1320]/90 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">{language === 'ne' ? 'अनुगमन गरिएका केन्द्र' : 'Monitored DHM Gauges'}</span>
            <Waves className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {summary.totalStationsMonitored}
          </div>
          <span className="text-[10px] text-cyan-400 font-medium block mt-0.5">
            {language === 'ne' ? '२१ तराई जिल्ला कोरिडोर' : '21 Lowland Terai Districts'}
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 shadow-lg backdrop-blur-sm ring-1 ring-rose-500/20">
          <div className="flex items-center justify-between text-rose-300 text-xs">
            <span className="font-semibold">{language === 'ne' ? 'खतरा विन्दु पार गरेका नदी' : 'Danger Level Breached'}</span>
            <AlertOctagon className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-1">
            {summary.stationsInDangerOrExtreme} / {summary.totalStationsMonitored}
          </div>
          <span className="text-[10px] text-rose-300/80 font-medium block mt-0.5">
            {language === 'ne' ? 'तुरुन्त निकासी निर्देशन जारी' : 'Immediate Evacuation Orders Active'}
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
          <span className="text-[10px] text-amber-400/80 font-medium block mt-0.5">
            {language === 'ne' ? 'तुरुन्त अलर्ट सन्देश प्रेषित' : 'Receiving Vernacular SOS Alerts'}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          SEARCH & BASIN FILTER CONTROLS
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={
              language === 'ne'
                ? 'नदी वा केन्द्र खोज्नुहोस् (उदा: सप्तकोशी, बागमती, नारायणी, चतरा...)'
                : 'Search river or gauge station (e.g., Koshi, Bagmati, Narayani, Devghat)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Basin Filter */}
          <select
            value={selectedBasin}
            onChange={(e) => setSelectedBasin(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">{language === 'ne' ? 'सबै नदी बेसिनहरू (All Basins)' : 'All River Basins'}</option>
            <option value="Koshi">{language === 'ne' ? 'सप्तकोशी कोरिडोर' : 'Koshi Basin Corridor'}</option>
            <option value="Bagmati">{language === 'ne' ? 'बागमती / लालबकैया' : 'Bagmati / Lalbakeya Delta'}</option>
            <option value="Narayani">{language === 'ne' ? 'नारायणी / गण्डकी' : 'Narayani / Gandaki'}</option>
            <option value="Rapti">{language === 'ne' ? 'पश्चिम राप्ती बेसिन' : 'West Rapti Corridor'}</option>
            <option value="Karnali">{language === 'ne' ? 'कर्णाली / मोहना' : 'Karnali / Mohana Corridor'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">{language === 'ne' ? 'सबै अवस्था (All Status)' : 'All Severity Levels'}</option>
            <option value="extreme_flood">{language === 'ne' ? 'अत्यन्त उच्च बाढी (Extreme)' : 'Extreme Flood (Level 4)'}</option>
            <option value="danger">{language === 'ne' ? 'खतरा विन्दु पार (Danger)' : 'Danger Breached'}</option>
            <option value="warning">{language === 'ne' ? 'सतर्कता तह (Warning)' : 'Warning Watch'}</option>
            <option value="normal">{language === 'ne' ? 'सामान्य बहाव (Normal)' : 'Normal Flow'}</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TACTICAL HYDROLOGICAL MAP (LEAFLET INTERACTIVE)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>
              {language === 'ne'
                ? 'तराई नदी जलसतह सेन्सर नक्सा (नेपाल DHM नेटवर्क)'
                : 'Nepal Terai River Telemetry Map (DHM Real-Time Sensors)'}
            </span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {language === 'ne' ? 'केन्द्र छनोट गर्न पिनमा क्लिक गर्नुहोस्' : 'Click any pin to inspect station'}
          </span>
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
    </div>
  );
};
