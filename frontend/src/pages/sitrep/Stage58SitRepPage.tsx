/**
 * Stage58SitRepPage.tsx — Stage 5.8 Official Government Situation Report (SitRep) PDF Export.
 *
 * Implements Point 10 of the Master Plan:
 * - "in sabki report pdf form mai download ka option diya jayega so that its easy for government ki kaise kya karna hai"
 * - Instant binary PDF download via jsPDF.
 * - Full-page A4 print layout via window.print().
 * - Standardized NDRRMA / UN-SPIDER 5-Section Disaster Management structure.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileDown,
  FileText,
  HeartPulse,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Plane,
  Printer,
  Radio,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tent,
  Truck,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
import {
  generateLiveSitRepData,
  downloadSitRepPdf,
  SitRepData,
} from '@/services/sitrepGenerator';
import { SitRepDocument } from '@/components/sitrep/SitRepDocument';

export const Stage58SitRepPage: React.FC = () => {
  const [sitrepData, setSitrepData] = useState<SitRepData>(generateLiveSitRepData());
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      downloadSitRepPdf(sitrepData);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setSitrepData(generateLiveSitRepData());
  };

  const exec = sitrepData.executiveSummary;

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* ─────────────────────────────────────────────────────────────────────
          PAGE HEADER & ARCHITECTURE BADGE (Hidden during Print)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              STAGE 5.8: OFFICIAL GOVERNMENT SITUATION REPORT (SITREP) PDF EXPORT
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              Point 10: Official PDF Export
            </span>
            <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
              NDRRMA / UN-SPIDER Compliant
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-cyan-400" />
            Executive Disaster Situation Report (SitRep)
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-4xl">
            Generates standardized, executive disaster response reports for Nepal Government Ministers (MoHA), Army Command, and international humanitarian agencies. Integrates Copernicus Sentinel-1 SAR flood deluges, road cut-offs, hospital triage readiness, and safe haven action directives.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
            <span>Sync Live Data</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
            title="Print A4 Document"
          >
            <Printer className="h-3.5 w-3.5 text-slate-300" />
            <span>Print Layout (A4)</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-amber-500 transition-all border border-rose-400/40 cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official SitRep (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          QUICK EXECUTIVE TELEMETRY HUD (Hidden during Print)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Total Flooded Area</span>
            <Waves className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white font-mono">
            {exec.totalFloodedAreaKm2}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">km²</span>
          </div>
          <div className="text-[11px] text-cyan-300 font-medium">
            Sentinel-1 SAR Radar (-15.2 dB)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Displaced Population</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-purple-400 font-mono">
            {exec.displacedEvacuees.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Census 2021 verified headcounts
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Highway Inundation</span>
            <Truck className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-rose-400 font-mono">
            {sitrepData.infrastructureDisruptions.totalSubmergedHighwayKm}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">km</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Postal Highway (H12) &amp; Feeders cut off
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">High-Ground Safe Havens</span>
            <Tent className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
            {exec.activeRefugeeCamps}{' '}
            <span className="text-xs font-bold text-slate-400 font-sans">Sites</span>
          </div>
          <div className="text-[11px] text-slate-400">
            98,000+ total evacuee capacity
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          DOCUMENT PREVIEW CONTAINER (PRINTABLE A4)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            Official Government SitRep Live Document Preview
          </span>
          <span>Click Download button above to export standalone PDF</span>
        </div>

        {/* Live Document Canvas */}
        <SitRepDocument sitrep={sitrepData} />
      </div>
    </div>
  );
};
