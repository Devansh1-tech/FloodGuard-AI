/**
 * Sidebar.tsx — Collapsible enterprise navigation sidebar.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  LayoutDashboard,
  Map,
  Package,
  Server,
  X,
} from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { cn } from '@/utils/cn';

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { data: jobs } = useJobs(undefined, false);
  const activeJobsCount = jobs?.filter((j) => j.status === 'RUNNING' || j.status === 'QUEUED').length || 0;

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Analysis Wizard', to: '/analysis/new', icon: Compass },
    {
      label: 'Jobs Monitor',
      to: '/jobs',
      icon: Activity,
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
    },
    { label: 'Interactive GIS', to: '/map', icon: Map },
    { label: 'Disaster Reports', to: '/reports', icon: FileText },
    { label: 'Deliverable Artifacts', to: '/artifacts', icon: Package },
    { label: 'System & Telemetry', to: '/system', icon: Server },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3">
      {/* Navigation items */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {!isCollapsed && <span>Navigation</span>}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                    isCollapsed && 'justify-center px-2'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                    !isCollapsed && 'mr-3'
                  )}
                />
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle button at bottom (desktop only) */}
      <div className="hidden md:block pt-3 border-t border-slate-800">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : (
            <div className="flex items-center gap-2 text-xs font-medium w-full px-2">
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-md transition-all duration-300 z-30 shrink-0',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[160] w-72 border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
