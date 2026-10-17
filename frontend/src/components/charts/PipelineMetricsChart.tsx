/**
 * PipelineMetricsChart.tsx — Execution latency breakdown across pipeline stages.
 */

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Gauge } from 'lucide-react';

export interface StageLatency {
  stage: string;
  duration: number;
}

export interface PipelineMetricsChartProps {
  data?: StageLatency[];
  totalDuration?: number;
}

export const PipelineMetricsChart: React.FC<PipelineMetricsChartProps> = ({
  data,
  totalDuration = 7.3,
}) => {
  const chartData = data || [
    { stage: 'Config', duration: 0.1 },
    { stage: 'Validation', duration: 0.2 },
    { stage: 'GEE SAR', duration: 1.8 },
    { stage: 'Detection (Stg2)', duration: 2.9 },
    { stage: 'Settlement (Stg3)', duration: 2.3 },
    { stage: 'Reports', duration: 1.8 },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>
            <Gauge className="h-4 w-4 text-emerald-400" />
            Pipeline Stage Performance
          </CardTitle>
          <span className="text-xs text-slate-400">
            Total: <strong className="text-emerald-400">{totalDuration.toFixed(1)}s</strong>
          </span>
        </div>
        <CardDescription>Execution time per processing stage (seconds)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${val.toFixed(2)}s`, 'Duration']}
              />
              <Area
                type="monotone"
                dataKey="duration"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
