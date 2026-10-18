/**
 * App.tsx — FloodGuard AI: Nepal Terai Disaster Intelligence Platform.
 *
 * Unified, user-friendly command console:
 * 1. Satellite Flood Detection: Google Earth Engine & Copernicus Sentinel-1 SAR.
 * 2. Field Command Map: Google Maps JavaScript API v3 locked to Nepal Terai.
 * 3. Healthcare Infrastructure: Live hospital operational status & bed capacity.
 * 4. Demographics & Vulnerability: WorldPop empirical population headcounts.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  FileDown,
  Globe,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Moon,
  Phone,
  Route,
  Satellite,
  Shield,
  ShieldAlert,
  Sun,
  Tent,
  Truck,
  Users,
  Waves,
  Zap,
} from 'lucide-react';

import { Stage51ComparisonPage } from '@/pages/comparison/Stage51ComparisonPage';
import { Stage52GoogleMapPage } from '@/pages/map/Stage52GoogleMapPage';
import { Stage54RoadsPage } from '@/pages/roads/Stage54RoadsPage';
import { Stage56RoutingPage } from '@/pages/routing/Stage56RoutingPage';
import { Stage57SafeHavensPage } from '@/pages/havens/Stage57SafeHavensPage';
import { Stage58SitRepPage } from '@/pages/sitrep/Stage58SitRepPage';
import { Stage59RiverGaugesPage } from '@/pages/gauges/Stage59RiverGaugesPage';
import { HospitalDirectoryPage } from '@/pages/infrastructure/HospitalDirectoryPage';
import { DemographicsPage } from '@/pages/demographics/DemographicsPage';
import { ExecutiveDashboard } from '@/pages/dashboard/ExecutiveDashboard';
import CardNav, { CardNavItem, CardNavLink } from '@/components/nav/CardNav';

export type NavigationTab = 'dashboard' | 'satellite' | 'command_map' | 'roads' | 'routing' | 'havens' | 'sitrep' | 'gauges' | 'hospitals' | 'demographics';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light', isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const navLogo = (
    <div className="flex items-center gap-2 font-black text-sm tracking-tight text-white select-none">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-sm shadow-blue-500/30">
        <Shield className="h-4 w-4 text-white" />
      </div>
      <span className="font-extrabold tracking-tight">
        FLOODGUARD<span className="text-cyan-400"> AI</span>
      </span>
      <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30">
        NEPAL GOVT
      </span>
    </div>
  );

  const navItems: CardNavItem[] = [
    {
      label: 'NEOC Command',
      description: 'National Emergency Operations & Terai status.',
      links: [
        { label: 'Executive Dashboard (Overview)', href: '#dashboard' },
        { label: 'Export Official SitRep PDF (5.8)', href: '#sitrep' },
        { label: 'DHM River Gauges & SOS (5.9)', href: '#gauges' },
        { label: 'Terai Lowland Scope (21 Dist.)', href: '#dashboard' },
        { label: 'Live Incident Telemetry', href: '#dashboard' },
      ],
    },
    {
      label: 'Flood Detection',
      description: 'Sentinel-1 SAR Radar & Earth Engine.',
      links: [
        { label: 'Split Deluge Comparison', href: '#satellite' },
        { label: 'Side-by-Side Dual Alignment', href: '#satellite' },
        { label: 'Black & White SAR Radar Mode', href: '#satellite' },
        { label: 'Terai City & Village Picker', href: '#satellite' },
      ],
    },
    {
      label: 'Relief & Alternate Routes',
      description: 'Emergency convoys & evacuation detours.',
      links: [
        { label: 'Emergency Routing Operations (5.6)', href: '#routing' },
        { label: 'Safe Havens & Refugee Camps (5.7)', href: '#havens' },
        { label: 'Point 7: Relief Convoy Router', href: '#routing' },
        { label: 'Point 9: Civilian Evacuation Detours', href: '#routing' },
        { label: 'Road Inundation & Bridges (5.4)', href: '#roads' },
        { label: 'Field Command Map (Live)', href: '#command_map' },
      ],
    },
    {
      label: 'Public Demographics & Hospitals (5.5)',
      description: 'Grounded public data (Google, CBS & MoHP).',
      links: [
        { label: 'Public Census Demographics (5.5)', href: '#demographics' },
        { label: 'MoHP Hospitals & Antivenom (5.5)', href: '#hospitals' },
        { label: 'Settlement AI Dossiers & Depths', href: '#command_map' },
      ],
    },
  ];

  const handleLinkClick = (link: CardNavLink) => {
    if (!link.href) return;
    if (link.href.includes('#dashboard')) {
      setActiveTab('dashboard');
    } else if (link.href.includes('#satellite')) {
      setActiveTab('satellite');
    } else if (link.href.includes('#command_map')) {
      setActiveTab('command_map');
    } else if (link.href.includes('#roads')) {
      setActiveTab('roads');
    } else if (link.href.includes('#routing')) {
      setActiveTab('routing');
    } else if (link.href.includes('#havens')) {
      setActiveTab('havens');
    } else if (link.href.includes('#sitrep')) {
      setActiveTab('sitrep');
    } else if (link.href.includes('#gauges')) {
      setActiveTab('gauges');
    } else if (link.href.includes('#hospitals')) {
      setActiveTab('hospitals');
    } else if (link.href.includes('#demographics')) {
      setActiveTab('demographics');
    }
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
      id: 'roads' as NavigationTab,
      label: 'Road Inundation (5.4)',
      tagline: 'Highways & Cut-Off Zones',
      icon: Truck,
      badge: 'Point 4 Disruption',
      badgeColor: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
    },
    {
      id: 'routing' as NavigationTab,
      label: 'Emergency Routes (5.6)',
      tagline: 'Convoys & Evacuation',
      icon: Route,
      badge: 'Points 7 & 9',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    {
      id: 'havens' as NavigationTab,
      label: 'Safe Havens (5.7)',
      tagline: 'Refugee Camps & HLZ',
      icon: Tent,
      badge: 'Point 8 Proximity',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'sitrep' as NavigationTab,
      label: 'Govt SitRep (5.8)',
      tagline: 'Official PDF Export',
      icon: FileDown,
      badge: 'Point 10 PDF',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    {
      id: 'gauges' as NavigationTab,
      label: 'River Gauges & SOS (5.9)',
      tagline: 'DHM Telemetry & Alerts',
      icon: Waves,
      badge: 'Point 11 Early Warning',
      badgeColor: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    },
    {
      id: 'hospitals' as NavigationTab,
      label: 'Public Hospitals (5.5)',
      tagline: 'Beds, ICU & Antivenom',
      icon: HeartPulse,
      badge: 'Public MoHP Data',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'demographics' as NavigationTab,
      label: 'Public Demographics (5.5)',
      tagline: 'Census 2021 & Gemini AI',
      icon: Users,
      badge: 'Points 5 & 6',
      badgeColor: 'border-purple-500/30 bg-purple-500/20 text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────────
          CARDNAV MASTER NAVIGATION BAR (React Bits Component)
      ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-md px-3 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1">
            <CardNav
              logo={navLogo}
              logoAlt="FloodGuard AI Nepal"
              items={navItems}
              cta={{ label: 'NEOC SOS 1155', href: 'tel:1155' }}
              theme={isDark ? 'dark' : 'light'}
              surface="glass"
              cardEffect="rise"
              openOn="click"
              maxWidth={940}
              accentColor="#f43f5e"
              onLinkClick={handleLinkClick}
            />
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('sitrep')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 hover:from-rose-500 hover:to-amber-500 transition-all border border-rose-400/30 cursor-pointer"
              title="Export Official Government Situation Report (PDF)"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">SitRep (PDF)</span>
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-700 bg-slate-800/90 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
            </button>
          </div>
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
        {activeTab === 'roads' && <Stage54RoadsPage />}
        {activeTab === 'routing' && <Stage56RoutingPage />}
        {activeTab === 'havens' && <Stage57SafeHavensPage />}
        {activeTab === 'sitrep' && <Stage58SitRepPage />}
        {activeTab === 'gauges' && <Stage59RiverGaugesPage />}
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
