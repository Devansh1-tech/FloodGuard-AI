/**
 * NotFoundPage.tsx — 404 Not Found Page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-6">
        <Compass className="h-16 w-16 animate-spin" style={{ animationDuration: '20s' }} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">Error 404</span>
      <h1 className="text-3xl font-extrabold text-white mb-2">Spatial Coordinate Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The requested disaster dashboard route or geospatial deliverable does not exist within the active workspace.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate('/')}
        leftIcon={<Home className="h-4 w-4" />}
      >
        Return to Command Center
      </Button>
    </div>
  );
};
