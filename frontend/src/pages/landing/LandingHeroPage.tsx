/**
 * LandingHeroPage.tsx — Nepal Terai Rapid Flood Monitoring & Decision Support System.
 *
 * Built for NEOC, MoHA, Armed Police Force (APF), and Emergency Response Officers.
 * Displays exclusively the verified operational command hero container and official hotlines.
 */

import React from 'react';
import {
  ShieldCheck,
  PhoneCall,
  Waves,
  FirstAid,
  FilePdf,
  ArrowRight,
  Broadcast,
  CheckCircle,
} from '@phosphor-icons/react';
import { NavigationTab } from '@/App';
import nepalHeroFlood from '@/assets/images/nepal_hero_flood.jpg';

interface LandingHeroPageProps {
  onMoveToDashboard: () => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
}

export const LandingHeroPage: React.FC<LandingHeroPageProps> = ({
  onMoveToDashboard,
  onNavigateToTab,
}) => {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* ───────────────────────────────────────────────────────────────────────
          1. TOP EMERGENCY RIBBON
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-rose-500/30 bg-[#1E293B] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 text-rose-300 font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span className="font-mono uppercase tracking-wider text-[11px] font-bold">
            NEOC 24/7 Rapid Response Desk Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <a
            href="tel:1155"
            className="flex items-center gap-1.5 text-rose-200 hover:text-white transition-colors"
          >
            <PhoneCall size={14} weight="bold" className="text-rose-400" />
            <span>NEOC Hotline: <strong className="font-bold underline">1155</strong></span>
          </a>
          <span className="text-slate-600">|</span>
          <a
            href="tel:1130"
            className="flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors"
          >
            <FirstAid size={14} weight="bold" className="text-emerald-400" />
            <span>Nepal Red Cross: <strong className="font-bold underline">1130</strong></span>
          </a>
          <span className="text-slate-600">|</span>
          <a
            href="tel:1114"
            className="flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors"
          >
            <ShieldCheck size={14} weight="bold" className="text-blue-400" />
            <span>APF Rescue: <strong className="font-bold underline">1114</strong></span>
          </a>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          2. HERO SECTION WITH NEPAL DELUGE BACKDROP
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1E293B] p-6 sm:p-8 md:p-10 shadow-xl group min-h-[580px] flex flex-col justify-between">
        {/* Background Image: Nepal Terai Monsoon Deluge & Flood Rescue Operations */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={nepalHeroFlood}
            alt="Nepal Terai Monsoon Deluge & Flood Rescue Operations"
            className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.1] scale-[1.01] transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          />
          {/* High-Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/85 via-[#0F172A]/75 to-[#0F172A]/95" />
        </div>

        {/* Top Header Badge & Authority Tag */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
              National Emergency Operations Centre (NEOC) &bull; MoHA
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0F172A]/90 px-3 py-1 font-mono text-[11px] text-slate-300 shadow-sm">
            <Broadcast size={13} weight="bold" className="text-emerald-400" />
            <span>Live Telemetry &bull; 21 Lowland Districts</span>
          </div>
        </div>

        {/* Central Hero Headline & CTAs */}
        <div className="relative z-10 max-w-4xl mx-auto my-auto text-center space-y-6 rounded-2xl bg-[#0F172A]/90 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-2xl">
          {/* Mission Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
              Operational Decision Support Platform &bull; Sentinel-1 SAR &amp; Hydrology
            </span>
          </div>

          {/* Official System Title */}
          <h1 className="text-3xl sm:text-5xl md:text-5xl font-black tracking-tight text-[#F8FAFC] leading-[1.15]">
            Nepal Terai Rapid Flood Monitoring &amp; Decision Support System
          </h1>

          {/* Technical Scope Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-[#E2E8F0] max-w-2xl mx-auto leading-relaxed font-normal">
            Continuous synthetic aperture radar cloud penetration, DHM real-time river telemetry, and autonomous road evacuation detours for 17M+ citizens across the 21 Southern Nepal Terai districts.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onMoveToDashboard}
              className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <ShieldCheck size={18} weight="bold" />
              <span>Launch Executive Command Console</span>
              <ArrowRight size={16} weight="bold" />
            </button>

            <button
              onClick={() => onNavigateToTab?.('sitrep')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#1E293B] hover:bg-[#334155] px-5 py-3 text-xs sm:text-sm font-bold text-[#F8FAFC] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <FilePdf size={16} weight="bold" className="text-rose-400" />
              <span>Download Official SITREP (PDF)</span>
            </button>
          </div>

          {/* Centered Third Action */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => onNavigateToTab?.('satellite')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#1E293B] hover:bg-[#334155] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#F8FAFC] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Waves size={16} weight="bold" className="text-cyan-400" />
              <span>Satellite Flood Detection</span>
            </button>
          </div>

          {/* Fast Jumps Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-300">
            <span className="font-mono text-[11px] text-[#94A3B8] font-semibold">Operational Modules:</span>
            <button
              onClick={() => onNavigateToTab?.('command_map')}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-2.5 py-1 text-[#F8FAFC] hover:border-white/30 transition-colors cursor-pointer"
            >
              Field Command Map (5.2)
            </button>
            <button
              onClick={() => onNavigateToTab?.('routing')}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-2.5 py-1 text-[#F8FAFC] hover:border-white/30 transition-colors cursor-pointer"
            >
              Emergency Routing (5.6)
            </button>
            <button
              onClick={() => onNavigateToTab?.('havens')}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-2.5 py-1 text-[#F8FAFC] hover:border-white/30 transition-colors cursor-pointer"
            >
              Safe Havens &amp; HLZ (5.7)
            </button>
            <button
              onClick={() => onNavigateToTab?.('gauges')}
              className="rounded-lg border border-white/10 bg-[#1E293B] px-2.5 py-1 text-[#F8FAFC] hover:border-white/30 transition-colors cursor-pointer"
            >
              DHM Hydro Telemetry (5.9)
            </button>
          </div>
        </div>

        {/* Verification Bar: Display data source authority tags directly below hero header */}
        <div className="relative z-10 mt-6 rounded-xl border border-white/10 bg-[#0F172A]/95 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} weight="bold" className="text-emerald-400" />
            <span className="font-bold text-[#F8FAFC]">
              Verified Data Sources:
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              DHM Nepal &bull; Copernicus Sentinel-1 Radar &bull; HDX/OSM Road Network
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">Resolution: 10m SAR &bull; Latency: ~12m automated pipeline</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHeroPage;
