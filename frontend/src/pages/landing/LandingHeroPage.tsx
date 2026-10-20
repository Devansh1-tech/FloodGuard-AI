/**
 * LandingHeroPage.tsx — Premium Welcome & Hero Landing Page for FloodGuard AI Nepal.
 *
 * Provides:
 * 1. High-impact Hero Header with mission statement for the 21 Southern Nepal Terai districts.
 * 2. Primary "Move to Dashboard" action launcher to seamlessly transition to the executive console.
 * 3. Quick module navigation to Sentinel-1 SAR radar, DHM gauges, and emergency routing.
 * 4. Live telemetry HUD statistics ribbon.
 * 5. Architectural capability cards (SAR physics, bilingual alerts, detour graphs, antivenom).
 * 6. Regional Terai basin overview with direct district inspection jumps.
 */

import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  FileDown,
  Globe,
  HeartPulse,
  Layers,
  MapPin,
  Phone,
  Radio,
  Route,
  Satellite,
  Shield,
  ShieldAlert,
  Sparkles,
  Tent,
  Truck,
  Users,
  Waves,
  Zap,
} from 'lucide-react';
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
    <div className="space-y-16 pb-12 animate-in fade-in duration-300">
      {/* ───────────────────────────────────────────────────────────────────────
          1. HERO HEADER SECTION WITH REALISTIC NEPAL FLOOD & RESCUE BACKDROP
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 p-6 sm:p-10 md:p-12 shadow-2xl group min-h-[720px] flex flex-col justify-between">
        {/* Background Image: Nepal Terai Monsoon Deluge & Flood Rescue Operations */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={nepalHeroFlood}
            alt="Nepal Terai Monsoon Deluge & Flood Rescue Operations"
            className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05] saturate-[1.05] scale-[1.01] transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
          />
          {/* Gentle Gradient Scrim to guarantee clarity and depth without darkening the photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/85" />
        </div>

        {/* Ambient Glow Accent */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-transparent blur-3xl pointer-events-none z-[1]" />

        {/* Top Header Badge / Provenance Tag */}
        <div className="relative z-20 flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/90 bg-slate-950/80 backdrop-blur-md px-3.5 py-1 text-[11px] font-mono text-slate-200 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nepal Terai Flood Defense &bull; APF / NEOC Responders</span>
          </div>
        </div>

        {/* Central Hero Headline & CTAs in Frosted Glass Container for High Readability */}
        <div className="relative z-10 max-w-4xl mx-auto my-auto text-center space-y-6 rounded-3xl bg-slate-950/60 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-2xl">
          {/* Official Sovereign Mission Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-xl ring-1 ring-cyan-500/30">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
              Nepal Terai Disaster Early Warning System &bull; 21 Districts Sovereign Defense
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            Sovereign AI Defense Against{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
              Monsoon Deluges
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            Piercing perpetual monsoon cloud cover with Copernicus Sentinel-1 microwave SAR, real-time DHM river telemetry, and autonomous road evacuation detours for 17M+ citizens across the Southern Nepal lowlands.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onMoveToDashboard}
              className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-size-200 hover:bg-pos-100 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/50 cursor-pointer"
            >
              <Shield className="h-5 w-5 text-white" />
              <span>Move to Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onNavigateToTab?.('satellite')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/85 hover:bg-slate-800/95 backdrop-blur-md px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-100 hover:text-white transition-all cursor-pointer shadow-lg"
            >
              <Satellite className="h-4 w-4 text-cyan-400" />
              <span>Satellite Flood Detection</span>
            </button>

            <button
              onClick={() => onNavigateToTab?.('gauges')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/85 hover:bg-slate-800/95 backdrop-blur-md px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-100 hover:text-white transition-all cursor-pointer shadow-lg"
            >
              <Waves className="h-4 w-4 text-blue-400" />
              <span>River Gauges &amp; SOS (5.9)</span>
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-300">
            <span className="font-mono text-[11px] text-slate-300 font-semibold drop-shadow-sm">Quick Operations:</span>
            <button
              onClick={() => onNavigateToTab?.('command_map')}
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              Field Command Map (5.2)
            </button>
            <button
              onClick={() => onNavigateToTab?.('routing')}
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              Emergency Routing (5.6)
            </button>
            <button
              onClick={() => onNavigateToTab?.('havens')}
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer shadow-sm"
            >
              Safe Havens &amp; Camps (5.7)
            </button>
            <button
              onClick={() => onNavigateToTab?.('sitrep')}
              className="rounded-lg border border-rose-500/40 bg-rose-950/40 backdrop-blur-md text-rose-300 px-2.5 py-1 hover:bg-rose-900/40 transition-colors cursor-pointer shadow-sm"
            >
              Official SitRep PDF (5.8)
            </button>
          </div>
        </div>

        {/* Floating Live Command Preview Card (Rich Glassmorphism) */}
        <div className="mt-8 relative max-w-4xl mx-auto w-full rounded-2xl border border-cyan-500/40 bg-[#070b16]/95 p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl ring-1 ring-cyan-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span className="font-bold text-white font-mono text-[11px] tracking-wide">
                NEOC LIVE TELEMETRY STREAM &bull; STATUS OPTIMAL
              </span>
            </div>
            <span className="font-mono text-[10px] text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
              Copernicus S1-GRD VV/VH &bull; DHM Telemetry Link Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
            <div className="rounded-xl border border-rose-500/30 bg-slate-900/85 backdrop-blur-md p-3.5 space-y-1.5 shadow-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                High Risk Basin
              </span>
              <div className="text-sm font-bold text-rose-400 flex items-center justify-between">
                <span>Rautahat &bull; Gaur Hub</span>
                <span className="text-[10px] rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300 font-bold">
                  CRITICAL +2.4m
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Bagmati River breached Danger Level. Automated bilingual SOS dispatched.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-slate-900/85 backdrop-blur-md p-3.5 space-y-1.5 shadow-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Highway Inundation
              </span>
              <div className="text-sm font-bold text-amber-400 flex items-center justify-between">
                <span>Mahendra Highway</span>
                <span className="text-[10px] rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300 font-bold">
                  CUT-OFF DETOUR
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Segment KM-142 inundated. Autonomous Dijkstra high-ground reroute active.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-slate-900/85 backdrop-blur-md p-3.5 space-y-1.5 shadow-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Healthcare Stock
              </span>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-between">
                <span>MoHP Antivenom</span>
                <span className="text-[10px] rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-bold">
                  920 VIALS
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Emergency viper/cobra snakebite vials staged across 21 referral hospitals.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onMoveToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer group"
            >
              <span>Enter Executive Command Console for Complete District Breakdown</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          2. QUANTITATIVE TELEMETRY RIBBON
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Target Domain
          </span>
          <div className="text-2xl font-black text-cyan-300">21 Districts</div>
          <span className="text-[11px] text-slate-400">Southern Nepal Lowlands</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Radar Frequency
          </span>
          <div className="text-2xl font-black text-blue-400">5.405 GHz</div>
          <span className="text-[11px] text-slate-400">C-Band SAR Cloud Penetration</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            River Gauges
          </span>
          <div className="text-2xl font-black text-emerald-400">47 Stations</div>
          <span className="text-[11px] text-slate-400">DHM Real-Time Hydro Stream</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Grounded Population
          </span>
          <div className="text-2xl font-black text-purple-400">17.2M+</div>
          <span className="text-[11px] text-slate-400">Nepal Census 2021 Records</span>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
            National Hotline
          </span>
          <div className="text-2xl font-black text-white">NEOC 1155</div>
          <span className="text-[11px] text-rose-300">24/7 Singha Durbar Desk</span>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          3. CORE ARCHITECTURAL PILLARS (Interactive Feature Cards)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Engineered For Crisis Response
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Four Pillars of Flood Defense
          </h2>
          <p className="text-xs text-slate-400">
            Sovereign mathematical pipelines built to address Nepal’s distinct topography and monsoon realities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Satellite className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-300 font-bold">
                STAGE 5.1 &bull; SAR RADAR
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Copernicus Sentinel-1 Synthetic Aperture Radar
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Optical satellites are blinded by torrential monsoon clouds. FloodGuard AI utilizes active C-band radar microwaves to image surface water regardless of weather, rainfall, or nighttime darkness.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('satellite')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Launch Satellite Deluge Comparison</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-blue-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Waves className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono rounded bg-blue-500/10 px-2 py-0.5 text-blue-300 font-bold">
                STAGE 5.9 &bull; RIVER SOS
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                Real-Time DHM Hydrology &amp; Bilingual Alerts
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Telemetry from 47 DHM gauge stations across Koshi, Narayani, West Rapti, and Karnali basins. Automated danger threshold crossings trigger instant synthesized SMS and radio warnings in Nepali and Maithili.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('gauges')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Monitor River Gauges &amp; Bilingual Broadcasts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-amber-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono rounded bg-amber-500/10 px-2 py-0.5 text-amber-300 font-bold">
                STAGE 5.4 &amp; 5.6 &bull; ROUTING
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Highway Inundation &amp; Tactical Relief Routing
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Real-time flood intersection algorithms flag cut-off highway sections and submerged bridges along the Mahendra and Postal Highways. Dijkstra routing dynamically redirects relief convoys along high-ground corridors.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('routing')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>Explore Tactical Convoy &amp; Evacuation Router</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-300 font-bold">
                STAGE 5.5 &amp; 5.7 &bull; HEALTH &amp; HAVENS
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Sphere Safe Havens &amp; Hospital Antivenom
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Deployment of refugee camps adhering to UN Sphere Humanitarian Standards with helicopter landing zones (HLZ). Live tracking of 21 district referral hospitals for ICU beds, ventilators, and emergency snakebite antivenom.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab?.('havens')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform cursor-pointer"
            >
              <span>View Safe Havens &amp; Refugee Shelter Directives</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          4. REGIONAL BASINS QUICK-ACCESS
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Nepal Terai Basin Command Hubs</h2>
            <p className="text-xs text-slate-400">
              Select any regional basin to directly inspect real-time flood exposure on the Executive Dashboard.
            </p>
          </div>
          <button
            onClick={onMoveToDashboard}
            className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 transition-colors cursor-pointer shrink-0"
          >
            Open Full Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={onMoveToDashboard}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[10px] text-cyan-400 font-bold">EASTERN BASIN</span>
              <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5">Koshi Plain</span>
            </div>
            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              Morang &bull; Sunsari &bull; Jhapa
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Biratnagar, Bhantabari Barrage, Damak
            </p>
          </div>

          <div
            onClick={onMoveToDashboard}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[10px] text-cyan-400 font-bold">CENTRAL BASIN</span>
              <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5">Bagmati Plain</span>
            </div>
            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              Rautahat &bull; Sarlahi &bull; Bara &bull; Parsa
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Gaur, Malangwa, Birgunj Corridor
            </p>
          </div>

          <div
            onClick={onMoveToDashboard}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[10px] text-cyan-400 font-bold">WESTERN BASIN</span>
              <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5">West Rapti Basin</span>
            </div>
            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              Banke &bull; Bardiya &bull; Dang
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nepalgunj, Kohalpur, Holiya, Gulariya
            </p>
          </div>

          <div
            onClick={onMoveToDashboard}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-mono text-[10px] text-cyan-400 font-bold">FAR-WEST BASIN</span>
              <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5">Karnali &amp; Mohana</span>
            </div>
            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              Kailali &bull; Kanchanpur
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dhangadhi, Tikapur, Bhajani, Mahendranagar
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          5. CALL TO ACTION BANNER (MOVE TO DASHBOARD)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-blue-900/60 via-slate-900 to-cyan-900/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>OPERATIONAL READINESS &bull; EMERGENCY INCIDENT DESK</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Ready to Coordinate Flood Response Across the Terai?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Enter the central Executive Dashboard to review live water level graphs, filter flood observation windows, monitor district severity leaderboards, and dispatch tactical relief directives.
          </p>
          <div className="pt-2">
            <button
              onClick={onMoveToDashboard}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 bg-size-200 hover:bg-pos-100 px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <span>Move to Dashboard</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
