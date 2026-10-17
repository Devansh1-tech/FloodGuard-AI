/**
 * Navbar.tsx — Top application navigation bar with live status, theme toggle, and quick launch.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Menu,
  Moon,
  Plus,
  Radio,
  Shield,
  Sun,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useTheme } from '@/hooks/useTheme';

export interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { data: health, isError } = useSystemHealth(12000);

  const isHealthy = !isError && health?.status === 'healthy';
  const isDegraded = !isError && health?.status === 'degraded';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">FloodGuard</span>
              <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[10px] font-bold text-blue-400">AI</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 -mt-1 hidden sm:block">
              Disaster Decision Support
            </span>
          </div>
        </Link>
      </div>

      {/* Center: System Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
        <span className="text-slate-400">Sentinel-1 Engine:</span>
        {isHealthy ? (
          <Badge variant="success" withPulse>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            OPERATIONAL
          </Badge>
        ) : isDegraded ? (
          <Badge variant="warning" withPulse>
            <Radio className="h-3 w-3 mr-1" />
            DEGRADED
          </Badge>
        ) : (
          <Badge variant="danger" withPulse>
            <XCircle className="h-3 w-3 mr-1" />
            OFFLINE
          </Badge>
        )}
      </div>

      {/* Right: Quick Actions & Theme */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/analysis/new')}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shadow-sm shadow-blue-600/30 font-semibold"
        >
          <span className="hidden sm:inline">New Analysis</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-300" />}
        </button>

        {/* Notifications placeholder */}
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative"
          title="Notifications"
          aria-label="System notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </button>
      </div>
    </header>
  );
};
