/**
 * LiveRiverTelemetryModal.tsx — Real-Time Hydrological River Inspector.
 *
 * Implements:
 * - Live micro-updating telemetry ticker (simulated WebSocket / DHM stream).
 * - Liquid water gauge visualizer with Warning & Danger threshold lines.
 * - Comprehensive hydrological analytics (discharge, velocity, barrage gates, catchment rainfall).
 * - Downstream at-risk communities table with evacuation lead times.
 * - Bilingual support (नेपाली / English).
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Phone,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Volume2,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { LiveRiverData } from '@/data/nepalRiverBasinsAndRivers';

interface LiveRiverTelemetryModalProps {
  river: LiveRiverData | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ne';
  onOpenSosModal?: (river: LiveRiverData) => void;
  onFocusRiver?: (river: LiveRiverData) => void;
}

export const LiveRiverTelemetryModal: React.FC<LiveRiverTelemetryModalProps> = ({
  river,
  isOpen,
  onClose,
  language,
  onOpenSosModal,
  onFocusRiver,
}) => {
  if (!isOpen || !river) return null;

  // Real-time live updating state
  const [liveLevel, setLiveLevel] = useState<number>(river.currentLevelMeters);
  const [liveDischarge, setLiveDischarge] = useState<number>(river.dischargeCusecs);
  const [secondsAgo, setSecondsAgo] = useState<number>(1);
  const [packetPing, setPacketPing] = useState<boolean>(false);

  // Reset values when river changes
  useEffect(() => {
    setLiveLevel(river.currentLevelMeters);
    setLiveDischarge(river.dischargeCusecs);
    setSecondsAgo(1);
  }, [river.id]);

  // Live WebSocket-style telemetry streaming simulation
  useEffect(() => {
    const timer = setInterval(() => {
      // Small real-world hydrological fluctuations
      const deltaLevel = (Math.random() - 0.45) * 0.03;
      const deltaDischarge = Math.floor((Math.random() - 0.45) * 450);

      setLiveLevel((prev) => Number((prev + deltaLevel).toFixed(2)));
      setLiveDischarge((prev) => Math.max(1000, prev + deltaDischarge));
      setSecondsAgo(1);

      // Flash packet indicator
      setPacketPing(true);
      setTimeout(() => setPacketPing(false), 800);
    }, 2800);

    const secondCounter = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(secondCounter);
    };
  }, [river.id]);

  const isDanger = river.status === 'danger' || river.status === 'extreme_flood';
  const isWarning = river.status === 'warning';
  const maxScale = Math.max(river.dangerLevelMeters * 1.25, liveLevel * 1.1);
  const gaugePercent = Math.min(100, Math.max(10, (liveLevel / maxScale) * 100));
  const dangerPercent = (river.dangerLevelMeters / maxScale) * 100;
  const warningPercent = (river.warningLevelMeters / maxScale) * 100;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDanger
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isWarning
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
              }`}
            >
              <Waves className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  {river.dhmStationNumber} &bull; {river.basinName}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                    packetPing
                      ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      packetPing ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
                    }`}
                  ></span>
                  <span>
                    {language === 'ne'
                      ? `प्रत्यक्ष DHM स्ट्रिम • ${secondsAgo} सेकेन्ड अघि`
                      : `Live DHM Stream • ${secondsAgo}s ago`}
                  </span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>{language === 'ne' ? river.nepaliName : river.name}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onFocusRiver && (
              <button
                onClick={() => onFocusRiver(river)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 transition-all cursor-pointer"
                title="Focus on Map"
              >
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>{language === 'ne' ? 'नक्सामा हेर्नुहोस्' : 'Focus River'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDanger
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : isWarning
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
            }`}
          >
            {isDanger ? (
              <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            ) : isWarning ? (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold uppercase tracking-wider text-[11px] mb-0.5">
                {isDanger
                  ? language === 'ne'
                    ? 'खतरा विन्दु पार — आपतकालीन बाढी चेतावनी'
                    : 'DANGER THRESHOLD BREACHED — EXTREME FLOOD WARNING'
                  : isWarning
                  ? language === 'ne'
                    ? 'सतर्कता तह पार — पूर्व-बाढी निगरानी'
                    : 'WARNING LEVEL EXCEEDED — PRE-FLOOD MONITORING WATCH'
                  : language === 'ne'
                  ? 'सामान्य बहाव — सुरक्षित जलस्तर'
                  : 'NORMAL HYDROLOGICAL FLOW — SAFE BASELINE'}
              </div>
              <p className="leading-relaxed text-slate-300">
                {language === 'ne' ? river.nepaliDirective : river.civilProtectionDirective}
              </p>
            </div>
          </div>

          {/* Primary Telemetry HUD Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Live Water Level */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 relative overflow-hidden">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                <span>{language === 'ne' ? 'प्रत्यक्ष जलस्तर' : 'Live Water Level'}</span>
                <span className="text-[9px] text-cyan-400 font-bold">DHM-Live</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
                  {liveLevel.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">meters</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-400">
                <TrendingUp className="h-3 w-3" />
                <span>+{river.rateOfRiseCmPerHour} cm/hr (Rising)</span>
              </div>
            </div>

            {/* 2. Discharge Flow */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                {language === 'ne' ? 'पानीको बहाव (डिस्चार्ज)' : 'Live Discharge'}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
                  {liveDischarge.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">cusecs</span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-mono">
                &asymp; {river.dischargeM3s.toLocaleString()} m&sup3;/s &bull; {river.velocityMs} m/s
              </div>
            </div>

            {/* 3. Warning & Danger Thresholds */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                {language === 'ne' ? 'खतरा / सतर्कता विन्दु' : 'Danger / Warning Marks'}
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{language === 'ne' ? 'खतरा विन्दु:' : 'Danger:'}</span>
                  <strong className="text-rose-400">{river.dangerLevelMeters.toFixed(2)} m</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{language === 'ne' ? 'सतर्कता तह:' : 'Warning:'}</span>
                  <strong className="text-amber-400">{river.warningLevelMeters.toFixed(2)} m</strong>
                </div>
              </div>
              <div className="mt-1 text-[9px] text-slate-500 font-mono">
                Record: {river.highestHistoricalLevelMeters}m ({river.historicalRecordYear})
              </div>
            </div>

            {/* 4. 24h Catchment Rainfall */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                {language === 'ne' ? '२४-घण्टे वर्षा (क्याचमेन्ट)' : '24h Catchment Rain'}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tracking-tight">
                  {river.rainfallLast24hMm}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">mm</span>
              </div>
              <div className="mt-1 text-[10px] text-rose-400 font-bold">
                {language === 'ne' ? 'अत्यधिक मनसुन वर्षा' : 'Torrential Deluge'}
              </div>
            </div>
          </div>

          {/* Liquid Water Level Visual Gauge Bar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                {language === 'ne' ? 'जलसतह मापक बार' : 'Real-Time Hydrological Level Gauge'}
              </span>
              <span className="text-rose-400 font-bold">
                {((liveLevel / river.dangerLevelMeters) * 100).toFixed(0)}% of Danger Threshold
              </span>
            </div>

            {/* Liquid Level Bar with Threshold Markers */}
            <div className="relative w-full h-8 bg-slate-900 rounded-lg overflow-hidden border border-slate-700/60 p-0.5">
              {/* Animated Liquid Fill */}
              <div
                className={`h-full rounded-md transition-all duration-700 ${
                  isDanger
                    ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 animate-pulse'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-500'
                }`}
                style={{ width: `${gaugePercent}%` }}
              ></div>

              {/* Warning Level Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 flex flex-col items-center"
                style={{ left: `${warningPercent}%` }}
                title={`Warning Level: ${river.warningLevelMeters}m`}
              >
                <span className="absolute -top-4 text-[9px] font-mono text-amber-300 font-bold whitespace-nowrap bg-slate-950 px-1 rounded border border-amber-500/50">
                  Warn {river.warningLevelMeters}m
                </span>
              </div>

              {/* Danger Level Marker Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 flex flex-col items-center"
                style={{ left: `${dangerPercent}%` }}
                title={`Danger Level: ${river.dangerLevelMeters}m`}
              >
                <span className="absolute -top-4 text-[9px] font-mono text-rose-300 font-bold whitespace-nowrap bg-slate-950 px-1 rounded border border-rose-500/50">
                  Danger {river.dangerLevelMeters}m
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
              <span>0.0m (River Bed)</span>
              <span>Warning: {river.warningLevelMeters}m</span>
              <span>Danger: {river.dangerLevelMeters}m</span>
              <span>Max Capacity: {maxScale.toFixed(1)}m</span>
            </div>
          </div>

          {/* Barrage / Sluice Gates Status (if controlled) */}
          {river.barrageInfo && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{river.barrageInfo.name}</h4>
                  <p className="text-[11px] text-slate-400">{river.barrageInfo.sluiceStatus}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono font-bold text-center">
                  <span className="block text-[10px] text-rose-400 uppercase font-sans">
                    {language === 'ne' ? 'खुला ढोकाहरू' : 'Gates Open'}
                  </span>
                  <span className="text-base">
                    {river.barrageInfo.gatesOpen} / {river.barrageInfo.totalGates}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Downstream Riparian Settlements At-Risk Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-400" />
                <span>
                  {language === 'ne'
                    ? 'जोखिमयुक्त तटीय बस्तीहरू तथा सुरक्षित शिविर'
                    : 'Downstream At-Risk Riparian Settlements & Safe Havens'}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {river.downstreamSettlements.length} {language === 'ne' ? 'क्षेत्र पहिचान' : 'sectors identified'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">
                      {language === 'ne' ? 'जोखिम बस्ती / क्षेत्र' : 'Settlement / Sector'}
                    </th>
                    <th className="py-2.5 px-3">{language === 'ne' ? 'जिल्ला' : 'District'}</th>
                    <th className="py-2.5 px-3">
                      {language === 'ne' ? 'बाढी पुग्ने समय' : 'Flood Lead Time'}
                    </th>
                    <th className="py-2.5 px-3">
                      {language === 'ne' ? 'जोखिम जनसंख्या' : 'Population at Risk'}
                    </th>
                    <th className="py-2.5 px-3">
                      {language === 'ne' ? 'सिफारिस सुरक्षित केन्द्र' : 'Recommended Safe Haven'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {river.downstreamSettlements.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {language === 'ne' ? item.nepaliSettlement : item.settlement}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">{item.district}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                        {item.leadTimeHours} hrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {item.populationAtRisk.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        {language === 'ne' ? item.safeHavenNepali : item.safeHaven}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Geographical Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
            <div>
              <span className="text-slate-500 block uppercase">{language === 'ne' ? 'उत्पत्ति' : 'Origin'}:</span>
              <strong className="text-slate-200">{river.origin}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">
                {language === 'ne' ? 'संगम / अन्त्य' : 'Confluence'}:
              </span>
              <strong className="text-slate-200">{river.confluence}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">
                {language === 'ne' ? 'कुल लम्बाइ / जिल्लाहरू' : 'Length & Districts'}:
              </span>
              <strong className="text-slate-200">
                {river.lengthKm} km &bull; {river.keyDistricts.join(', ')}
              </strong>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-800 bg-slate-950">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>
              {language === 'ne'
                ? 'नक्सामा सबै नदी र बेसिनहरू थोप्ला रेखा (dotted lines) ले हाइलाइट गरिएका छन्'
                : 'All river basins and riverlines highlighted with dotted boundaries'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onOpenSosModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSosModal(river);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
              >
                <Radio className="h-4 w-4" />
                <span>
                  {language === 'ne' ? 'आपतकालीन SOS सूचना जारी गर्नुहोस्' : 'Broadcast Vernacular SOS'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              {language === 'ne' ? 'बन्द गर्नुहोस्' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
