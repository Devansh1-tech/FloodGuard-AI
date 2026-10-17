/**
 * EmptyState.tsx & ErrorState.tsx — Feedback components for empty data collections and errors.
 */

import React from 'react';
import { AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No data is currently available matching the selected criteria.',
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40',
        className
      )}
    >
      <div className="p-4 rounded-full bg-slate-800 border border-slate-700 text-slate-400 mb-4">
        {icon || <FolderOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the backend.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200',
        className
      )}
    >
      <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-100 mb-1">{title}</h4>
      <p className="text-xs text-rose-300 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          className="border-rose-500/40 hover:bg-rose-500/20 text-rose-200"
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};
