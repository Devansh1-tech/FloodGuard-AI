/**
 * WaterGaugeVisualizer.tsx — Animated Hydrological River Water Gauge Component.
 *
 * Implements Stage 5.9:
 * - Liquid height level visualization calibrated to Warning and Danger thresholds.
 * - Dynamic pulse animations when Danger Level is breached.
 * - Mini-hydrograph displaying 12-hour temporal progression.
 * - Fully bilingual (Nepali / English).
 */

import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Radio,
  Waves,
} from 'lucide-react';
import { RiverGaugeStation } from '@/data/teraiRiverGauges';
import { BILINGUAL_GAUGE_LABELS } from '@/services/riverGaugeService';

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
  // Max scale height for gauge bar: 110% of highest historical or danger level
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

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xl backdrop-blur-xl ${
      isDanger
        ? 'border-rose-500/50 bg-gradient-to-br from-[#1a080c]/90 via-[#0d1320]/90 to-[#070b13]/95 ring-1 ring-rose-500/30'
        : isWarning
        ? 'border-amber-500/40 bg-gradient-to-br from-[#1a1308]/90 via-[#0d1320]/90 to-[#070b13]/95'
        : 'border-slate-800 bg-[#0d1320]/90'
    }`}>
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
              {gauge.dhmStationNumber}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {gauge.district} &bull; {gauge.basin}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white mt-1">
            {language === 'ne' ? gauge.nepaliName : gauge.name}
          </h3>
          <div className="text-xs font-bold text-slate-300">
            {language === 'ne' ? gauge.nepaliRiver : gauge.river}
          </div>
        </div>

        {/* Severity Badge */}
        <div className="text-right shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm ${
            gauge.status === 'extreme_flood'
              ? 'bg-rose-600 text-white animate-pulse'
              : gauge.status === 'danger'
              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
              : gauge.status === 'warning'
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isDanger && <AlertOctagon className="h-3.5 w-3.5" />}
            {isWarning && <AlertTriangle className="h-3.5 w-3.5" />}
            <span>{statusInfo[language]}</span>
          </span>
          <div className="flex items-center justify-end gap-1 text-[11px] font-mono text-slate-400 mt-1">
            {getTrendIcon()}
            <span>{trendInfo[language]} (+{gauge.rateOfRiseCmPerHour} cm/h)</span>
          </div>
        </div>
      </div>

      {/* Main Hydrological Telemetry Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
        {/* Left Column: Visual Vertical Water Gauge Column (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-between bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            {language === 'ne' ? 'प्रत्यक्ष जलसतह गेज' : 'Live River Gauge Float'}
          </span>

          <div className="relative w-20 h-48 bg-slate-900 rounded-xl border-2 border-slate-700/80 overflow-hidden shadow-inner flex items-end">
            {/* Background Graduations / Rulers */}
            <div className="absolute inset-0 flex flex-col justify-between p-1 text-[8px] font-mono text-slate-500 select-none pointer-events-none">
              <span>{maxScale.toFixed(1)}m</span>
              <span>{(maxScale * 0.75).toFixed(1)}m</span>
              <span>{(maxScale * 0.5).toFixed(1)}m</span>
              <span>{(maxScale * 0.25).toFixed(1)}m</span>
              <span>0.0m</span>
            </div>

            {/* Warning Level Marker Line */}
            <div
              style={{ bottom: `${warningPercent}%` }}
              className="absolute left-0 right-0 border-b-2 border-dashed border-amber-400 z-10 flex items-center justify-end pr-1"
            >
              <span className="text-[8px] font-bold font-mono bg-amber-950/80 text-amber-300 px-1 rounded">
                W: {gauge.warningLevelMeters}m
              </span>
            </div>

            {/* Danger Level Marker Line */}
            <div
              style={{ bottom: `${dangerPercent}%` }}
              className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 z-10 flex items-center justify-end pr-1"
            >
              <span className="text-[8px] font-bold font-mono bg-rose-950/90 text-rose-300 px-1 rounded shadow">
                D: {gauge.dangerLevelMeters}m
              </span>
            </div>

            {/* Animated Liquid Column */}
            <div
              style={{ height: `${currentPercent}%` }}
              className={`w-full transition-all duration-1000 relative flex items-start justify-center ${
                isDanger
                  ? 'bg-gradient-to-t from-rose-700 via-rose-600 to-amber-500 shadow-lg shadow-rose-600/50'
                  : isWarning
                  ? 'bg-gradient-to-t from-blue-700 via-cyan-600 to-amber-400'
                  : 'bg-gradient-to-t from-blue-900 via-blue-700 to-cyan-500'
              }`}
            >
              {/* Ripple Effect at surface */}
              <div className="w-full h-1.5 bg-white/40 animate-pulse"></div>

              {/* Live Float Depth Label */}
              <span className="absolute -top-3.5 bg-white text-slate-900 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-md">
                {gauge.currentLevelMeters}m
              </span>
            </div>
          </div>

          <div className="w-full text-center mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">{language === 'ne' ? 'वर्तमान उचाइ:' : 'Height:'} </span>
            <strong className={`text-sm ${isDanger ? 'text-rose-400 font-black' : 'text-cyan-300'}`}>
              {gauge.currentLevelMeters} m
            </strong>
          </div>
        </div>

        {/* Right Column: Hydrograph & Downstream Settlements (8 cols) */}
        <div className="md:col-span-8 space-y-3.5 flex flex-col justify-between">
          {/* Hydrograph 12-Hour Hourly Trend */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                {language === 'ne' ? '१२-घण्टे जलसतह प्रवृत्ति (हाइड्रोग्राफ)' : '12-Hour Hydrograph Trend'}
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                Discharge: {gauge.dischargeCusecs.toLocaleString()} cusecs
              </span>
            </div>

            {/* Sparkline Columns */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {gauge.hourlyHistory.map((h, idx) => {
                const barHeight = Math.min(100, Math.max(15, (h.levelMeters / maxScale) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-mono font-bold text-slate-300">
                      {h.levelMeters.toFixed(1)}m
                    </span>
                    <div className="w-full h-14 bg-slate-900 rounded flex items-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-sm transition-all ${
                          h.levelMeters >= gauge.dangerLevelMeters
                            ? 'bg-rose-500'
                            : h.levelMeters >= gauge.warningLevelMeters
                            ? 'bg-amber-400'
                            : 'bg-cyan-500'
                        }`}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400">{h.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barrage Gates Status If Applicable */}
          {gauge.isBarrageControlled && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">
                    {language === 'ne' ? 'ब्यारेज ढोका नियन्त्रण स्थिति' : 'River Barrage Sluice Operation'}
                  </span>
                  <span className="text-[10px] text-rose-300">
                    {gauge.sluiceGatesOpen} / {gauge.totalSluiceGates} {language === 'ne' ? 'ढोका पूर्ण खुला' : 'Gates Fully Opened (Red Light)'}
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs font-black text-rose-300 bg-rose-900/60 px-2 py-1 rounded">
                MAX FLUSH
              </span>
            </div>
          )}

          {/* Downstream Riparian Impact Zones */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {language === 'ne' ? 'तल्लो तटीय जोखिम बस्ती तथा निकासी' : 'Downstream Riparian Impact Settlements'}
            </span>
            <div className="space-y-1.5">
              {gauge.downstreamSettlements.map((settlement, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">
                      {language === 'ne' ? settlement.nepaliName : settlement.settlementName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {settlement.evacuationRouteHint}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-rose-400 block">
                      Lead Time: ~{settlement.estimatedLeadTimeHours}h
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Pop: {settlement.populationAtRisk.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={() => onOpenSosModal(gauge)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-amber-500 transition-all cursor-pointer active:scale-95"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>
              {language === 'ne'
                ? '🚨 नेपाली आपतकालीन सूचना (SMS / WhatsApp / Radio) तयार गर्नुहोस्'
                : '🚨 Generate Vernacular SOS Broadcast (SMS / WhatsApp / Radio)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
