/**
 * StatCard.tsx — Enterprise KPI & metric display card with icon, trend, and loading states.
 */

import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  isLoading?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  trend,
  isLoading = false,
  className,
  badge,
}) => {
  return (
    <Card className={cn('p-5 overflow-hidden relative group hover:border-slate-600 transition-all duration-300', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-700/60 animate-pulse rounded-md mt-1" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
              {badge}
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn('p-2.5 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded',
                trend.positive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              )}
            >
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
};
