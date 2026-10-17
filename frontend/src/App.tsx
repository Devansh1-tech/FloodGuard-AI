/**
 * App.tsx — FloodGuard AI Master Stage Controller & Workspace Shell.
 */

import React, { useState } from 'react';
import {
  Compass,
  FileText,
  Globe,
  Layers,
  MapPin,
  Moon,
  Navigation,
  Route,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';

const STAGES = [
  {
    id: '5.1',
    title: 'Stage 5.1: Before & After Satellite Comparison Slider',
    description: 'Pre-flood baseline vs post-flood peak SAR change detection with interactive split slider.',
    icon: Layers,
    status: 'IN_PROGRESS',
    statusLabel: 'CURRENT STAGE',
  },
  {
    id: '5.2',
    title: 'Stage 5.2: Google Maps API Integration',
    description: 'Google Maps JavaScript API support (Satellite/Roadmap) with seamless Leaflet fallback.',
    icon: Globe,
    status: 'UPCOMING',
    statusLabel: 'STAGE 2',
  },
  {
    id: '5.3',
    title: 'Stage 5.3: Flooded Villages & Cities Highlighting',
    description: 'Highlight inundated areas and settlements across Nepal Terai (Koshi / West Rapti).',
    icon: MapPin,
    status: 'UPCOMING',
    statusLabel: 'STAGE 3',
  },
  {
    id: '5.4',
    title: 'Stage 5.4: Road Impact Classification (Red/Orange/Green)',
    description: 'Classify transport arteries into Blocked (Red), Warning (Orange), and Open (Green).',
    icon: Navigation,
    status: 'UPCOMING',
    statusLabel: 'STAGE 4',
  },
  {
    id: '5.5',
    title: 'Stage 5.5: Real Demographics & Hospital Infrastructure',
    description: 'Empirical WorldPop 100m raster headcounts and OSM health facilities (100% real open data).',
    icon: Users,
    status: 'UPCOMING',
    statusLabel: 'STAGE 5',
  },
  {
    id: '5.6',
    title: 'Stage 5.6: Interactive Village Tap-to-Inspect & Directory',
    description: 'Click any settlement on map to trigger live impact popup and risk dossier.',
    icon: Compass,
    status: 'UPCOMING',
    statusLabel: 'STAGE 6',
  },
  {
    id: '5.7',
    title: 'Stage 5.7: Emergency Relief & Medical Route Planning',
    description: 'Dijkstra / A* routing engine avoiding flooded roads to deliver aid and medical supplies.',
    icon: Route,
    status: 'UPCOMING',
    statusLabel: 'STAGE 7',
  },
  {
    id: '5.8',
    title: 'Stage 5.8: Safe Refugee Shelter Recommendation Engine',
    description: 'Ranked high-ground schools, colleges, and grounds outside flood zone with capacity.',
    icon: Shield,
    status: 'UPCOMING',
    statusLabel: 'STAGE 8',
  },
  {
    id: '5.9',
    title: 'Stage 5.9: Public Alternate Safe Route Generator',
    description: 'Civilian travel bypass planning avoiding inundated highway arteries.',
    icon: Navigation,
    status: 'UPCOMING',
    statusLabel: 'STAGE 9',
  },
  {
    id: '5.10',
    title: 'Stage 5.10: Automated Government PDF Disaster Report',
    description: 'Python ReportLab one-click official briefing PDF with maps, tables, and statistics.',
    icon: FileText,
    status: 'UPCOMING',
    statusLabel: 'STAGE 10',
  },
  {
    id: '5.11',
    title: 'Stage 5.11: Unified Disaster Command Center & Live Weather',
    description: 'Complete operational command center combining all 10 modules + live rainfall radar.',
    icon: ShieldAlert,
    status: 'UPCOMING',
    statusLabel: 'STAGE 11 (USP)',
  },
];

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeStageId, setActiveStageId] = useState('5.1');

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light', isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">FloodGuard AI</span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                STAGE-BY-STAGE RELEASE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Nepal Terai Disaster Intelligence Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Active Stage Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-slate-950/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                  READY FOR EXECUTION
                </span>
                <span className="text-xs text-slate-400">Step 1 of 11</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Stage 5.1: Before & After Satellite Comparison Slider
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Cleaned workspace and ready to build. We will compare pre-flood Sentinel-1 SAR imagery
                with peak deluge imagery and provide an interactive split swipe slider.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Workspace Clean & Ready</span>
            </div>
          </div>
        </div>

        {/* 11-Stage Interactive Roadmap Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            11-Point Implementation Roadmap
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              const isCurrent = stage.id === '5.1';

              return (
                <div
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCurrent
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {stage.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{stage.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{stage.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-4 text-xs text-slate-500 text-center">
        FloodGuard AI • Stage-by-Stage Implementation • Strictly Local Development (No GitHub Push)
      </footer>
    </div>
  );
};

export default App;
