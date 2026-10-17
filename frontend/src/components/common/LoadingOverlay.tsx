/**
 * LoadingOverlay.tsx & Spinner.tsx — Feedback components for loading states.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={cn('animate-spin text-blue-500', sizeClasses[size], className)} />
      {label && <p className="text-xs font-medium text-slate-400 animate-pulse">{label}</p>}
    </div>
  );
};

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Processing...' }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl glass-card max-w-sm text-center">
        <Spinner size="xl" />
        <h3 className="text-base font-semibold text-white">FloodGuard AI</h3>
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-700/50', className)}
      {...props}
    />
  );
};
