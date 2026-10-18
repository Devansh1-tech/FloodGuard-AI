/**
 * App.tsx — FloodGuard AI: Nepal Terai Disaster Intelligence Platform.
 *
 * Unified, user-friendly command console:
 * 1. Satellite Flood Detection: Google Earth Engine & Copernicus Sentinel-1 SAR.
 * 2. Field Command Map: Google Maps JavaScript API v3 locked to Nepal Terai.
 * 3. Healthcare Infrastructure: Live hospital operational status & bed capacity.
 * 4. Demographics & Vulnerability: WorldPop empirical population headcounts.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Moon,
  Phone,
  Satellite,
  Shield,
  ShieldAlert,
  Sun,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

import { Stage51ComparisonPage } from '@/pages/comparison/Stage51ComparisonPage';
import { Stage52GoogleMapPage } from '@/pages/map/Stage52GoogleMapPage';
import { HospitalDirectoryPage } from '@/pages/infrastructure/HospitalDirectoryPage';
import { DemographicsPage } from '@/pages/demographics/DemographicsPage';
import { ExecutiveDashboard } from '@/pages/dashboard/ExecutiveDashboard';

export type NavigationTab = 'dashboard' | 'satellite' | 'command_map' | 'hospitals' | 'demographics';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light', isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const tabs = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Executive Dashboard',
      tagline: 'Govt Officer Landing Console',
      icon: ShieldAlert,
      badge: 'NEOC Command',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    {
      id: 'satellite' as NavigationTab,
      label: 'Satellite Flood Detection',
      tagline: 'Google Earth Engine & SAR',
      icon: Satellite,
      badge: 'Sentinel-1 Radar',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    {
      id: 'command_map' as NavigationTab,
      label: 'Field Command Map',
      tagline: 'Google Maps API Engine',
      icon: Globe,
      badge: 'Interactive Operations',
      badgeColor: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    },
    {
      id: 'hospitals' as NavigationTab,
      label: 'Healthcare Infrastructure',
      tagline: 'Hospitals & Emergency Clinics',
      icon: HeartPulse,
      badge: '8 Facilities Tracked',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'demographics' as NavigationTab,
      label: 'Population Exposure',
      tagline: 'WorldPop 100m Demographics',
      icon: Users,
      badge: '21 Lowland Districts',
      badgeColor: 'border-purple-500/30 bg-purple-500/20 text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────────
          TOP COMMAND HEADER
      ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 md:px-8 backdrop-blur-md shadow-lg">
        {/* Brand & Terai Scope */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">FloodGuard AI</span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                NEPAL TERAI LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              Disaster Intelligence Platform &bull; All 21 Southern Lowland Districts
            </p>
          </div>
        </div>

        {/* Live Metrics Quick Capsule */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5">
            <Waves className="h-4 w-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Terai Inundation</span>
              <span className="font-bold text-cyan-300">642.8 km²</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5">
            <Users className="h-4 w-4 text-purple-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Population at Risk</span>
              <span className="font-bold text-purple-300">1,482,000</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Active Hospitals</span>
              <span className="font-bold text-emerald-300">7 / 8 Operational</span>
            </div>
          </div>
        </div>

        {/* Actions & Theme */}
        <div className="flex items-center gap-2.5">
          <a
            href="tel:1155"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
            title="National Emergency Operations Center Nepal"
          >
            <Phone className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>NEOC 1155</span>
          </a>

          <button
            onClick={toggleTheme}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────
          PRIMARY USER-FRIENDLY NAVIGATION TABS
      ───────────────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-900/60 px-4 md:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-left">
                    <span className="block leading-tight">{tab.label}</span>
                    <span
                      className={`text-[10px] font-medium leading-tight block ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {tab.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>Focus: <strong>Lowland Terai Plain Only</strong> (Himalayas Excluded)</span>
          </div>
        </div>
      </nav>

      {/* ───────────────────────────────────────────────────────────────────────
          ARCHITECTURE DELINEATION INFO STRIP
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 md:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-200">System Architecture:</span>
            <span className="rounded bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 text-[11px] text-cyan-300 font-medium">
              🛰️ <strong>Earth Engine</strong>: Sentinel-1 SAR Flood Inundation &amp; Water Radar Masks
            </span>
            <span className="rounded bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 text-[11px] text-blue-300 font-medium">
              🗺️ <strong>Google Maps API</strong>: Settlements, Population, Hospitals, Roads &amp; Safe Refuges
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span>Boundary: 26.25°N &ndash; 27.90°N (Terai Corridor)</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN CONTENT VIEWPORT
      ───────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'satellite' && <Stage51ComparisonPage />}
        {activeTab === 'command_map' && <Stage52GoogleMapPage />}
        {activeTab === 'hospitals' && <HospitalDirectoryPage />}
        {activeTab === 'demographics' && <DemographicsPage />}
      </main>

      {/* ───────────────────────────────────────────────────────────────────────
          USER-FRIENDLY FOOTER & EMERGENCY HOTLINES
      ───────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-900/90 px-6 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-white">FloodGuard AI</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-300">Nepal Terai Disaster Intelligence &amp; Early Response</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Powered by Copernicus Sentinel-1 Radar SAR + Google Maps JavaScript API v3. Strictly localized to Nepal Terai.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Phone className="h-3.5 w-3.5 text-rose-400" />
              <span>NEOC Hotline: <strong>1155</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
              <span>Nepal Red Cross: <strong>1130</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span>Armed Police Force Rescue: <strong>1114</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
