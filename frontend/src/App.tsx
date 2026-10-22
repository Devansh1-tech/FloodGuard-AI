/**
 * App.tsx — FloodGuard AI: Nepal Terai Rapid Flood Monitoring & Decision Support System.
 *
 * Enterprise Emergency Command Center built for NEOC, MoHA, and APF.
 * Adheres strictly to SKILL.md:
 * - VISUAL_DENSITY: 8 (Cockpit / Command Center Mode)
 * - TYPOGRAPHY: Geist/Satoshi display UI, JetBrains Mono for telemetry
 * - COLOR PALETTE: Deep Slate #0F172A Canvas, #1E293B Panels, #F8FAFC text
 * - ANTI-EMOJI POLICY: Exclusively Phosphor / Radix / clean SVG icons
 * - VIEWPORT STABILITY: min-h-[100dvh] outer layout
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldWarning,
  Waves,
  Truck,
  FirstAid,
  FilePdf,
  PhoneCall,
  Broadcast,
  Sun,
  Moon,
  MapPin,
  Crosshair,
  Compass,
  UsersThree,
} from '@phosphor-icons/react';

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
import { LandingHeroPage } from '@/pages/landing/LandingHeroPage';
import CardNav, { CardNavItem, CardNavLink } from '@/components/nav/CardNav';
import { AboutModal } from '@/components/common/AboutModal';
import { FaqModal } from '@/components/common/FaqModal';
import { ContactModal } from '@/components/common/ContactModal';

export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'satellite'
  | 'command_map'
  | 'roads'
  | 'routing'
  | 'havens'
  | 'sitrep'
  | 'gauges'
  | 'hospitals'
  | 'demographics';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (
        hash &&
        [
          'landing',
          'dashboard',
          'satellite',
          'command_map',
          'roads',
          'routing',
          'havens',
          'sitrep',
          'gauges',
          'hospitals',
          'demographics',
        ].includes(hash)
      ) {
        setActiveTab(hash as NavigationTab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light', isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  const navLogo = (
    <div className="flex items-center gap-2 select-none">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
        <ShieldCheck size={18} weight="bold" />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
          FloodGuard AI
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold hidden sm:inline">
          Nepal Terai Decision Support
        </span>
      </div>
    </div>
  );

  // Anti-emoji cleaned navigation items
  const navItems: CardNavItem[] = [
    {
      label: 'NEOC Command',
      description: 'National Emergency Operations & Terai river alerts.',
      links: [
        {
          label: 'System Overview & Mission',
          sublabel: 'Operational Landing & Verification',
          href: '#landing',
          isActive: activeTab === 'landing',
        },
        {
          label: 'Executive Command Console',
          sublabel: '3-Pane Emergency Command Center',
          href: '#dashboard',
          isActive: activeTab === 'dashboard',
        },
        {
          label: 'River Gauges & SOS (5.9)',
          sublabel: 'DHM Hydrology Telemetry',
          href: '#gauges',
          isActive: activeTab === 'gauges',
        },
        {
          label: 'Official SitRep PDF (5.8)',
          sublabel: 'UN-SPIDER Compliant Export',
          href: '#sitrep',
          isActive: activeTab === 'sitrep',
        },
        {
          label: 'Terai Lowland Scope',
          sublabel: '21 Districts Coverage',
          href: '#dashboard',
        },
      ],
    },
    {
      label: 'Flood Detection & Maps',
      description: 'Copernicus Sentinel-1 SAR & Google Maps Engine.',
      links: [
        {
          label: 'Satellite Flood Detection',
          sublabel: 'Sentinel-1 SAR Change Detection',
          href: '#satellite',
          isActive: activeTab === 'satellite',
        },
        {
          label: 'Field Command Map',
          sublabel: 'Google Maps API Engine',
          href: '#command_map',
          isActive: activeTab === 'command_map',
        },
        {
          label: 'Optical Flood Pipeline (PS-01)',
          sublabel: 'Spectral Indices & Settlements',
          href: '#satellite',
          isActive: activeTab === 'satellite',
        },
        {
          label: 'Terai Settlement Picker',
          sublabel: 'Inundated Towns & Wards',
          href: '#command_map',
        },
      ],
    },
    {
      label: 'Relief & Alternate Routes',
      description: 'Emergency convoys & civilian evacuation detours.',
      links: [
        {
          label: 'Road Inundation (5.4)',
          sublabel: 'Highways & Cut-Off Corridors',
          href: '#roads',
          isActive: activeTab === 'roads',
        },
        {
          label: 'Emergency Routes (5.6)',
          sublabel: 'Tactical Convoys & Evacuation',
          href: '#routing',
          isActive: activeTab === 'routing',
        },
        {
          label: 'Safe Havens (5.7)',
          sublabel: 'Sphere Shelters & HLZs',
          href: '#havens',
          isActive: activeTab === 'havens',
        },
        {
          label: 'Point 7: Convoy Router',
          sublabel: 'Relief Staging & Dispatch',
          href: '#routing',
        },
        {
          label: 'Point 9: Evacuation Detours',
          sublabel: 'Civilian Safe Corridors',
          href: '#routing',
        },
      ],
    },
    {
      label: 'Demographics & Hospitals (5.5)',
      description: 'Grounded public data (Google, CBS & MoHP).',
      links: [
        {
          label: 'Public Hospitals (5.5)',
          sublabel: 'Beds, ICU & Antivenom Stock',
          href: '#hospitals',
          isActive: activeTab === 'hospitals',
        },
        {
          label: 'Public Demographics (5.5)',
          sublabel: 'Census 2021 & WorldPop Model',
          href: '#demographics',
          isActive: activeTab === 'demographics',
        },
        {
          label: 'Settlement AI Dossiers',
          sublabel: 'Grounded Vulnerability Depth',
          href: '#demographics',
        },
        {
          label: 'Emergency Antivenom Supply',
          sublabel: 'MoHP Snakebite Treatment Stock',
          href: '#hospitals',
        },
      ],
    },
  ];

  const handleLinkClick = (link: CardNavLink) => {
    if (!link.href) return;
    const tab = link.href.replace('#', '') as NavigationTab;
    if (tab) {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabInfoMap: Record<
    NavigationTab,
    { label: string; tagline: string; icon: React.ElementType; badge: string; badgeColor: string }
  > = {
    landing: {
      label: 'Mission Overview & Verification',
      tagline: 'Nepal Terai Rapid Flood Monitoring & Decision Support',
      icon: ShieldCheck,
      badge: 'Public Portal',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    dashboard: {
      label: 'Emergency Command Center',
      tagline: '3-Pane Operational Intelligence Console',
      icon: Crosshair,
      badge: 'NEOC Command',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    satellite: {
      label: 'Optical Satellite Flood Detection',
      tagline: 'PS-01: Spectral Indices & 4-Tier Settlement Impact',
      icon: Waves,
      badge: 'PS-01 Compliant',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    command_map: {
      label: 'Field Command Map',
      tagline: 'Google Maps API Engine & Inundated Settlements',
      icon: MapPin,
      badge: 'Stage 5.2/5.3 Operations',
      badgeColor: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    },
    roads: {
      label: 'Road Inundation & Bridges',
      tagline: 'Highways & Cut-Off Zones',
      icon: Truck,
      badge: 'Stage 5.4 Disruption',
      badgeColor: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
    },
    routing: {
      label: 'Emergency Routes & Convoys',
      tagline: 'Convoys & Evacuation Detours',
      icon: Compass,
      badge: 'Stage 5.6 Points 7 & 9',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    havens: {
      label: 'Safe Havens & Refugee Camps',
      tagline: 'Sphere Standards & Helicopter Landing Zones',
      icon: ShieldCheck,
      badge: 'Stage 5.7 Point 8',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    sitrep: {
      label: 'Govt SitRep PDF Export',
      tagline: 'Official UN-SPIDER SitRep',
      icon: FilePdf,
      badge: 'Stage 5.8 Point 10',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    gauges: {
      label: 'DHM River Gauges & SOS',
      tagline: 'Real-Time Telemetry & Bilingual Broadcasts',
      icon: Waves,
      badge: 'Stage 5.9 Point 11',
      badgeColor: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    },
    hospitals: {
      label: 'Public Hospitals & Antivenom',
      tagline: 'Beds, ICU & Antivenom Stock',
      icon: FirstAid,
      badge: 'Stage 5.5 MoHP Data',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    demographics: {
      label: 'Public Demographics & AI',
      tagline: 'Census 2021 & WorldPop Model',
      icon: UsersThree,
      badge: 'Stage 5.5 Points 5 & 6',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
  };

  const currentTab = tabInfoMap[activeTab];
  const CurrentIcon = currentTab.icon;

  const navLeftSlot = (
    <div className="hidden md:flex items-center gap-1 ml-1.5 font-sans">
      <button
        onClick={() => {
          setActiveTab('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'landing'
            ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
      >
        Home
      </button>
      <button
        onClick={() => {
          setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'dashboard'
            ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
      >
        Command Center
      </button>
      <button
        onClick={() => setIsAboutOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
      >
        About
      </button>
      <button
        onClick={() => setIsFaqOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
      >
        FAQ
      </button>
      <button
        onClick={() => setIsContactOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
      >
        Hotlines
      </button>
    </div>
  );

  const dropdownHeader = (
    <div className="flex flex-wrap items-center justify-between gap-2 w-full text-xs font-sans">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Quick Links:</span>
        <button
          onClick={() => {
            setActiveTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'landing' ? 'text-emerald-300 bg-emerald-500/20' : 'text-slate-300 hover:text-white'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-300 bg-emerald-500/20' : 'text-slate-300 hover:text-white'
          }`}
        >
          Command Center
        </button>
        <button
          onClick={() => setIsAboutOpen(true)}
          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          About
        </button>
        <button
          onClick={() => setIsFaqOpen(true)}
          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          FAQ
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-400">
        <span>Nepal Terai Decision Support Ops</span>
      </div>
    </div>
  );

  const navRightSlot = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
      >
        <Crosshair size={14} weight="bold" />
        <span>Command Console</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('sitrep');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#1E293B] hover:bg-[#334155] px-3 py-1.5 text-xs font-bold text-[#F8FAFC] shadow-sm transition-all active:scale-[0.98] cursor-pointer"
      >
        <FilePdf size={14} weight="bold" className="text-rose-400" />
        <span>SITREP</span>
      </button>

      <button
        onClick={toggleTheme}
        className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        title="Toggle Theme"
        aria-label="Toggle Theme"
      >
        {isDark ? <Sun size={15} weight="bold" className="text-amber-400" /> : <Moon size={15} weight="bold" className="text-slate-300" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────────
          1. TOP EMERGENCY RIBBON BAR (Prominently displayed)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#1E293B] border-b border-white/10 px-4 py-1.5 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">● LIVE TELEMETRY ONLINE</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-[#94A3B8]">
              Nepal Terai Rapid Flood Monitoring &amp; Decision Support System
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:1155" className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1">
              <PhoneCall size={12} weight="bold" />
              <span>NEOC Hotline: 1155</span>
            </a>
            <span className="text-slate-600">&bull;</span>
            <a href="tel:1130" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
              <FirstAid size={12} weight="bold" />
              <span>Nepal Red Cross: 1130</span>
            </a>
            <span className="text-slate-600">&bull;</span>
            <a href="tel:1114" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
              <ShieldWarning size={12} weight="bold" />
              <span>APF: 1114</span>
            </a>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          2. MAIN NAVIGATION BAR
      ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[100] w-full border-b border-white/10 bg-[#0F172A]/95 backdrop-blur-md px-2 sm:px-4 py-2">
        <div className="w-full max-w-7xl mx-auto">
          <CardNav
            logo={navLogo}
            logoAlt="FloodGuard AI Nepal"
            items={navItems}
            cta={{ label: 'NEOC SOS 1155', href: 'tel:1155' }}
            theme={isDark ? 'dark' : 'light'}
            surface="glass"
            cardEffect="rise"
            openOn="click"
            cardHeight={175}
            maxWidth="100%"
            accentColor="#10B981"
            onLinkClick={handleLinkClick}
            leftSlot={navLeftSlot}
            rightSlot={navRightSlot}
            dropdownHeader={dropdownHeader}
          />
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────
          3. SLIM STATUS & CONTEXT BREADCRUMB STRIP
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#1E293B]/70 border-b border-white/10 px-4 md:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400">NEOC Command &bull;</span>
            <span className="flex items-center gap-1.5 font-bold text-white">
              <CurrentIcon size={14} weight="bold" className="text-emerald-400" />
              <span>{currentTab.label}</span>
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${currentTab.badgeColor}`}>
              {currentTab.badge}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#94A3B8] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-medium">Copernicus S1 SAR Linked</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} weight="bold" className="text-cyan-400" />
              <span>21 Terai Districts (26.20°N &ndash; 28.35°N)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          4. MAIN CONTENT VIEWPORT
      ───────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'landing' && (
          <LandingHeroPage
            onMoveToDashboard={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
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
          5. OFFICIAL GOVERNMENT FOOTER & EMERGENCY HOTLINES
      ───────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#1E293B] px-6 py-5 text-xs text-[#94A3B8] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-white">FloodGuard AI</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-[#F8FAFC]">Nepal Terai Rapid Flood Monitoring &amp; Decision Support System</span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Powered by Copernicus Sentinel-1 Radar SAR + Google Maps JavaScript API v3. Strictly localized to Nepal Terai Lowlands.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <PhoneCall size={13} weight="bold" className="text-rose-400" />
              <span>NEOC Hotline: <strong>1155</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <FirstAid size={13} weight="bold" className="text-emerald-400" />
              <span>Nepal Red Cross: <strong>1130</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck size={13} weight="bold" className="text-blue-400" />
              <span>APF Rescue: <strong>1114</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Informational & Dispatch Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default App;
