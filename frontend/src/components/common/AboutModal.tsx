import React from 'react';
import {
  Shield,
  X,
  Satellite,
  Waves,
  Route,
  Tent,
  HeartPulse,
  Database,
  ExternalLink,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="about-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                About FloodGuard AI
                <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  Nepal Terai
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sovereign Cloud-Penetrating SAR Flood Intelligence & Disaster Logistics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Mission Statement */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-blue-950/20 p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
              <MapPin className="h-4 w-4" />
              Mission: 21 Southern Nepal Terai Lowland Districts
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every monsoon, over 17 million citizens in the Nepal Terai basin face flash floods, river overflows, and cut-off highways. Traditional optical satellites fail due to perpetual heavy monsoon clouds. <strong className="text-white">FloodGuard AI</strong> solves this through active C-band radar (SAR), real-time DHM gauge telemetry, and automated logistics directives adhering to UN Sphere Humanitarian Standards.
            </p>
          </div>

          {/* 4 Core Pillars */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 font-bold">
              Core Architectural Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                  <Satellite className="h-4 w-4" />
                  <span>1. Sentinel-1 SAR Radar Analysis</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  C-band Synthetic Aperture Radar (5.405 GHz) pierces dense monsoon cloud cover 24/7 to pinpoint floodwaters via specular reflection analysis and Otsu thresholding.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <Waves className="h-4 w-4" />
                  <span>2. DHM Telemetry & Bilingual SOS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Live river water levels across Koshi, Narayani, Karnali, and West Rapti basins with automated danger threshold alerts broadcast in Nepali and Maithili.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Route className="h-4 w-4" />
                  <span>3. Inundation & Relief Routing</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Autonomous Dijkstra graph routing that penalizes submerged highways (Mahendra & Postal Highways) to calculate safe detours for relief convoys and civilian evacuations.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Tent className="h-4 w-4" />
                  <span>4. Sphere Safe Havens & MoHP Directory</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  High-ground refugee camps with helicopter landing zones (HLZ) and real-time MoHP district hospital directory tracking ICU beds, ventilators, and anti-snake venom stock.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sources & Sovereignty */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              <Database className="h-4 w-4 text-purple-400" />
              <span>Grounded Data Sources</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Nepal CBS Census 2021</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>DHM Hydrology Network</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>MoHP Hospital Registries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Copernicus Sentinel-1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Google Earth Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Google Gemini AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>FloodGuard AI &bull; Version 1.0 (Nepal Lowlands)</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-1.5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
