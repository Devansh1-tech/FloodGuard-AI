/**
 * Breadcrumb.tsx — Context-aware path navigation breadcrumb.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap: Record<string, string> = {
    analysis: 'Analysis',
    new: 'Wizard',
    jobs: 'Jobs Monitor',
    map: 'Interactive GIS',
    reports: 'Reports',
    artifacts: 'Artifacts',
    system: 'System Telemetry',
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-400 py-2 px-1">
      <Link to="/" className="flex items-center gap-1 hover:text-white transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[segment] || segment;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            {isLast ? (
              <span className="font-semibold text-white capitalize">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-white transition-colors capitalize">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
