/**
 * ServerErrorPage.tsx — 500 / Backend Offline Error Boundary fallback.
 */

import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ServerErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-3xl bg-red-600/10 border border-red-500/20 text-red-400 mb-6">
        <AlertOctagon className="h-16 w-16" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Service Exception</span>
      <h1 className="text-3xl font-extrabold text-white mb-2">Backend Connection Interrupted</h1>
      <p className="text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
        {error?.message ||
          'Failed to communicate with the FastAPI backend. Ensure the server is active on port 8000.'}
      </p>
      {resetErrorBoundary && (
        <Button
          variant="primary"
          size="md"
          onClick={resetErrorBoundary}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};
