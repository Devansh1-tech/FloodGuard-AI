/**
 * Badge.tsx — Status and category badges with pulse indicator support.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-700/80 text-slate-200 border border-slate-600',
        primary: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
        info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
        purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        outline: 'border border-slate-600 text-slate-300 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  withPulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  withPulse = false,
  children,
  ...props
}) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {withPulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </div>
  );
};
