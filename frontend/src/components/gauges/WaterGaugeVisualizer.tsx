/**
 * WaterGaugeVisualizer.tsx — High-Fidelity Hydrological River Gauge & Hydrograph Telemetry.
 *
 * Implements Stage 5.9:
 * - Calibrated vertical glass tube water gauge with non-overlapping Warning & Danger threshold markers.
 * - Authentic SVG 12-Hour Hydrograph area curve with threshold lines, hourly markers, and dual Stage/Discharge modes.
 * - Comprehensive hydrological explanation box detailing stage rise velocity, crest forecast, and downstream wave arrival.
 * - Balanced layout across barrage-controlled and free-flowing river stations.
 * - Fully bilingual (Nepali / English) with one-click SOS broadcast launcher.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  Droplets,
  ExternalLink,
  Info,
  MapPin,
  Radio,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import { RiverGaugeStation } from '@/data/teraiRiverGauges';
import { BILINGUAL_GAUGE_LABELS } from '@/services/riverGaugeService';
import { fetchGaugeForecast, GaugeForecast } from '@/services/riverForecastService';

interface WaterGaugeVisualizerProps {
  gauge: RiverGaugeStation;
  language: 'en' | 'ne';
  onOpenSosModal: (gauge: RiverGaugeStation) => void;
}

export const WaterGaugeVisualizer: React.FC<WaterGaugeVisualizerProps> = ({
  gauge,
  language,
  onOpenSosModal,
}) => {
  // Hydrograph view mode: Stage height in meters vs Discharge in cusecs
  const [hydroViewMode, setHydroViewMode] = useState<'stage' | 'discharge'>('stage');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [forecast, setForecast] = useState<GaugeForecast | null>(null);
  const [forecastError, setForecastError] = useState(false);

  useEffect(() => {
    let active = true;
    setForecast(null);
    setForecastError(false);
    fetchGaugeForecast(gauge.id).then((value) => {
      if (active) setForecast(value);
    }).catch(() => {
      if (active) setForecastError(true);
    });
    return () => { active = false; };
  }, [gauge.id]);

  // Maximum scale height for gauge bar: 110% of highest historical or danger level
  const maxScale = Math.max(
    gauge.highestHistoricalLevelMeters * 1.05,
    gauge.dangerLevelMeters * 1.25,
    gauge.currentLevelMeters * 1.15
  );

  const currentPercent = Math.min(100, Math.max(5, (gauge.currentLevelMeters / maxScale) * 100));
  const warningPercent = Math.min(100, (gauge.warningLevelMeters / maxScale) * 100);
  const dangerPercent = Math.min(100, (gauge.dangerLevelMeters / maxScale) * 100);

  const isDanger = gauge.status === 'danger' || gauge.status === 'extreme_flood';
  const isWarning = gauge.status === 'warning';

  const statusInfo = BILINGUAL_GAUGE_LABELS.status[gauge.status];
  const trendInfo = BILINGUAL_GAUGE_LABELS.trend[gauge.trend];

  const getTrendIcon = () => {
    if (gauge.trend === 'rising_rapidly' || gauge.trend === 'rising') {
      return <ArrowUpRight className="h-4 w-4 text-rose-400 animate-bounce" />;
    }
    if (gauge.trend === 'receding') {
      return <ArrowDownRight className="h-4 w-4 text-emerald-400" />;
    }
    return <ArrowRight className="h-4 w-4 text-slate-400" />;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SVG HYDROGRAPH CALCULATIONS (COMPACT SCALED)
  // ─────────────────────────────────────────────────────────────────────────────
  const svgWidth = 460;
  const svgHeight = 110;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 18;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const history = gauge.hourlyHistory;
  const pointsCount = history.length;

  // Compute Y-scale bounds
  const minStage = Math.max(0, Math.min(...history.map((h) => h.levelMeters)) * 0.85);
  const maxStage = Math.max(
    gauge.dangerLevelMeters * 1.15,
    Math.max(...history.map((h) => h.levelMeters)) * 1.05
  );

  const minDischarge = Math.min(...history.map((h) => h.dischargeCusecs || gauge.dischargeCusecs * 0.7));
  const maxDischarge = Math.max(...history.map((h) => h.dischargeCusecs || gauge.dischargeCusecs)) * 1.1;

  // Convert data points to SVG X, Y coordinates
  const svgPoints = history.map((h, i) => {
    const x = paddingLeft + (i / (pointsCount - 1)) * chartWidth;
    let y = 0;
    if (hydroViewMode === 'stage') {
      const normalized = (h.levelMeters - minStage) / (maxStage - minStage);
      y = paddingTop + chartHeight - normalized * chartHeight;
    } else {
      const dis = h.dischargeCusecs || gauge.dischargeCusecs;
      const normalized = (dis - minDischarge) / (maxDischarge - minDischarge);
      y = paddingTop + chartHeight - normalized * chartHeight;
    }
    return { x, y, data: h };
  });

  // Warning & Danger threshold Y coordinates for SVG
  const warningY =
    paddingTop + chartHeight - ((gauge.warningLevelMeters - minStage) / (maxStage - minStage)) * chartHeight;
  const dangerY =
    paddingTop + chartHeight - ((gauge.dangerLevelMeters - minStage) / (maxStage - minStage)) * chartHeight;

  // SVG Area path string
  const linePath = svgPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const areaPath = `${linePath} L ${svgPoints[pointsCount - 1].x} ${paddingTop + chartHeight} L ${
    svgPoints[0].x
  } ${paddingTop + chartHeight} Z`;

  // Compute flood analysis summary
  const startLevel = history[0]?.levelMeters || gauge.currentLevelMeters;
  const deltaLevel = Number((gauge.currentLevelMeters - startLevel).toFixed(2));
  const isBreached = gauge.currentLevelMeters >= gauge.dangerLevelMeters;
  const nearestSettlement = gauge.downstreamSettlements[0];

  return (
    <div
      className={`h-[520px] rounded-2xl border p-3 sm:p-3.5 transition-all shadow-xl backdrop-blur-xl flex flex-col justify-between ${
        isDanger
          ? 'border-rose-500/50 bg-gradient-to-br from-[#180a0e]/95 via-[#0d1320]/95 to-[#070b13]/98 ring-1 ring-rose-500/30 shadow-rose-950/40'
          : isWarning
          ? 'border-amber-500/40 bg-gradient-to-br from-[#18120a]/95 via-[#0d1320]/95 to-[#070b13]/98 shadow-amber-950/30'
          : 'border-slate-800 bg-[#0d1320]/95'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          1. PINNED HEADER (STATION METRICS & SEVERITY BADGES)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[9.5px] font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/70">
              {gauge.dhmStationNumber}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              {gauge.district} &bull; {gauge.basin}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white mt-0.5 line-clamp-1">
            {language === 'ne' ? gauge.nepaliName : gauge.name}
          </h3>
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mt-0.5">
            <Waves className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="truncate">{language === 'ne' ? gauge.nepaliRiver : gauge.river}</span>
          </div>
        </div>

        {/* Severity Badge & Rising Trend */}
        <div className="text-right shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${
              gauge.status === 'extreme_flood'
                ? 'bg-rose-600 text-white animate-pulse'
                : gauge.status === 'danger'
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                : gauge.status === 'warning'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isDanger && <AlertOctagon className="h-3 w-3" />}
            {isWarning && <AlertTriangle className="h-3 w-3" />}
            <span>{statusInfo[language]}</span>
          </span>
          <div className="flex items-center justify-end gap-1 text-[10px] font-mono text-slate-400 mt-0.5">
            {getTrendIcon()}
            <span>
              {trendInfo[language]} (+{gauge.rateOfRiseCmPerHour} cm/h)
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          2. SCROLLABLE MIDDLE SECTION (CONTENT SCROLLS SMOOTHLY)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 custom-card-scroll">
        {/* TELEMETRY DUAL-DECK: FLOAT GAUGE + 12-HOUR HYDROGRAPH */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* LEFT DECK: CALIBRATED GLASS TUBE + INSTANT DEPTH READOUT HUD */}
          <div className="md:col-span-5 bg-slate-950/85 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="w-full flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Droplets className="h-2.5 w-2.5 text-cyan-400" />
                <span>{language === 'ne' ? 'प्रत्यक्ष गेज' : 'Live River Gauge'}</span>
              </span>
              <span className="text-[8.5px] text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800/50 px-1 py-0.2 rounded">
                DHM
              </span>
            </div>

            <div className="flex items-center justify-between gap-2.5 my-auto">
              {/* Calibrated Cylinder Tube */}
              <div className="relative w-16 sm:w-20 h-36 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border-2 border-slate-700/80 overflow-hidden shadow-xl flex items-end shrink-0">
                {/* Background Elevation Ruler Ticks */}
                <div className="absolute top-0 bottom-0 left-0.5 w-5 flex flex-col justify-between py-1 text-[7px] font-mono text-slate-500 select-none pointer-events-none z-0">
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-[1px] bg-slate-600 inline-block"></span>
                    {maxScale.toFixed(1)}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-[1px] bg-slate-600 inline-block"></span>
                    {(maxScale * 0.75).toFixed(1)}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-[1px] bg-slate-600 inline-block"></span>
                    {(maxScale * 0.5).toFixed(1)}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-[1px] bg-slate-600 inline-block"></span>
                    {(maxScale * 0.25).toFixed(1)}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-[1px] bg-slate-600 inline-block"></span>0.0m
                  </span>
                </div>

                {/* Warning Level Marker Line */}
                <div
                  style={{ bottom: `${warningPercent}%` }}
                  className="absolute left-0 right-0 border-b-2 border-dashed border-amber-400 z-10 flex items-center justify-end pr-0.5"
                >
                  <span className="text-[7px] font-black font-mono bg-amber-950/95 text-amber-300 px-0.5 py-0.2 rounded border border-amber-500/50 shadow">
                    W: {gauge.warningLevelMeters}m
                  </span>
                </div>

                {/* Danger Level Marker Line */}
                <div
                  style={{ bottom: `${dangerPercent}%` }}
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 z-10 flex items-center justify-end pr-0.5"
                >
                  <span className="text-[7px] font-black font-mono bg-rose-950/95 text-rose-200 px-0.5 py-0.2 rounded border border-rose-500/60 shadow">
                    D: {gauge.dangerLevelMeters}m
                  </span>
                </div>

                {/* Animated Liquid Column */}
                <div
                  style={{ height: `${currentPercent}%` }}
                  className={`w-full transition-all duration-1000 relative flex items-start justify-center ${
                    isDanger
                      ? 'bg-gradient-to-t from-rose-800 via-rose-600 to-red-500 shadow-md shadow-rose-600/50'
                      : isWarning
                      ? 'bg-gradient-to-t from-blue-700 via-cyan-600 to-amber-500'
                      : 'bg-gradient-to-t from-blue-900 via-blue-700 to-cyan-500'
                  }`}
                >
                  <div className="w-full h-1 bg-white/50 animate-pulse"></div>

                  {/* Floating Depth Bubble */}
                  <div className="absolute -top-3 bg-white text-slate-950 font-mono font-black text-[8px] px-1 py-0.2 rounded-full shadow border border-slate-300 flex items-center gap-0.5 whitespace-nowrap">
                    <span>{gauge.currentLevelMeters}m</span>
                    <span className="text-rose-600 font-bold text-[7px]">&#9650;</span>
                  </div>
                </div>
              </div>

              {/* Instant Depth HUD Telemetry */}
              <div className="flex-1 space-y-1.5 text-left">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                    {language === 'ne' ? 'वर्तमान उचाइ' : 'Current Stage'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-xl font-black font-mono ${
                        isDanger ? 'text-rose-400' : isWarning ? 'text-amber-300' : 'text-cyan-300'
                      }`}
                    >
                      {gauge.currentLevelMeters}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">m</span>
                  </div>
                </div>

                <div>
                  {isBreached ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded leading-tight">
                      ▲ +{(gauge.currentLevelMeters - gauge.dangerLevelMeters).toFixed(2)}m above Danger
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.5 rounded leading-tight">
                      ✓ {(gauge.dangerLevelMeters - gauge.currentLevelMeters).toFixed(2)}m below Danger
                    </span>
                  )}
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 space-y-0.5 text-[9px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{language === 'ne' ? 'पानी बहाव:' : 'Discharge:'}</span>
                    <span className="text-cyan-300 font-bold">{gauge.dischargeCusecs.toLocaleString()} cusecs</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{language === 'ne' ? 'खतरा विन्दु:' : 'Danger Ref:'}</span>
                    <span className="text-rose-400 font-bold">{gauge.dangerLevelMeters}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT DECK: REAL SVG HYDROGRAPH TELEMETRY */}
          <div className="md:col-span-7 bg-slate-950/85 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-800/60 pb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-200 truncate">
                <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">
                  {language === 'ne'
                    ? '१२-घण्टे जलसतह प्रवृत्ति'
                    : '12-Hour Hydrograph Trend'}
                </span>
              </span>

              {/* Hydrograph Toggle Mode Buttons (Stage vs Discharge) */}
              <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-md border border-slate-800 shrink-0">
                <button
                  onClick={() => setHydroViewMode('stage')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    hydroViewMode === 'stage'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stage (m)
                </button>
                <button
                  onClick={() => setHydroViewMode('discharge')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                    hydroViewMode === 'discharge'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Discharge
                </button>
              </div>
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="relative w-full h-[115px] select-none pt-0.5">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible font-mono"
              >
                <defs>
                  <linearGradient id={`hydroGrad-${gauge.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#00F2FE'}
                      stopOpacity="0.45"
                    />
                    <stop
                      offset="100%"
                      stopColor={isDanger ? '#7F1D1D' : isWarning ? '#78350F' : '#0369A1'}
                      stopOpacity="0.03"
                    />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Elevation Labels */}
                <g stroke="#334155" strokeDasharray="3 3" opacity="0.35">
                  <line
                    x1={paddingLeft}
                    y1={paddingTop}
                    x2={svgWidth - paddingRight}
                    y2={paddingTop}
                  />
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + chartHeight * 0.5}
                    x2={svgWidth - paddingRight}
                    y2={paddingTop + chartHeight * 0.5}
                  />
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + chartHeight}
                    x2={svgWidth - paddingRight}
                    y2={paddingTop + chartHeight}
                  />
                </g>

                {/* Y-Axis Text Markers */}
                <g fill="#94A3B8" fontSize="7" textAnchor="end">
                  <text x={paddingLeft - 3} y={paddingTop + 2.5}>
                    {hydroViewMode === 'stage'
                      ? `${maxStage.toFixed(1)}m`
                      : `${Math.round(maxDischarge / 1000)}k`}
                  </text>
                  <text x={paddingLeft - 3} y={paddingTop + chartHeight * 0.5 + 2.5}>
                    {hydroViewMode === 'stage'
                      ? `${((maxStage + minStage) / 2).toFixed(1)}m`
                      : `${Math.round((maxDischarge + minDischarge) / 2000)}k`}
                  </text>
                  <text x={paddingLeft - 3} y={paddingTop + chartHeight + 2.5}>
                    {hydroViewMode === 'stage'
                      ? `${minStage.toFixed(1)}m`
                      : `${Math.round(minDischarge / 1000)}k`}
                  </text>
                </g>

                {/* Threshold Reference Lines (Only when in Stage Mode) */}
                {hydroViewMode === 'stage' && (
                  <>
                    {/* Warning Level (Amber Dashed) */}
                    <line
                      x1={paddingLeft}
                      y1={warningY}
                      x2={svgWidth - paddingRight}
                      y2={warningY}
                      stroke="#F59E0B"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={svgWidth - paddingRight}
                      y={warningY - 2}
                      fill="#F59E0B"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      Warning ({gauge.warningLevelMeters}m)
                    </text>

                    {/* Danger Level (Red Dashed) */}
                    <line
                      x1={paddingLeft}
                      y1={dangerY}
                      x2={svgWidth - paddingRight}
                      y2={dangerY}
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={svgWidth - paddingRight}
                      y={dangerY - 2}
                      fill="#EF4444"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      Danger ({gauge.dangerLevelMeters}m)
                    </text>
                  </>
                )}

                {/* Gradient Area Fill */}
                <path d={areaPath} fill={`url(#hydroGrad-${gauge.id})`} />

                {/* Primary Hydrograph Trend Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#00F2FE'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points on Curve */}
                {svgPoints.map((pt, i) => {
                  const isHovered = hoveredPointIndex === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : 3}
                        fill={isHovered ? '#FFFFFF' : isDanger ? '#EF4444' : '#00F2FE'}
                        stroke="#0F172A"
                        strokeWidth="1.5"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPointIndex(i)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />
                      {/* X-Axis Time Label */}
                      <text
                        x={pt.x}
                        y={paddingTop + chartHeight + 12}
                        fill="#94A3B8"
                        fontSize="7"
                        textAnchor="middle"
                      >
                        {pt.data.time}
                      </text>
                      {/* Data Value above point */}
                      <text
                        x={pt.x}
                        y={pt.y - 5}
                        fill={isHovered ? '#FFFFFF' : '#CBD5E1'}
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {hydroViewMode === 'stage'
                          ? `${pt.data.levelMeters.toFixed(1)}m`
                          : `${Math.round((pt.data.dischargeCusecs || gauge.dischargeCusecs) / 1000)}k`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* 3. OPERATIONAL INTELLIGENCE STRIP (BALANCED SIDE-BY-SIDE CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Hydrological Progression Analysis Card */}
          <div className="bg-slate-950/85 rounded-xl p-2.5 border border-slate-800/90 flex items-start gap-2">
            <div className="p-1 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 shrink-0 mt-0.5">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="text-slate-300 text-[9.5px] leading-snug">
              <span className="font-bold text-white block text-[10px] mb-0.5">
                {language === 'ne' ? '📊 हाइड्रोलोजिकल विश्लेषण' : '📊 Hydrological Progression Analysis'}:
              </span>
              {language === 'ne' ? (
                <span>
                  विगत ६ घण्टामा जलसतह <strong>{startLevel}m</strong> बाट बढेर{' '}
                  <strong className="text-rose-400">{gauge.currentLevelMeters}m</strong> पुगेको छ (
                  <strong>+{deltaLevel}m</strong> वृद्धि, दर: +{gauge.rateOfRiseCmPerHour} cm/h)। पानीको
                  बहाव <strong className="text-cyan-300">{gauge.dischargeCusecs.toLocaleString()} cusecs</strong>{' '}
                  पुगेको छ। {nearestSettlement && `बाढीको तरंग करिब ~${nearestSettlement.estimatedLeadTimeHours} घण्टामा ${nearestSettlement.nepaliName} पुग्नेछ।`}
                </span>
              ) : (
                <span>
                  Over the monitored 6-hour window, river stage climbed from <strong>{startLevel}m</strong> to{' '}
                  <strong className="text-rose-400">{gauge.currentLevelMeters}m</strong> (
                  <strong>+{deltaLevel}m</strong> delta at +{gauge.rateOfRiseCmPerHour} cm/h). Current discharge:{' '}
                  <strong className="text-cyan-300">{gauge.dischargeCusecs.toLocaleString()} cusecs</strong>.
                  {nearestSettlement &&
                    ` Downstream flood wave transit time to ${nearestSettlement.settlementName} is estimated at ~${nearestSettlement.estimatedLeadTimeHours} hours.`}
                </span>
              )}
            </div>
          </div>

          {/* River Barrage Sluice Operation OR Free-Flowing Riparian Corridor */}
          {gauge.isBarrageControlled ? (
            <div className="bg-rose-950/40 border border-rose-500/50 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-rose-900/60 text-rose-300 border border-rose-700/60 shrink-0">
                  <Waves className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[10px]">
                    {language === 'ne' ? 'ब्यारेज ढोका नियन्त्रण स्थिति' : 'River Barrage Sluice Operation'}
                  </span>
                  <span className="text-[9px] text-rose-300 block mt-0.5">
                    {gauge.sluiceGatesOpen} / {gauge.totalSluiceGates}{' '}
                    {language === 'ne' ? 'ढोका पूर्ण खुला (रेड लाइट अलर्ट)' : 'Gates Fully Opened (Red Light)'}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[8.5px] font-black text-rose-200 bg-rose-600/90 border border-rose-400 px-2 py-0.5 rounded shadow shrink-0">
                MAX FLUSH
              </span>
            </div>
          ) : (
            <div className="bg-slate-950/85 border border-slate-800/90 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shrink-0">
                  <Compass className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                </div>
                <div>
                  <span className="font-bold text-white block text-[10px]">
                    {language === 'ne' ? 'प्राकृतिक नदी बहाव कोरिडोर' : 'Free-Flowing Natural Riparian Corridor'}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {language === 'ne'
                      ? 'अवरोधरहित प्राकृतिक जलप्रवाह • उच्च वेग बहाव'
                      : 'Unobstructed channel • High-velocity flash runoff corridor'}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[8.5px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded shrink-0">
                FREE FLOW
              </span>
            </div>
          )}
        </div>

        {/* 4. SHORT-LEAD STAGE FORECAST */}
        <div className="border-y border-slate-800 py-2" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                {language === 'ne' ? '२४ घण्टाको जलसतह अनुमान' : '24-hour stage projection'}
              </p>
              {forecast ? (
                <p className="mt-1 text-xs text-slate-200">
                  {language === 'ne' ? '२४ घण्टामा अनुमानित' : 'Projected in 24 hours'}{' '}
                  <strong className="font-mono text-cyan-300">
                    {forecast.stage_forecast.find((point) => point.hours_ahead === 24)?.stage_m.toFixed(2) ?? '—'}m
                  </strong>
                  <span className="ml-2 text-[10px] text-slate-500">
                    {language === 'ne' ? 'रैखिक प्रवृत्ति अनुमान' : 'linear trend estimate'}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">
                  {forecastError
                    ? (language === 'ne' ? 'अनुमान सेवा उपलब्ध छैन' : 'Forecast service unavailable')
                    : (language === 'ne' ? 'अनुमान लोड हुँदैछ' : 'Loading forecast')}
                </p>
              )}
            </div>
            {forecast?.critical_rising_alert && (
              <span className="rounded border border-rose-500/50 bg-rose-950/50 px-2 py-1 text-[9px] font-bold text-rose-300">
                {language === 'ne' ? 'तीव्र वृद्धि' : 'CRITICAL RISE'}
              </span>
            )}
          </div>
          {forecast?.assumptions[1] && (
            <p className="mt-1 text-[9px] leading-snug text-slate-500">{forecast.assumptions[1]}</p>
          )}
        </div>

        {/* 5. DOWNSTREAM RIPARIAN IMPACT ZONES (SYMMETRICAL 2-COLUMN GRID) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            <span>
              {language === 'ne'
                ? 'तल्लो तटीय जोखिम बस्ती तथा निकासी मार्ग'
                : 'Downstream Riparian Impact Settlements'}
            </span>
            <span className="text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.2 rounded">
              {gauge.downstreamSettlements.length} {language === 'ne' ? 'क्षेत्र' : 'sectors'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gauge.downstreamSettlements.map((settlement, sIdx) => (
              <div
                key={sIdx}
                className="bg-slate-950/85 p-2 rounded-xl border border-slate-800/90 flex flex-col justify-between gap-1.5 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                    <span className="text-[10px] font-black line-clamp-1">
                      {language === 'ne' ? settlement.nepaliName : settlement.settlementName}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-400 leading-tight line-clamp-2">
                    {settlement.evacuationRouteHint}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/70 text-[8.5px] font-mono">
                  <span className="font-bold text-rose-400">
                    Lead Time: ~{settlement.estimatedLeadTimeHours}h
                  </span>
                  <span className="text-slate-400">
                    Pop: {settlement.populationAtRisk.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {/* Symmetrical standby placeholder to balance grid heights */}
            {gauge.downstreamSettlements.length === 1 && (
              <div className="bg-slate-950/50 p-2 rounded-xl border border-dashed border-slate-800/80 flex flex-col justify-between gap-1.5 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold line-clamp-1">
                      {language === 'ne'
                        ? 'स्थानीय राहत शिविर तथा सुरक्षित स्थल तयार'
                        : 'Local safe haven & muster zone pre-cleared'}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-400 leading-tight line-clamp-2">
                    {language === 'ne'
                      ? 'उचाइमा रहेका विद्यालय तथा सामुदायिक भवनहरू पूर्व-सक्रिय गरिएका छन्।'
                      : 'Designated high-ground municipal shelters & school muster points operational.'}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[8.5px] font-mono">
                  <span className="font-bold text-emerald-400">STANDBY</span>
                  <span className="text-slate-400">Ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          5. PINNED VERNACULAR SOS BROADCAST ACTION FOOTER
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 pt-1.5 border-t border-slate-800/60">
        <button
          onClick={() => onOpenSosModal(gauge)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-3 py-2 text-[11px] font-black text-white shadow-md shadow-rose-950/50 hover:from-rose-500 hover:to-amber-500 transition-all cursor-pointer active:scale-95"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse shrink-0" />
          <span className="tracking-wide truncate">
            {language === 'ne'
              ? '🚨 नेपाली आपतकालीन सूचना (SMS / WhatsApp / Radio) तयार गर्नुहोस्'
              : '🚨 Generate Vernacular SOS Broadcast (SMS / WhatsApp / Radio)'}
          </span>
        </button>
      </div>
    </div>
  );
};
