/**
 * Footer.tsx — Application footer with operational telemetry and version labels.
 */

import React from 'react';
import { Database, Globe, HardDrive } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemHealth';

export const Footer: React.FC = () => {
  const { data: config } = useSystemConfig();

  return (
    <footer className="border-t border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-500 backdrop-blur-md">
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-400">FloodGuard AI Platform v1.0.0</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Globe className="h-3 w-3 text-blue-400" />
            GEE: {config?.earth_engine_project || 'home-credit-505106'}
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Database className="h-3 w-3 text-emerald-400" />
            DB: SQLite/PostGIS
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <HardDrive className="h-3 w-3 text-amber-400" />
            Storage: Local/S3
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>Enterprise Disaster Risk Management</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </footer>
  );
};
