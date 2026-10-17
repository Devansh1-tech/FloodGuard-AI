/**
 * PopulationImpactChart.tsx — Recharts demographic exposure bar/area breakdown.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card';
import { Users } from 'lucide-react';

export interface DemographicData {
  category: string;
  count: number;
  fill: string;
}

export interface PopulationImpactChartProps {
  data?: DemographicData[];
  totalExposed?: number;
}

export const PopulationImpactChart: React.FC<PopulationImpactChartProps> = ({
  data,
  totalExposed = 11961,
}) => {
  const chartData = data || [
    { category: 'Children (<5y)', count: 1376, fill: '#06B6D4' },
    { category: 'Women', count: 5980, fill: '#EC4899' },
    { category: 'Elderly (>60y)', count: 980, fill: '#F59E0B' },
    { category: 'Adult Males', count: 3625, fill: '#3B82F6' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
              Human Population Exposure
            </CardTitle>
            <CardDescription>Vulnerability breakdown in flooded settlements</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Exposed</span>
            <p className="text-base font-bold text-white">{totalExposed.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
                formatter={(val: number) => [`${val.toLocaleString()} persons`, 'Affected']}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={() => <span className="text-slate-300">Exposed Count</span>}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
