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
import { LandingHeroPage } from '@/pages/landing/LandingHeroPage';
import CardNav, { CardNavItem, CardNavLink } from '@/components/nav/CardNav';
import { AboutModal } from '@/components/common/AboutModal';
import { FaqModal } from '@/components/common/FaqModal';
import { ContactModal } from '@/components/common/ContactModal';

export type NavigationTab = 'landing' | 'dashboard' | 'satellite' | 'command_map' | 'roads' | 'routing' | 'havens' | 'sitrep' | 'gauges' | 'hospitals' | 'demographics';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

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
    <span className="font-extrabold text-sm sm:text-base tracking-tight text-white select-none whitespace-nowrap">
      Floodguard AI
    </span>
  );

  const navItems: CardNavItem[] = [
    {
      label: '🛡️ NEOC Command',
      description: 'National Emergency Operations & Terai river alerts.',
      links: [
        {
          label: 'Home & Sovereign Overview',
          sublabel: 'Public Landing & Hero Mission',
          href: '#landing',
          isActive: activeTab === 'landing',
        },
        {
          label: 'Executive Dashboard',
          sublabel: 'Govt Officer Landing Console',
          href: '#dashboard',
          isActive: activeTab === 'dashboard',
        },
        {
          label: 'River Gauges & SOS (5.9)',
          sublabel: 'DHM Telemetry & Alerts',
          href: '#gauges',
          isActive: activeTab === 'gauges',
        },
        {
          label: 'Govt SitRep (5.8)',
          sublabel: 'Official PDF Export',
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
      label: '🛰️ Flood Detection & Maps',
      description: 'Copernicus Sentinel-1 SAR & Google Maps Engine.',
      links: [
        {
          label: 'Satellite Flood Detection',
          sublabel: 'Google Earth Engine & SAR',
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
          label: 'Split Deluge Comparison',
          sublabel: 'Dual-Pane Slider Alignment',
          href: '#satellite',
        },
        {
          label: 'Terai Settlement Picker',
          sublabel: 'Inundated Towns & Wards',
          href: '#command_map',
        },
      ],
    },
    {
      label: '🚛 Relief & Alternate Routes',
      description: 'Emergency convoys & evacuation detours.',
      links: [
        {
          label: 'Road Inundation (5.4)',
          sublabel: 'Highways & Cut-Off Zones',
          href: '#roads',
          isActive: activeTab === 'roads',
        },
        {
          label: 'Emergency Routes (5.6)',
          sublabel: 'Convoys & Evacuation',
          href: '#routing',
          isActive: activeTab === 'routing',
        },
        {
          label: 'Safe Havens (5.7)',
          sublabel: 'Refugee Camps & HLZ',
          href: '#havens',
          isActive: activeTab === 'havens',
        },
        {
          label: 'Point 7: Convoy Router',
          sublabel: 'Tactical Relief Dispatch',
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
      label: '👥 Demographics & Hospitals (5.5)',
      description: 'Grounded public data (Google, CBS & MoHP).',
      links: [
        {
          label: 'Public Hospitals (5.5)',
          sublabel: 'Beds, ICU & Antivenom',
          href: '#hospitals',
          isActive: activeTab === 'hospitals',
        },
        {
          label: 'Public Demographics (5.5)',
          sublabel: 'Census 2021 & Gemini AI',
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
          sublabel: 'MoHP Snakebite Treatment Depots',
          href: '#hospitals',
        },
      ],
    },
  ];

  const handleLinkClick = (link: CardNavLink) => {
    if (!link.href) return;
    if (link.href.includes('#landing')) {
      setActiveTab('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#dashboard')) {
      setActiveTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#satellite')) {
      setActiveTab('satellite');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#command_map')) {
      setActiveTab('command_map');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#roads')) {
      setActiveTab('roads');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#routing')) {
      setActiveTab('routing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#havens')) {
      setActiveTab('havens');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#sitrep')) {
      setActiveTab('sitrep');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#gauges')) {
      setActiveTab('gauges');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#hospitals')) {
      setActiveTab('hospitals');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.href.includes('#demographics')) {
      setActiveTab('demographics');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tabInfoMap: Record<
    NavigationTab,
    { label: string; tagline: string; icon: React.ComponentType<{ className?: string }>; badge: string; badgeColor: string }
  > = {
    landing: {
      label: 'Home & Sovereign Overview',
      tagline: 'Nepal Terai Early Defense & Satellite Radar',
      icon: Shield,
      badge: 'Public Portal',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    dashboard: {
      label: 'Executive Dashboard',
      tagline: 'Govt Officer Landing Console',
      icon: ShieldAlert,
      badge: 'NEOC Command',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    satellite: {
      label: 'Satellite Flood Detection',
      tagline: 'Google Earth Engine & SAR',
      icon: Satellite,
      badge: 'Stage 5.1 Sentinel-1',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    command_map: {
      label: 'Field Command Map',
      tagline: 'Google Maps API Engine',
      icon: Globe,
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
      icon: Route,
      badge: 'Stage 5.6 Points 7 & 9',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400',
    },
    havens: {
      label: 'Safe Havens & Refugee Camps',
      tagline: 'Sphere Standards & HLZ',
      icon: Tent,
      badge: 'Stage 5.7 Point 8',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    sitrep: {
      label: 'Govt SitRep PDF Export',
      tagline: 'Official UN-SPIDER SitRep',
      icon: FileDown,
      badge: 'Stage 5.8 Point 10',
      badgeColor: 'border-rose-500/30 bg-rose-500/20 text-rose-400',
    },
    gauges: {
      label: 'DHM River Gauges & SOS',
      tagline: 'Real-Time Telemetry & Alerts',
      icon: Waves,
      badge: 'Stage 5.9 Point 11',
      badgeColor: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    },
    hospitals: {
      label: 'Public Hospitals & Antivenom',
      tagline: 'Beds, ICU & Antivenom Stock',
      icon: HeartPulse,
      badge: 'Stage 5.5 MoHP Data',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    },
    demographics: {
      label: 'Public Demographics & AI',
      tagline: 'Census 2021 & Gemini AI',
      icon: Users,
      badge: 'Stage 5.5 Points 5 & 6',
      badgeColor: 'border-purple-500/30 bg-purple-500/20 text-purple-400',
    },
  };

  const currentTab = tabInfoMap[activeTab];
  const CurrentIcon = currentTab.icon;

  const navLeftSlot = (
    <div className="hidden md:flex items-center gap-1 ml-1.5">
      <button
        onClick={() => {
          setActiveTab('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'landing'
            ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
        title="Go to Public Landing & Hero Overview"
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
            ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }`}
        title="Go to Executive Overview Dashboard"
      >
        Dashboard
      </button>
      <button
        onClick={() => setIsAboutOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
        title="About FloodGuard AI Platform"
      >
        About
      </button>
      <button
        onClick={() => setIsFaqOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
        title="Frequently Asked Questions & Radar Guide"
      >
        FAQ
      </button>
      <button
        onClick={() => setIsContactOpen(true)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent transition-all cursor-pointer"
        title="Emergency Operations Hotlines & Signal Dispatch"
      >
        Contact
      </button>
    </div>
  );

  const dropdownHeader = (
    <div className="flex flex-wrap items-center justify-between gap-2 w-full text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Quick Links:</span>
        <button
          onClick={() => {
            setActiveTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            activeTab === 'landing' ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-300 hover:text-white'
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
            activeTab === 'dashboard' ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-300 hover:text-white'
          }`}
        >
          Dashboard
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
        <button
          onClick={() => setIsContactOpen(true)}
          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Contact
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-cyan-400">
        <span>Nepal Terai Sovereign AI Ops</span>
      </div>
    </div>
  );

  const navRightSlot = (
    <button
      onClick={toggleTheme}
      className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
      title="Toggle Light / Dark Theme"
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────────
          MAIN NAVIGATION BAR (Full Width Edge-to-Edge)
      ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#07090e]/95 backdrop-blur-md px-2 sm:px-4 py-2">
        <div className="w-full">
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
            accentColor="#06b6d4"
            onLinkClick={handleLinkClick}
            leftSlot={navLeftSlot}
            rightSlot={navRightSlot}
            dropdownHeader={dropdownHeader}
          />
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────
          SLIM STATUS & CONTEXT BREADCRUMB STRIP (Replaces bulky secondary nav)
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-4 md:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono">NEOC Command &bull;</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <CurrentIcon className="h-3.5 w-3.5 text-cyan-400" />
              <span>{currentTab.label}</span>
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${currentTab.badgeColor}`}>
              {currentTab.badge}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-medium">Telemetry Online</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>21 Southern Nepal Terai Districts (26.20°N &ndash; 28.35°N)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN CONTENT VIEWPORT
      ───────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
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

      {/* Informational & Dispatch Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default App;
